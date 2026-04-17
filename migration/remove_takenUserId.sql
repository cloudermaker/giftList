-- Migration: Suppression colonne Gift.takenUserId (remplacée par UserTakenGift)
-- Date: 2026-04-17
-- Version: v4.0.0 cleanup

-- ⚠️ IMPORTANT: Exécuter APRÈS avoir déployé le code qui lit depuis UserTakenGift

-- 1. Supprimer l'index sur takenUserId (si existe)
DROP INDEX IF EXISTS "Gift_takenUserId_idx";

-- 2. Supprimer la colonne takenUserId
ALTER TABLE "Gift" DROP COLUMN IF EXISTS "takenUserId";

-- ✅ Vérification
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'Gift' 
  AND column_name = 'takenUserId';
-- Devrait retourner 0 lignes
