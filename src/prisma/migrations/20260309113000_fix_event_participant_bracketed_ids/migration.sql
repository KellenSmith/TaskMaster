-- Fix malformed event participant IDs stored as a JSON-like string of two UUIDs.
-- Example malformed value: ["8bdd1af5-f873-4a78-b369-e5cc0648b6f6", "e82884f0-0ed8-4a3b-9c56-6763b8f8fe65"]

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE "event_participants"
SET "id" = gen_random_uuid()::text
WHERE "id" ~ '^\["[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",\s*"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"\]$';
