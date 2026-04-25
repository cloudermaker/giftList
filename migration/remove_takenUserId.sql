-- Migration: Suppression colonnes obsolètes v3 (remplacées par v4)
-- Date: 2026-04-17
-- Version: v4.0.0 cleanup

-- ⚠️ IMPORTANT: Exécuter APRÈS avoir déployé le code v4.0.0

-- ========================================
-- 1. Supprimer Gift.takenUserId
-- ========================================
-- Remplacé par: UserTakenGift table

DROP INDEX IF EXISTS "Gift_takenUserId_idx";
ALTER TABLE "Gift" DROP COLUMN IF EXISTS "takenUserId";

-- ========================================
-- 2. Supprimer User.groupId
-- ========================================
-- Remplacé par: UserGroupMapping table

DROP INDEX IF EXISTS "User_groupId_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "groupId";

-- ========================================
-- ✅ Vérifications
-- ========================================

-- Vérifier que Gift.takenUserId n'existe plus
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Gift' AND column_name = 'takenUserId';
-- Devrait retourner 0 lignes

-- Vérifier que User.groupId n'existe plus
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'groupId';
-- Devrait retourner 0 lignes

-- ========================================
-- 📊 Statistiques post-migration
-- ========================================

SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Groups', COUNT(*) FROM "Group"
UNION ALL
SELECT 'UserGroupMapping', COUNT(*) FROM "UserGroupMapping"
UNION ALL
SELECT 'Gifts', COUNT(*) FROM "Gift"
UNION ALL
SELECT 'UserTakenGift', COUNT(*) FROM "UserTakenGift"
UNION ALL
SELECT 'PersonalGift', COUNT(*) FROM "PersonalGift";
