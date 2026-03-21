-- Run this in your Neon console (or via psql) once to initialise the schema.
-- https://console.neon.tech → SQL Editor

-- ── Players ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id         TEXT        PRIMARY KEY,          -- client-generated UUID
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Game sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  id             TEXT        PRIMARY KEY,         -- client-generated UUID
  player_id      TEXT        NOT NULL REFERENCES players(id),
  score          INTEGER     NOT NULL DEFAULT 0,
  seeds          INTEGER     NOT NULL DEFAULT 8,
  water          INTEGER     NOT NULL DEFAULT 5,
  grain          INTEGER     NOT NULL DEFAULT 0,
  active_gx      INTEGER     NOT NULL DEFAULT 0,
  active_gy      INTEGER     NOT NULL DEFAULT 0,
  laser_battery  SMALLINT    NOT NULL DEFAULT 100,
  pumps          SMALLINT    NOT NULL DEFAULT 1,
  placed_pumps   JSONB       NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_score ON game_sessions (score DESC);

-- ── Unlocked zones ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unlocked_zones (
  session_id  TEXT    NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  gx          INTEGER NOT NULL,
  gy          INTEGER NOT NULL,
  PRIMARY KEY (session_id, gx, gy)
);

-- ── Cell states ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cell_states (
  session_id  TEXT     NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  cell_key    TEXT     NOT NULL,
  status      TEXT     NOT NULL,
  ts          BIGINT   NOT NULL,
  harvests    INTEGER  NOT NULL DEFAULT 0,
  laser_hits  SMALLINT NOT NULL DEFAULT 0,
  pumped_ms   INTEGER  NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, cell_key)
);

-- ── Migration (run once if schema already existed) ────────────────────────────
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS laser_battery SMALLINT NOT NULL DEFAULT 100;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS pumps         SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS placed_pumps  JSONB    NOT NULL DEFAULT '[]';
ALTER TABLE cell_states   ADD COLUMN IF NOT EXISTS laser_hits    SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE cell_states   ADD COLUMN IF NOT EXISTS pumped_ms     INTEGER  NOT NULL DEFAULT 0;
