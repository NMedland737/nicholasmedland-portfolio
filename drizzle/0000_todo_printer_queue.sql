CREATE TABLE IF NOT EXISTS todo_print_jobs (
  id TEXT PRIMARY KEY,
  task TEXT NOT NULL,
  idempotency_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'claimed', 'printed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  available_at INTEGER NOT NULL,
  claimed_by TEXT,
  claim_token_hash TEXT,
  lease_until INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  printed_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_todo_print_jobs_idempotency
ON todo_print_jobs(idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_todo_print_jobs_claim
ON todo_print_jobs(status, available_at, created_at);

CREATE INDEX IF NOT EXISTS idx_todo_print_jobs_lease
ON todo_print_jobs(status, lease_until);

CREATE INDEX IF NOT EXISTS idx_todo_print_jobs_cleanup
ON todo_print_jobs(status, updated_at);

PRAGMA optimize;
