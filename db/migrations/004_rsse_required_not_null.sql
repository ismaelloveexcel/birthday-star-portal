-- Migration 004: Enforce required RSSE relationship columns.
--
-- These columns are part of the authoritative session/event/snapshot model and
-- must be present for staging/production verification.

ALTER TABLE session_events
  ALTER COLUMN session_id SET NOT NULL;

ALTER TABLE session_state_snapshots
  ALTER COLUMN session_id SET NOT NULL;

ALTER TABLE entitlements
  ALTER COLUMN session_id SET NOT NULL;