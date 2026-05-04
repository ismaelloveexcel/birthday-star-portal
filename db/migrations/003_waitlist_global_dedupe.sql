-- Migration 003: Unique index on global waitlist entries (session_id IS NULL).
--
-- Global waitlist rows are those inserted via the /api/waitlist route where
-- no session is associated (session_id IS NULL). This partial unique index
-- prevents the same email from appearing multiple times in the global list.
--
-- Session-scoped waitlist rows (session_id IS NOT NULL) are intentionally
-- excluded from this constraint — the same email may legitimately join
-- multiple session waitlists.

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_global_email_unique_idx
  ON waitlist (email)
  WHERE session_id IS NULL;
