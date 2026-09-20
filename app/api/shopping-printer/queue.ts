import { env } from 'cloudflare:workers';
import { ensureShoppingPrinterSchema } from '@/db/shopping-printer';

type ShoppingPrinterEnv = {
  DB?: D1Database;
  SHOPPING_BUTTON_TOKEN?: string;
  SHOPPING_BRIDGE_TOKEN?: string;
  SHOPPING_PRINTER_TOKEN?: string;
};

type ShoppingPrinterConfiguration = {
  db: D1Database;
  buttonToken: string;
  bridgeToken: string;
  printerToken: string;
};

type JsonObject = Record<string, unknown>;

type RequestRow = {
  id: string;
  status: string;
};

type SourceClaimRow = {
  id: string;
};

type PrintClaimRow = {
  id: string;
  items_json: string;
};

class RequestValidationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const MAX_BODY_BYTES = 16_384;
const MAX_ITEMS = 60;
const MAX_ITEM_CHARACTERS = 120;
const LEASE_SECONDS = 90;
const RETENTION_SECONDS = 7 * 24 * 60 * 60;

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function readConfiguration(): ShoppingPrinterConfiguration {
  const bindings = env as unknown as ShoppingPrinterEnv;
  const buttonToken = bindings.SHOPPING_BUTTON_TOKEN?.trim() ?? '';
  const bridgeToken = bindings.SHOPPING_BRIDGE_TOKEN?.trim() ?? '';
  const printerToken = bindings.SHOPPING_PRINTER_TOKEN?.trim() ?? '';

  if (!bindings.DB) throw new Error('Missing D1 binding: DB');
  if ([buttonToken, bridgeToken, printerToken].some((token) => token.length < 32)) {
    throw new Error('Shopping-printer API tokens must each contain at least 32 characters');
  }
  if (new Set([buttonToken, bridgeToken, printerToken]).size !== 3) {
    throw new Error('Shopping-printer API tokens must be different');
  }

  return {
    db: bindings.DB,
    buttonToken,
    bridgeToken,
    printerToken,
  };
}

function tokenForAction(
  action: string,
  configuration: ShoppingPrinterConfiguration,
): string | null {
  switch (action) {
    case 'request':
      return configuration.buttonToken;
    case 'claim-source':
    case 'fulfill':
    case 'fail-source':
      return configuration.bridgeToken;
    case 'claim-print':
    case 'complete-print':
    case 'fail-print':
      return configuration.printerToken;
    default:
      return null;
  }
}

export async function handleShoppingPrinterRequest(request: Request): Promise<Response> {
  const requestID = randomHex(6);
  const action = new URL(request.url).searchParams.get('action') ?? '';
  if (![
    'request',
    'claim-source',
    'fulfill',
    'fail-source',
    'claim-print',
    'complete-print',
    'fail-print',
  ].includes(action)) {
    return errorResponse(404, 'Not found');
  }

  try {
    const configuration = readConfiguration();
    const expectedToken = tokenForAction(action, configuration);
    if (!expectedToken || !(await authorized(request, expectedToken))) {
      return errorResponse(401, 'Unauthorized');
    }

    const body = await readJsonObject(request);
    await ensureShoppingPrinterSchema(configuration.db);
    await releaseExpiredLeases(configuration.db);

    switch (action) {
      case 'request':
        return createRequest(configuration.db);
      case 'claim-source':
        return claimSource(configuration.db, body);
      case 'fulfill':
        return fulfill(configuration.db, body);
      case 'fail-source':
        return failSource(configuration.db, body);
      case 'claim-print':
        return claimPrint(configuration.db, body);
      case 'complete-print':
        return completePrint(configuration.db, body);
      case 'fail-print':
        return failPrint(configuration.db, body);
      default:
        return errorResponse(404, 'Not found');
    }
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return errorResponse(error.status, error.message);
    }
    console.error(
      `shopping-printer API error ${requestID}`,
      error instanceof Error ? error.message : error,
    );
    return jsonResponse(500, { ok: false, error: 'Server error', request_id: requestID });
  }
}

async function createRequest(db: D1Database): Promise<Response> {
  const now = unixTime();
  await db.prepare(`
    DELETE FROM shopping_print_requests
    WHERE status IN ('printed', 'failed') AND updated_at < ?
  `).bind(now - RETENTION_SECONDS).run();

  const existing = await db.prepare(`
    SELECT id, status
    FROM shopping_print_requests
    WHERE status IN ('requested', 'source_claimed', 'ready', 'print_claimed')
    ORDER BY created_at
    LIMIT 1
  `).first<RequestRow>();
  if (existing) {
    return jsonResponse(200, {
      ok: true,
      request_id: existing.id,
      status: existing.status,
      duplicate: true,
    });
  }

  const id = crypto.randomUUID();
  const insert = await db.prepare(`
    INSERT OR IGNORE INTO shopping_print_requests (
      id, active_slot, status, items_json, available_at, created_at, updated_at
    ) VALUES (?, 1, 'requested', '[]', ?, ?, ?)
  `).bind(id, now, now, now).run();
  if ((insert.meta.changes ?? 0) !== 1) {
    const concurrent = await db.prepare(`
      SELECT id, status
      FROM shopping_print_requests
      WHERE active_slot = 1
      LIMIT 1
    `).first<RequestRow>();
    if (!concurrent) throw new Error('Active shopping request could not be reloaded');
    return jsonResponse(200, {
      ok: true,
      request_id: concurrent.id,
      status: concurrent.status,
      duplicate: true,
    });
  }

  return jsonResponse(202, { ok: true, request_id: id, status: 'requested' });
}

async function claimSource(db: D1Database, body: JsonObject): Promise<Response> {
  const bridgeID = requiredIdentifier(body.bridge_id, 'bridge_id');
  const now = unixTime();
  const claimToken = randomHex(32);
  const claimHash = await sha256(claimToken);

  const update = await db.prepare(`
    UPDATE shopping_print_requests
    SET
      status = 'source_claimed',
      source_attempts = source_attempts + 1,
      source_claimed_by = ?,
      source_claim_token_hash = ?,
      source_lease_until = ?,
      updated_at = ?
    WHERE id = (
      SELECT id
      FROM shopping_print_requests
      WHERE status = 'requested'
        AND available_at <= ?
        AND source_attempts < max_attempts
      ORDER BY created_at
      LIMIT 1
    ) AND status = 'requested'
  `).bind(bridgeID, claimHash, now + LEASE_SECONDS, now, now).run();
  if ((update.meta.changes ?? 0) !== 1) return emptyResponse();

  const row = await db.prepare(`
    SELECT id
    FROM shopping_print_requests
    WHERE status = 'source_claimed'
      AND source_claimed_by = ?
      AND source_claim_token_hash = ?
  `).bind(bridgeID, claimHash).first<SourceClaimRow>();
  if (!row) throw new Error('Claimed source request could not be reloaded');

  return jsonResponse(200, {
    ok: true,
    job: { request_id: row.id, claim_token: claimToken },
  });
}

async function fulfill(db: D1Database, body: JsonObject): Promise<Response> {
  const requestID = requiredUUID(body.request_id, 'request_id');
  const claimHash = await sha256(requiredClaimToken(body.claim_token));
  const items = cleanItems(body.items);
  const now = unixTime();
  const result = await db.prepare(`
    UPDATE shopping_print_requests
    SET
      status = 'ready',
      items_json = ?,
      available_at = ?,
      source_claimed_by = NULL,
      source_claim_token_hash = NULL,
      source_lease_until = NULL,
      last_error = NULL,
      updated_at = ?
    WHERE id = ?
      AND status = 'source_claimed'
      AND source_claim_token_hash = ?
  `).bind(JSON.stringify(items), now, now, requestID, claimHash).run();
  if ((result.meta.changes ?? 0) !== 1) {
    return errorResponse(409, 'Source lease is invalid or expired');
  }
  return jsonResponse(200, { ok: true, request_id: requestID, status: 'ready' });
}

async function failSource(db: D1Database, body: JsonObject): Promise<Response> {
  const requestID = requiredUUID(body.request_id, 'request_id');
  const claimHash = await sha256(requiredClaimToken(body.claim_token));
  const retry = body.retry === true ? 1 : 0;
  const message = cleanError(body.error);
  const now = unixTime();
  const result = await db.prepare(`
    UPDATE shopping_print_requests
    SET
      status = CASE
        WHEN ? = 1 AND source_attempts < max_attempts THEN 'requested'
        ELSE 'failed'
      END,
      active_slot = CASE
        WHEN ? = 1 AND source_attempts < max_attempts THEN 1
        ELSE NULL
      END,
      available_at = ?,
      source_claimed_by = NULL,
      source_claim_token_hash = NULL,
      source_lease_until = NULL,
      last_error = ?,
      updated_at = ?
    WHERE id = ?
      AND status = 'source_claimed'
      AND source_claim_token_hash = ?
  `).bind(retry, retry, now + 5, message, now, requestID, claimHash).run();
  if ((result.meta.changes ?? 0) !== 1) {
    return errorResponse(409, 'Source lease is invalid or expired');
  }
  return jsonResponse(200, { ok: true });
}

async function claimPrint(db: D1Database, body: JsonObject): Promise<Response> {
  const printerID = requiredIdentifier(body.printer_id, 'printer_id');
  const now = unixTime();
  const claimToken = randomHex(32);
  const claimHash = await sha256(claimToken);

  const update = await db.prepare(`
    UPDATE shopping_print_requests
    SET
      status = 'print_claimed',
      print_attempts = print_attempts + 1,
      printer_claimed_by = ?,
      printer_claim_token_hash = ?,
      printer_lease_until = ?,
      updated_at = ?
    WHERE id = (
      SELECT id
      FROM shopping_print_requests
      WHERE status = 'ready'
        AND available_at <= ?
        AND print_attempts < max_attempts
      ORDER BY created_at
      LIMIT 1
    ) AND status = 'ready'
  `).bind(printerID, claimHash, now + LEASE_SECONDS, now, now).run();
  if ((update.meta.changes ?? 0) !== 1) return emptyResponse();

  const row = await db.prepare(`
    SELECT id, items_json
    FROM shopping_print_requests
    WHERE status = 'print_claimed'
      AND printer_claimed_by = ?
      AND printer_claim_token_hash = ?
  `).bind(printerID, claimHash).first<PrintClaimRow>();
  if (!row) throw new Error('Claimed print request could not be reloaded');

  const items: unknown = JSON.parse(row.items_json);
  if (!Array.isArray(items) || !items.every((item) => typeof item === 'string')) {
    throw new Error('Stored shopping list is malformed');
  }
  return jsonResponse(200, {
    ok: true,
    job: { request_id: row.id, claim_token: claimToken, items },
  });
}

async function completePrint(db: D1Database, body: JsonObject): Promise<Response> {
  const requestID = requiredUUID(body.request_id, 'request_id');
  const claimHash = await sha256(requiredClaimToken(body.claim_token));
  const now = unixTime();
  const result = await db.prepare(`
    UPDATE shopping_print_requests
    SET
      status = 'printed',
      active_slot = NULL,
      items_json = '[]',
      printer_claimed_by = NULL,
      printer_claim_token_hash = NULL,
      printer_lease_until = NULL,
      last_error = NULL,
      printed_at = ?,
      updated_at = ?
    WHERE id = ?
      AND status = 'print_claimed'
      AND printer_claim_token_hash = ?
  `).bind(now, now, requestID, claimHash).run();
  if ((result.meta.changes ?? 0) !== 1) {
    return errorResponse(409, 'Print lease is invalid or expired');
  }
  return jsonResponse(200, { ok: true });
}

async function failPrint(db: D1Database, body: JsonObject): Promise<Response> {
  const requestID = requiredUUID(body.request_id, 'request_id');
  const claimHash = await sha256(requiredClaimToken(body.claim_token));
  const retry = body.retry === true ? 1 : 0;
  const message = cleanError(body.error);
  const now = unixTime();
  const result = await db.prepare(`
    UPDATE shopping_print_requests
    SET
      status = CASE
        WHEN ? = 1 AND print_attempts < max_attempts THEN 'ready'
        ELSE 'failed'
      END,
      active_slot = CASE
        WHEN ? = 1 AND print_attempts < max_attempts THEN 1
        ELSE NULL
      END,
      items_json = CASE
        WHEN ? = 1 AND print_attempts < max_attempts THEN items_json
        ELSE '[]'
      END,
      available_at = ?,
      printer_claimed_by = NULL,
      printer_claim_token_hash = NULL,
      printer_lease_until = NULL,
      last_error = ?,
      updated_at = ?
    WHERE id = ?
      AND status = 'print_claimed'
      AND printer_claim_token_hash = ?
  `).bind(retry, retry, retry, now + 5, message, now, requestID, claimHash).run();
  if ((result.meta.changes ?? 0) !== 1) {
    return errorResponse(409, 'Print lease is invalid or expired');
  }
  return jsonResponse(200, { ok: true });
}

async function releaseExpiredLeases(db: D1Database): Promise<void> {
  const now = unixTime();
  await db.batch([
    db.prepare(`
      UPDATE shopping_print_requests
      SET
        status = CASE
          WHEN source_attempts < max_attempts THEN 'requested'
          ELSE 'failed'
        END,
        active_slot = CASE
          WHEN source_attempts < max_attempts THEN 1
          ELSE NULL
        END,
        source_claimed_by = NULL,
        source_claim_token_hash = NULL,
        source_lease_until = NULL,
        last_error = 'Mac bridge lease expired',
        available_at = ?,
        updated_at = ?
      WHERE status = 'source_claimed' AND source_lease_until < ?
    `).bind(now, now, now),
    db.prepare(`
      UPDATE shopping_print_requests
      SET
        status = CASE
          WHEN print_attempts < max_attempts THEN 'ready'
          ELSE 'failed'
        END,
        active_slot = CASE
          WHEN print_attempts < max_attempts THEN 1
          ELSE NULL
        END,
        items_json = CASE
          WHEN print_attempts < max_attempts THEN items_json
          ELSE '[]'
        END,
        printer_claimed_by = NULL,
        printer_claim_token_hash = NULL,
        printer_lease_until = NULL,
        last_error = 'Printer lease expired',
        available_at = ?,
        updated_at = ?
      WHERE status = 'print_claimed' AND printer_lease_until < ?
    `).bind(now, now, now),
  ]);
}

async function readJsonObject(request: Request): Promise<JsonObject> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new RequestValidationError('Content-Type must be application/json', 415);
  }

  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
  if (declaredLength > MAX_BODY_BYTES) {
    throw new RequestValidationError('Request is too large', 413);
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength === 0) throw new RequestValidationError('Request body is empty');
  if (bytes.byteLength > MAX_BODY_BYTES) {
    throw new RequestValidationError('Request is too large', 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new RequestValidationError('Invalid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new RequestValidationError('JSON body must be an object');
  }
  return parsed as JsonObject;
}

function cleanItems(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) {
    throw new RequestValidationError(`items must contain no more than ${MAX_ITEMS} entries`);
  }
  return value.map((item) => {
    if (typeof item !== 'string') {
      throw new RequestValidationError('Every shopping item must be text');
    }
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(item)) {
      throw new RequestValidationError('A shopping item contains unsupported control characters');
    }
    const cleaned = item.trim().replace(/\s+/gu, ' ');
    if (!cleaned || [...cleaned].length > MAX_ITEM_CHARACTERS) {
      throw new RequestValidationError(
        `Shopping items must be 1-${MAX_ITEM_CHARACTERS} characters`,
      );
    }
    return cleaned;
  });
}

function requiredIdentifier(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{1,100}$/u.test(value)) {
    throw new RequestValidationError(`${field} has an invalid format`);
  }
  return value;
}

function requiredUUID(value: unknown, field: string): string {
  if (
    typeof value !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)
  ) {
    throw new RequestValidationError(`${field} has an invalid format`);
  }
  return value;
}

function requiredClaimToken(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/u.test(value)) {
    throw new RequestValidationError('claim_token has an invalid format');
  }
  return value;
}

function cleanError(value: unknown): string {
  if (typeof value !== 'string') return 'Unspecified error';
  const cleaned = value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ');
  return [...(cleaned || 'Unspecified error')].slice(0, 500).join('');
}

async function authorized(request: Request, expectedToken: string): Promise<boolean> {
  const authorization = request.headers.get('authorization') ?? '';
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const [providedHash, expectedHash] = await Promise.all([
    sha256(provided),
    sha256(expectedToken),
  ]);
  let difference = 0;
  for (let index = 0; index < expectedHash.length; index += 1) {
    difference |= providedHash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  }
  return difference === 0;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
}

function randomHex(byteCount: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function unixTime(): number {
  return Math.floor(Date.now() / 1000);
}

function emptyResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

function jsonResponse(status: number, payload: JsonObject): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: RESPONSE_HEADERS,
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { ok: false, error: message });
}

export function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { ...RESPONSE_HEADERS, Allow: 'POST' },
  });
}
