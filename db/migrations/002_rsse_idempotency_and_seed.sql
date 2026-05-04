-- Cross-session idempotency cache for PlatformResponse replay (create + command keys).
CREATE TABLE IF NOT EXISTS platform_idempotency (
  cache_key text PRIMARY KEY,
  response_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO experience_types (id, name, status)
VALUES ('placeholder', 'Placeholder experience', 'active')
ON CONFLICT (id) DO NOTHING;
