-- ============================================================
-- Migration P5 (v5.3.0) — à exécuter MANUELLEMENT sur la base de PRODUCTION
-- (la base de test a déjà ce schéma). Transaction unique : tout ou rien.
--
-- Vérification préalable (doit renvoyer 0 ligne, sinon renommer les doublons d'abord) :
--   SELECT LOWER(name), COUNT(*) FROM "Group" GROUP BY LOWER(name) HAVING COUNT(*) > 1;
-- ============================================================

BEGIN;

-- ---------- Backfill des NULL avant les contraintes NOT NULL ----------
UPDATE "Gift"  SET "order" = 0            WHERE "order" IS NULL;
UPDATE "Gift"  SET "isSuggestedGift" = false WHERE "isSuggestedGift" IS NULL;
UPDATE "Group" SET "createdAt" = NOW()    WHERE "createdAt" IS NULL;
UPDATE "Group" SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL;
UPDATE "User"  SET "createdAt" = NOW()    WHERE "createdAt" IS NULL;
UPDATE "User"  SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL;
UPDATE "Gift"  SET "createdAt" = NOW()    WHERE "createdAt" IS NULL;
UPDATE "Gift"  SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL;
UPDATE "Group" SET "adminPassword" = 'admin' WHERE "adminPassword" IS NULL;

-- ---------- Schéma ----------
-- Cascade : supprimer un user supprime ses cadeaux (au lieu de les orpheliner)
ALTER TABLE "Gift" DROP CONSTRAINT "Gift_userId_fkey";

DROP INDEX "Gift_userId_idx";
DROP INDEX "Gift_order_idx";

ALTER TABLE "Group" DROP COLUMN "description",
DROP COLUMN "imageUrl",
ALTER COLUMN "adminPassword" DROP DEFAULT,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "User" DROP COLUMN "isAdmin",
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Gift" ALTER COLUMN "isSuggestedGift" SET NOT NULL,
ALTER COLUMN "order" SET NOT NULL,
ALTER COLUMN "order" SET DEFAULT 0,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

CREATE INDEX "Gift_userId_order_idx" ON "Gift"("userId", "order");

ALTER TABLE "Gift" ADD CONSTRAINT "Gift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
