-- Annule add_gift_co_owner.sql (les cadeaux communs redeviennent de simples cadeaux de leur créateur)
BEGIN;

DROP INDEX IF EXISTS "Gift_coOwnerId_idx";
ALTER TABLE "Gift" DROP CONSTRAINT IF EXISTS "Gift_coOwnerId_fkey";
ALTER TABLE "Gift" DROP COLUMN IF EXISTS "coOwnerId";

COMMIT;
