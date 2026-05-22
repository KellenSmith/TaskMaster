-- Shift event and task timestamps back by 2 hours.
-- This adjusts existing stored values only; no schema change is made.

UPDATE "events"
SET
  "start_time" = "start_time" - INTERVAL '2 hours',
  "end_time" = "end_time" - INTERVAL '2 hours';

UPDATE "tasks"
SET
  "start_time" = CASE
    WHEN "start_time" IS NULL THEN NULL
    ELSE "start_time" - INTERVAL '2 hours'
  END,
  "end_time" = "end_time" - INTERVAL '2 hours';
