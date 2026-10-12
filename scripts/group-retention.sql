-- Durée de conservation : date de dernière activité des groupes (v5.6.0)
-- Additif. Les groupes existants reçoivent la date du jour : le compteur de 3 ans démarre au déploiement.
-- À lancer AVANT le déploiement (test puis prod), après scripts/email-recovery.sql. Rejouable.

ALTER TABLE "Group" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Group_lastActivityAt_idx" ON "Group"("lastActivityAt");

-- Vérification : doit renvoyer 1 ligne
SELECT column_name FROM information_schema.columns WHERE table_name = 'Group' AND column_name = 'lastActivityAt';
