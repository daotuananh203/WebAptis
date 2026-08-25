-- Migration: 001_initial_schema.sql
-- Description: Initial schema for WebAptis B2 (Users, Sessions, Progress Attempts, Preferences)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Sessions Table (for database-backed revocation / expiry tracking)
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 3. Progress Attempts Table (Single Persistent Source of Truth for Practice & Mock Tests)
CREATE TABLE IF NOT EXISTS progress_attempts (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id VARCHAR(100) NOT NULL,
  mode VARCHAR(50) NOT NULL, -- 'practice' | 'mock-test'
  skill VARCHAR(50) NOT NULL, -- 'grammarVocabulary' | 'reading' | 'listening' | 'writing' | 'speaking'
  part_identifier VARCHAR(50),
  raw_score NUMERIC(5, 2) NOT NULL,
  max_raw_score NUMERIC(5, 2) NOT NULL,
  percentage INT NOT NULL,
  estimated_band VARCHAR(20),
  duration_seconds INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL,
  disclaimer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_skill ON progress_attempts(user_id, skill);
CREATE INDEX IF NOT EXISTS idx_progress_user_completed ON progress_attempts(user_id, completed_at DESC);

-- 4. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  audio_playback_speed NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
  auto_next_on_select BOOLEAN NOT NULL DEFAULT FALSE,
  sound_effects_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  theme VARCHAR(20) NOT NULL DEFAULT 'system',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
