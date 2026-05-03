-- RSSE foundation schema (Postgres). Apply via your migration runner or Supabase CLI.

CREATE TABLE experience_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE social_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text UNIQUE NOT NULL,
  experience_type_id text REFERENCES experience_types(id),
  host_player_id uuid,
  status text NOT NULL DEFAULT 'created',
  title text,
  max_players int NOT NULL DEFAULT 8,
  is_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '24 hours'
);

CREATE TABLE session_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '*',
  role text NOT NULL DEFAULT 'player',
  joined_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);

CREATE TABLE session_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  player_id uuid REFERENCES session_players(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  sequence_number bigint NOT NULL,
  idempotency_key text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX session_events_session_sequence_idx
ON session_events(session_id, sequence_number);

CREATE UNIQUE INDEX session_events_idempotency_idx
ON session_events(session_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE TABLE session_state_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  last_event_id uuid REFERENCES session_events(id),
  sequence_number bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX session_state_snapshots_session_id_idx
ON session_state_snapshots(session_id);

CREATE TABLE entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  experience_type_id text REFERENCES experience_types(id),
  type text NOT NULL,
  unlocked_by_player_id uuid REFERENCES session_players(id),
  amount_cents int,
  provider text,
  provider_order_id text UNIQUE,
  idempotency_key text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX entitlements_idempotency_idx
ON entitlements(idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE TABLE session_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES social_sessions(id) ON DELETE CASCADE,
  summary jsonb NOT NULL DEFAULT '{}',
  share_text text,
  public_slug text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  session_id uuid REFERENCES social_sessions(id) ON DELETE SET NULL,
  experience_type_id text,
  category text,
  source text,
  interest text,
  group_size int,
  created_at timestamptz DEFAULT now()
);
