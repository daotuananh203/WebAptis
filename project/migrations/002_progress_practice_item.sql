-- Migration: 002_progress_practice_item.sql
-- Description: Preserve the canonical Practice Bank item on persisted attempts.
-- This is additive and safe to run against an existing 001 schema.

ALTER TABLE progress_attempts
  ADD COLUMN IF NOT EXISTS practice_item_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_progress_user_practice_item
  ON progress_attempts(user_id, practice_item_id);
