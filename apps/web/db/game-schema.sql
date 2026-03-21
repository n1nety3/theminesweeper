-- FARM game database schema
-- Run against FARM_DATABASE_URL (separate Neon project)

CREATE TABLE IF NOT EXISTS users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL UNIQUE,
  farm_name  TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  code       CHAR(6)     NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS otp_codes_email_idx ON otp_codes (email);

CREATE TABLE IF NOT EXISTS game_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id),
  score         INTEGER     NOT NULL DEFAULT 0,
  seeds         SMALLINT    NOT NULL DEFAULT 8,
  water         SMALLINT    NOT NULL DEFAULT 5,
  grain         INTEGER     NOT NULL DEFAULT 0,
  crops         INTEGER     NOT NULL DEFAULT 0,
  active_gx     SMALLINT    NOT NULL DEFAULT 0,
  active_gy     SMALLINT    NOT NULL DEFAULT 0,
  laser_battery SMALLINT    NOT NULL DEFAULT 100,
  pumps         SMALLINT    NOT NULL DEFAULT 1,
  placed_pumps  JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS game_sessions_user_idx ON game_sessions (user_id);

-- Migration: device info + last seen (run once if table already exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS crops INTEGER NOT NULL DEFAULT 0;

-- Global scoreboard — separate from game_sessions, never overwritten
CREATE TABLE IF NOT EXISTS scoreboard (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID,                        -- which game session produced this score
  village_name TEXT        NOT NULL,
  score        INTEGER     NOT NULL,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS scoreboard_score_idx ON scoreboard (score DESC);

CREATE TABLE IF NOT EXISTS unlocked_zones (
  session_id UUID     NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  gx         SMALLINT NOT NULL,
  gy         SMALLINT NOT NULL,
  PRIMARY KEY (session_id, gx, gy)
);

CREATE TABLE IF NOT EXISTS cell_states (
  session_id UUID     NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  cell_key   TEXT     NOT NULL,
  status     TEXT     NOT NULL,
  ts         BIGINT   NOT NULL,
  harvests   SMALLINT NOT NULL DEFAULT 0,
  laser_hits SMALLINT NOT NULL DEFAULT 0,
  pumped_ms  INTEGER  NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, cell_key)
);
