import { todoPrintJobsIndexSql, todoPrintJobsTableSql } from './schema';

export type QueueConfig = {
  leaseSeconds: number;
  maxQueuedJobs: number;
  maxAttempts: number;
  retentionDays: number;
};

export type ClaimedJob = {
  id: string;
  task: string;
  attempt: number;
  claimToken: string;
};

let schemaReady: Promise<void> | null = null;

export function ensureTodoPrinterSchema(db: D1Database): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.prepare(todoPrintJobsTableSql).run();
      await db.batch(todoPrintJobsIndexSql.map((sql) => db.prepare(sql)));
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export async function pruneFinishedJobs(db: D1Database, cutoff: number): Promise<void> {
  await db.prepare(`
    DELETE FROM todo_print_jobs
    WHERE id IN (
      SELECT id FROM todo_print_jobs
      WHERE status IN ('printed', 'failed') AND updated_at < ?
      ORDER BY updated_at ASC
      LIMIT 100
    )
  `).bind(cutoff).run();
}

export function findJobByIdempotencyKey(db: D1Database, requestId: string) {
  return db.prepare(`
    SELECT id, status FROM todo_print_jobs WHERE idempotency_key = ?
  `).bind(requestId).first<{ id: string; status: string }>();
}

export async function countActiveJobs(db: D1Database): Promise<number> {
  const row = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM todo_print_jobs
    WHERE status IN ('pending', 'claimed')
  `).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function insertJob(
  db: D1Database,
  values: {
    id: string;
    task: string;
    requestId: string | null;
    maxAttempts: number;
    now: number;
  },
): Promise<void> {
  await db.prepare(`
    INSERT INTO todo_print_jobs (
      id, task, idempotency_key, status, attempts, max_attempts,
      available_at, created_at, updated_at
    ) VALUES (?, ?, ?, 'pending', 0, ?, ?, ?, ?)
  `).bind(
    values.id,
    values.task,
    values.requestId,
    values.maxAttempts,
    values.now,
    values.now,
    values.now,
  ).run();
}

export async function releaseExpiredClaims(db: D1Database, now: number): Promise<void> {
  await db.prepare(`
    UPDATE todo_print_jobs
    SET
      status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
      claimed_by = NULL,
      claim_token_hash = NULL,
      lease_until = NULL,
      last_error = 'Worker lease expired',
      available_at = ?,
      updated_at = ?
    WHERE status = 'claimed' AND lease_until < ?
  `).bind(now, now, now).run();
}

export async function claimOldestJob(
  db: D1Database,
  workerId: string,
  config: QueueConfig,
  claimToken: string,
  claimTokenHash: string,
  now: number,
): Promise<ClaimedJob | null> {
  const job = await db.prepare(`
    UPDATE todo_print_jobs
    SET
      status = 'claimed',
      attempts = attempts + 1,
      claimed_by = ?,
      claim_token_hash = ?,
      lease_until = ?,
      updated_at = ?
    WHERE id = (
      SELECT id FROM todo_print_jobs
      WHERE status = 'pending'
        AND available_at <= ?
        AND attempts < max_attempts
      ORDER BY created_at ASC
      LIMIT 1
    )
      AND status = 'pending'
    RETURNING id, task, attempts
  `).bind(
    workerId,
    claimTokenHash,
    now + config.leaseSeconds,
    now,
    now,
  ).first<{ id: string; task: string; attempts: number }>();

  return job ? {
    id: job.id,
    task: job.task,
    attempt: Number(job.attempts),
    claimToken,
  } : null;
}

export async function markJobComplete(
  db: D1Database,
  jobId: string,
  claimTokenHash: string,
  now: number,
): Promise<boolean> {
  const updated = await db.prepare(`
    UPDATE todo_print_jobs
    SET
      status = 'printed',
      task = '',
      printed_at = ?,
      updated_at = ?,
      claimed_by = NULL,
      claim_token_hash = NULL,
      lease_until = NULL,
      last_error = NULL
    WHERE id = ? AND status = 'claimed' AND claim_token_hash = ?
    RETURNING id
  `).bind(now, now, jobId, claimTokenHash).first<{ id: string }>();
  return Boolean(updated);
}

export function getJobStatus(db: D1Database, jobId: string) {
  return db.prepare(`
    SELECT status FROM todo_print_jobs WHERE id = ?
  `).bind(jobId).first<{ status: string }>();
}

export function getClaimedJob(db: D1Database, jobId: string) {
  return db.prepare(`
    SELECT attempts, max_attempts, claim_token_hash
    FROM todo_print_jobs
    WHERE id = ? AND status = 'claimed'
  `).bind(jobId).first<{
    attempts: number;
    max_attempts: number;
    claim_token_hash: string;
  }>();
}

export async function markJobFailed(
  db: D1Database,
  values: {
    jobId: string;
    claimTokenHash: string;
    status: 'pending' | 'failed';
    availableAt: number;
    message: string;
    now: number;
  },
): Promise<boolean> {
  const updated = await db.prepare(`
    UPDATE todo_print_jobs
    SET
      status = ?,
      available_at = ?,
      last_error = ?,
      updated_at = ?,
      claimed_by = NULL,
      claim_token_hash = NULL,
      lease_until = NULL
    WHERE id = ? AND status = 'claimed' AND claim_token_hash = ?
    RETURNING id
  `).bind(
    values.status,
    values.availableAt,
    values.message,
    values.now,
    values.jobId,
    values.claimTokenHash,
  ).first<{ id: string }>();
  return Boolean(updated);
}

