/*
  Resilient migration: relate orders to user_memberships & event_participants while moving subscription_token.
  Steps:
    1. Add nullable order_id to event_participants.
    2. Add new columns to orders (subscription_token + relationship fields).
    3. Ensure pgcrypto extension (for gen_random_uuid()).
    4. Backfill orders for membership subscription_tokens (idempotent: skip if an order already copied the token).
    5. Backfill orders for event_participants (idempotent: skip if order_id already set).
    6. Drop subscription_token column from user_memberships.
    7. Enforce NOT NULL + FKs.
*/

-- 1. Add nullable column first (safe when table has data)
ALTER TABLE "public"."event_participants" ADD COLUMN IF NOT EXISTS "order_id" TEXT;

-- 2. Add new order columns (if not present)
ALTER TABLE "public"."orders"
  ADD COLUMN IF NOT EXISTS "subscription_token" JSONB,
  ADD COLUMN IF NOT EXISTS "userMembershipMembership_id" TEXT,
  ADD COLUMN IF NOT EXISTS "userMembershipUser_id" TEXT;

-- 3. Ensure extension for UUID generation (no-op if exists)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4. Backfill: Move subscription_token from user_memberships into a newly created order per membership having a token.
--    Pricing: use product.price. total_amount = item price * quantity (always 1 here).
--    Skip if an order already exists with same subscription_token JSON value (basic idempotency) OR membership already linked.
DO $$
DECLARE
  rec RECORD;
  product_price DOUBLE PRECISION;
  existing_order_id TEXT;
  new_order_id TEXT;
BEGIN
  FOR rec IN SELECT user_id, membership_id, subscription_token FROM "public"."user_memberships" WHERE subscription_token IS NOT NULL LOOP
    -- Idempotency: does an order already carry this token for this membership?
    SELECT o.id INTO existing_order_id
    FROM "public"."orders" o
    WHERE o."userMembershipUser_id" = rec.user_id
      AND o."userMembershipMembership_id" = rec.membership_id
      AND o.subscription_token = rec.subscription_token
    LIMIT 1;

    IF existing_order_id IS NOT NULL THEN
      CONTINUE; -- already migrated
    END IF;

    -- Get price
    SELECT p.price INTO product_price
    FROM "public"."products" p
    WHERE p.id = rec.membership_id
    LIMIT 1;

    IF product_price IS NULL THEN
      product_price := 0; -- guard
    END IF;

    new_order_id := gen_random_uuid();
    INSERT INTO "public"."orders" (id, user_id, status, total_amount, created_at, updated_at, subscription_token, "userMembershipUser_id", "userMembershipMembership_id")
      VALUES (new_order_id, rec.user_id, 'pending', product_price, NOW(), NOW(), rec.subscription_token, rec.user_id, rec.membership_id);

    INSERT INTO "public"."order_items" (order_id, product_id, quantity, price)
      VALUES (new_order_id, rec.membership_id, 1, product_price);
  END LOOP;
END $$;

-- 5. Backfill: For each event_participant without an order_id, create order + item for its ticket product (using product price).
DO $$
DECLARE
  ep RECORD;
  product_price DOUBLE PRECISION;
  new_order_id TEXT;
BEGIN
  FOR ep IN SELECT user_id, ticket_id FROM "public"."event_participants" WHERE order_id IS NULL LOOP
    SELECT p.price INTO product_price FROM "public"."products" p WHERE p.id = ep.ticket_id LIMIT 1;
    IF product_price IS NULL THEN product_price := 0; END IF;
    new_order_id := gen_random_uuid();
    INSERT INTO "public"."orders" (id, user_id, status, total_amount, created_at, updated_at)
      VALUES (new_order_id, ep.user_id, 'pending', product_price, NOW(), NOW());
    INSERT INTO "public"."order_items" (order_id, product_id, quantity, price)
      VALUES (new_order_id, ep.ticket_id, 1, product_price);
    UPDATE "public"."event_participants" SET order_id = new_order_id WHERE user_id = ep.user_id AND ticket_id = ep.ticket_id;
  END LOOP;
END $$;

-- 6. Remove old column (data now lives in orders.subscription_token)
ALTER TABLE "public"."user_memberships" DROP COLUMN IF EXISTS "subscription_token";

-- 7a. Enforce NOT NULL now that all rows should be populated
ALTER TABLE "public"."event_participants" ALTER COLUMN "order_id" SET NOT NULL;

-- 7b. Add Foreign Keys (conditionally add only if not present is tricky in plain SQL; assume fresh migration)
ALTER TABLE "public"."event_participants" ADD CONSTRAINT "event_participants_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_userMembershipUser_id_userMembershipMembership_id_fkey" FOREIGN KEY ("userMembershipUser_id", "userMembershipMembership_id") REFERENCES "public"."user_memberships"("user_id", "membership_id") ON DELETE SET NULL ON UPDATE CASCADE;
