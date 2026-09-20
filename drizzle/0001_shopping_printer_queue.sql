CREATE TABLE IF NOT EXISTS shopping_print_requests (
  id TEXT PRIMARY KEY,
  active_slot INTEGER CHECK (active_slot IS NULL OR active_slot = 1),
  status TEXT NOT NULL CHECK (
    status IN ('requested', 'source_claimed', 'ready', 'print_claimed', 'printed', 'failed')
  ),
  items_json TEXT NOT NULL DEFAULT '[]',
  source_attempts INTEGER NOT NULL DEFAULT 0 CHECK (source_attempts >= 0),
  print_attempts INTEGER NOT NULL DEFAULT 0 CHECK (print_attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  available_at INTEGER NOT NULL,
  source_claimed_by TEXT,
  source_claim_token_hash TEXT,
  source_lease_until INTEGER,
  printer_claimed_by TEXT,
  printer_claim_token_hash TEXT,
  printer_lease_until INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  printed_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shopping_print_source_queue
ON shopping_print_requests(status, available_at, created_at);

CREATE INDEX IF NOT EXISTS idx_shopping_print_source_lease
ON shopping_print_requests(status, source_lease_until);

CREATE INDEX IF NOT EXISTS idx_shopping_print_printer_lease
ON shopping_print_requests(status, printer_lease_until);

CREATE INDEX IF NOT EXISTS idx_shopping_print_cleanup
ON shopping_print_requests(status, updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_print_one_active
ON shopping_print_requests(active_slot)
WHERE active_slot IS NOT NULL;

PRAGMA optimize;
