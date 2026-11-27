-- Cadeau commun : un second propriétaire facultatif par cadeau
BEGIN;

ALTER TABLE "Gift" ADD COLUMN IF NOT EXISTS "coOwnerId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Gift_coOwnerId_fkey') THEN
        ALTER TABLE "Gift"
            ADD CONSTRAINT "Gift_coOwnerId_fkey" FOREIGN KEY ("coOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Gift_coOwnerId_idx" ON "Gift"("coOwnerId");

COMMIT;
