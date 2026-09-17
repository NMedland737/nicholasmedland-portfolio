import { env } from 'cloudflare:workers';
import {
  claimOldestJob,
  countActiveJobs,
  ensureTodoPrinterSchema,
  findJobByIdempotencyKey,
  getClaimedJob,
  getJobStatus,
  insertJob,
  markJobComplete,
  markJobFailed,
  pruneFinishedJobs,
  releaseExpiredClaims,
  type QueueConfig,
} from '@/db/todo-printer';

const MAX_BODY_BYTES = 4096;
const MAX_TASK_CHARACTERS = 300;
const JSON_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

type TodoPrinterEnv = {
  DB?: D1Database;
  TODO_QUEUE_SUBMIT_TOKEN?: string;
  TODO_QUEUE_WORKER_TOKEN?: string;
  TODO_QUEUE_LEASE_SECONDS?: string;
  TODO_QUEUE_MAX_JOBS?: string;
  TODO_QUEUE_MAX_ATTEMPTS?: string;
  TODO_QUEUE_RETENTION_DAYS?: string;
};

type JsonObject = Record<string, unknown>;

function jsonResponse(status: number, payload?: JsonObject): Response {
  return new Response(payload ? JSON.stringify(payload) : null, {
    status,
    headers: JSON_HEADERS,
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { ok: false, error: message });
}

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

function readConfiguration(): {
  db: D1Database;
  submitToken: string;
  workerToken: string;
  queue: QueueConfig;
} {
  const bindings = env as unknown as TodoPrinterEnv;
  const submitToken = bindings.TODO_QUEUE_SUBMIT_TOKEN?.trim() ?? '';
  const workerToken = bindings.TODO_QUEUE_WORKER_TOKEN?.trim() ?? '';

  if (!bindings.DB) throw new Error('Missing D1 binding: DB');
  if (submitToken.length < 32 || workerToken.length < 32) {
    throw new Error('Todo-printer API tokens must each contain at least 32 characters');
  }
  if (submitToken === workerToken) throw new Error('Todo-printer API tokens must be different');

  return {
    db: bindings.DB,
    submitToken,
    workerToken,
    queue: {
      leaseSeconds: boundedInteger(bindings.TODO_QUEUE_LEASE_SECONDS, 90, 30, 600),
      maxQueuedJobs: boundedInteger(bindings.TODO_QUEUE_MAX_JOBS, 100, 1, 10_000),
      maxAttempts: boundedInteger(bindings.TODO_QUEUE_MAX_ATTEMPTS, 5, 1, 20),
      retentionDays: boundedInteger(bindings.TODO_QUEUE_RETENTION_DAYS, 30, 1, 365),
    },
  };
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function secureTokenMatch(provided: string, expected: string): Promise<boolean> {
  const [providedHash, expectedHash] = await Promise.all([sha256(provided), sha256(expected)]);
  let difference = 0;
  for (let index = 0; index < expectedHash.length; index += 1) {
    difference |= providedHash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  }
  return difference === 0;
}

function randomHex(byteCount: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function authorized(request: Request, expectedToken: string): Promise<boolean> {
  const authorization = request.headers.get('authorization') ?? '';
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return secureTokenMatch(provided, expectedToken);
}

async function readJsonObject(request: Request): Promise<JsonObject | Response> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') return errorResponse(415, 'Content-Type must be application/json');

  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
  if (declaredLength > MAX_BODY_BYTES) return errorResponse(413, 'Request is too large');

  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BODY_BYTES) {
    return errorResponse(400, 'Request body is empty or too large');
  }

  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(body));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return errorResponse(400, 'JSON body must be an object');
    }
    return parsed as JsonObject;
  } catch {
    return errorResponse(400, 'Invalid JSON');
  }
}

function cleanTask(value: unknown): string | Response {
  if (typeof value !== 'string') return errorResponse(400, 'task must be valid text');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) {
    return errorResponse(400, 'task contains unsupported control characters');
  }
  const task = value.trim().replace(/\s+/gu, ' ');
  if (!task) return errorResponse(400, 'task cannot be empty');
  if ([...task].length > MAX_TASK_CHARACTERS) return errorResponse(400, 'task must be 300 characters or fewer');
  return task;
}

function optionalRequestId(value: unknown): string | null | Response {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{8,100}$/u.test(value)) {
    return errorResponse(400, 'request_id has an invalid format');
  }
  return value;
}

function validJobId(value: unknown): string | Response {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) {
    return errorResponse(400, 'Invalid job_id');
  }
  return value;
}

function validClaimToken(value: unknown): string | Response {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/u.test(value)) {
    return errorResponse(400, 'Invalid claim_token');
  }
  return value;
}

async function submit(db: D1Database, config: QueueConfig, body: JsonObject): Promise<Response> {
  const task = cleanTask(body.task);
  if (task instanceof Response) return task;
  const requestId = optionalRequestId(body.request_id);
  if (requestId instanceof Response) return requestId;

  const now = Math.floor(Date.now() / 1000);
  await pruneFinishedJobs(db, now - config.retentionDays * 86_400);

  if (requestId) {
    const existing = await findJobByIdempotencyKey(db, requestId);
    if (existing) return jsonResponse(200, {
      ok: true,
      job_id: existing.id,
      status: existing.status,
      duplicate: true,
    });
  }

  if (await countActiveJobs(db) >= config.maxQueuedJobs) {
    return errorResponse(429, 'Print queue is full');
  }

  const id = crypto.randomUUID();
  try {
    await insertJob(db, { id, task, requestId, maxAttempts: config.maxAttempts, now });
  } catch (error) {
    if (requestId) {
      const existing = await findJobByIdempotencyKey(db, requestId);
      if (existing) return jsonResponse(200, {
        ok: true,
        job_id: existing.id,
        status: existing.status,
        duplicate: true,
      });
    }
    throw error;
  }

  return jsonResponse(202, { ok: true, job_id: id, status: 'pending' });
}

async function claim(db: D1Database, config: QueueConfig, body: JsonObject): Promise<Response> {
  const workerId = body.worker_id ?? 'raspberry-pi';
  if (typeof workerId !== 'string' || !/^[A-Za-z0-9._:-]{1,100}$/u.test(workerId)) {
    return errorResponse(400, 'Invalid worker_id');
  }

  const now = Math.floor(Date.now() / 1000);
  await releaseExpiredClaims(db, now);
  const claimToken = randomHex(32);
  const job = await claimOldestJob(db, workerId, config, claimToken, await sha256(claimToken), now);
  if (!job) return jsonResponse(204);

  return jsonResponse(200, {
    ok: true,
    job: {
      id: job.id,
      task: job.task,
      attempt: job.attempt,
      claim_token: job.claimToken,
      lease_seconds: config.leaseSeconds,
    },
  });
}

async function complete(db: D1Database, body: JsonObject): Promise<Response> {
  const jobId = validJobId(body.job_id);
  if (jobId instanceof Response) return jobId;
  const claimToken = validClaimToken(body.claim_token);
  if (claimToken instanceof Response) return claimToken;

  const completed = await markJobComplete(db, jobId, await sha256(claimToken), Math.floor(Date.now() / 1000));
  if (completed) return jsonResponse(200, { ok: true, status: 'printed' });

  const existing = await getJobStatus(db, jobId);
  if (existing?.status === 'printed') return jsonResponse(200, { ok: true, status: 'printed', duplicate: true });
  return errorResponse(409, 'Job is not held by this worker');
}

async function fail(db: D1Database, body: JsonObject): Promise<Response> {
  const jobId = validJobId(body.job_id);
  if (jobId instanceof Response) return jobId;
  const claimToken = validClaimToken(body.claim_token);
  if (claimToken instanceof Response) return claimToken;
  if (body.retry !== undefined && typeof body.retry !== 'boolean') return errorResponse(400, 'retry must be a boolean');

  const stored = await getClaimedJob(db, jobId);
  const claimTokenHash = await sha256(claimToken);
  if (!stored || !(await secureTokenMatch(claimTokenHash, stored.claim_token_hash))) {
    return errorResponse(409, 'Job is not held by this worker');
  }

  const retry = body.retry !== false;
  const shouldRetry = retry && Number(stored.attempts) < Number(stored.max_attempts);
  const status = shouldRetry ? 'pending' : 'failed';
  const delay = Math.min(300, 2 ** Math.min(Number(stored.attempts), 8));
  const now = Math.floor(Date.now() / 1000);
  const rawMessage = typeof body.error === 'string' ? body.error : 'Printer worker reported a failure';
  const message = [...(rawMessage.trim().replace(/\s+/gu, ' ') || 'Worker failure')].slice(0, 500).join('');
  const updated = await markJobFailed(db, {
    jobId,
    claimTokenHash,
    status,
    availableAt: now + (shouldRetry ? delay : 0),
    message,
    now,
  });

  return updated
    ? jsonResponse(200, { ok: true, status })
    : errorResponse(409, 'Job is not held by this worker');
}

export async function handleTodoPrinterRequest(request: Request): Promise<Response> {
  const requestId = randomHex(6);
  try {
    const action = new URL(request.url).searchParams.get('action') ?? '';
    if (!['submit', 'claim', 'complete', 'fail'].includes(action)) return errorResponse(404, 'Not found');

    const configuration = readConfiguration();
    const expectedToken = action === 'submit' ? configuration.submitToken : configuration.workerToken;
    if (!(await authorized(request, expectedToken))) return errorResponse(401, 'Unauthorized');

    const body = await readJsonObject(request);
    if (body instanceof Response) return body;
    await ensureTodoPrinterSchema(configuration.db);

    switch (action) {
      case 'submit': return submit(configuration.db, configuration.queue, body);
      case 'claim': return claim(configuration.db, configuration.queue, body);
      case 'complete': return complete(configuration.db, body);
      case 'fail': return fail(configuration.db, body);
      default: return errorResponse(404, 'Not found');
    }
  } catch (error) {
    console.error(`todo-printer API error ${requestId}`, error instanceof Error ? error.message : error);
    return jsonResponse(500, { ok: false, error: 'Server error', request_id: requestId });
  }
}

export function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { ...JSON_HEADERS, Allow: 'POST' },
  });
}

