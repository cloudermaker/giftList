-- Statut « acheté » sur les réservations et les cadeaux personnels
-- 100 % additif : sans risque pour le code déjà en production. À lancer AVANT le déploiement (test puis prod).
-- Rejouable : IF NOT EXISTS partout.

ALTER TABLE "UserTakenGift" ADD COLUMN IF NOT EXISTS "boughtAt" TIMESTAMP(3);
ALTER TABLE "PersonalGift" ADD COLUMN IF NOT EXISTS "boughtAt" TIMESTAMP(3);

-- Vérification : doit renvoyer 2 lignes
SELECT table_name, column_name FROM information_schema.columns
WHERE column_name = 'boughtAt' AND table_name IN ('UserTakenGift', 'PersonalGift');
