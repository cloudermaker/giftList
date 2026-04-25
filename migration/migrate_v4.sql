-- ============================================================================
-- MIGRATION v4.0.0 - Ma Liste de Cadeaux
-- ============================================================================
-- 
-- Ce script effectue la migration complète de la base de données vers v4.0.0
-- 
-- AVANT D'EXÉCUTER:
-- 1. Faire un backup via Neon Console
-- 2. Mettre l'application en maintenance
-- 3. Exécuter: psql "YOUR_DATABASE_URL" -f migration/migrate_v4.sql
-- 
-- DURÉE ESTIMÉE: < 1 minute pour une base normale
-- 
-- ============================================================================

-- Démarrer une transaction pour tout annuler en cas d'erreur
BEGIN;

-- ============================================================================
-- ÉTAPE 1: CRÉATION DES ENUMS
-- ============================================================================

DO $$ 
BEGIN
    -- Créer enum Role s'il n'existe pas déjà
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN');
        RAISE NOTICE 'Enum Role créé';
    ELSE
        RAISE NOTICE 'Enum Role existe déjà';
    END IF;

    -- Créer enum GiftType s'il n'existe pas déjà
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GiftType') THEN
        CREATE TYPE "GiftType" AS ENUM ('SIMPLE', 'MULTIPLE');
        RAISE NOTICE 'Enum GiftType créé';
    ELSE
        RAISE NOTICE 'Enum GiftType existe déjà';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2: CRÉATION DES NOUVELLES TABLES
-- ============================================================================

-- Table UserGroupMapping (relation many-to-many User <-> Group)
CREATE TABLE IF NOT EXISTS "UserGroupMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroupMapping_pkey" PRIMARY KEY ("id")
);

-- Index et contraintes pour UserGroupMapping
CREATE UNIQUE INDEX IF NOT EXISTS "UserGroupMapping_userId_groupId_key" 
    ON "UserGroupMapping"("userId", "groupId");

CREATE INDEX IF NOT EXISTS "UserGroupMapping_userId_idx" 
    ON "UserGroupMapping"("userId");

CREATE INDEX IF NOT EXISTS "UserGroupMapping_groupId_idx" 
    ON "UserGroupMapping"("groupId");

-- Contraintes de clés étrangères
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserGroupMapping_userId_fkey'
    ) THEN
        ALTER TABLE "UserGroupMapping" 
        ADD CONSTRAINT "UserGroupMapping_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserGroupMapping_groupId_fkey'
    ) THEN
        ALTER TABLE "UserGroupMapping" 
        ADD CONSTRAINT "UserGroupMapping_groupId_fkey" 
        FOREIGN KEY ("groupId") REFERENCES "Group"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Table UserTakenGift (qui a réservé quel cadeau)
CREATE TABLE IF NOT EXISTS "UserTakenGift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTakenGift_pkey" PRIMARY KEY ("id")
);

-- Index et contraintes pour UserTakenGift
CREATE UNIQUE INDEX IF NOT EXISTS "UserTakenGift_giftId_key" 
    ON "UserTakenGift"("giftId");

CREATE INDEX IF NOT EXISTS "UserTakenGift_userId_idx" 
    ON "UserTakenGift"("userId");

-- Contraintes de clés étrangères
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserTakenGift_userId_fkey'
    ) THEN
        ALTER TABLE "UserTakenGift" 
        ADD CONSTRAINT "UserTakenGift_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'UserTakenGift_giftId_fkey'
    ) THEN
        ALTER TABLE "UserTakenGift" 
        ADD CONSTRAINT "UserTakenGift_giftId_fkey" 
        FOREIGN KEY ("giftId") REFERENCES "Gift"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Table PersonalGift (cadeaux apportés par les invités)
CREATE TABLE IF NOT EXISTS "PersonalGift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "forUserId" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalGift_pkey" PRIMARY KEY ("id")
);

-- Index pour PersonalGift
CREATE INDEX IF NOT EXISTS "PersonalGift_userId_idx" 
    ON "PersonalGift"("userId");

CREATE INDEX IF NOT EXISTS "PersonalGift_forUserId_idx" 
    ON "PersonalGift"("forUserId");

CREATE INDEX IF NOT EXISTS "PersonalGift_groupId_idx" 
    ON "PersonalGift"("groupId");

-- Contraintes de clés étrangères
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PersonalGift_userId_fkey'
    ) THEN
        ALTER TABLE "PersonalGift" 
        ADD CONSTRAINT "PersonalGift_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PersonalGift_forUserId_fkey'
    ) THEN
        ALTER TABLE "PersonalGift" 
        ADD CONSTRAINT "PersonalGift_forUserId_fkey" 
        FOREIGN KEY ("forUserId") REFERENCES "User"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PersonalGift_groupId_fkey'
    ) THEN
        ALTER TABLE "PersonalGift" 
        ADD CONSTRAINT "PersonalGift_groupId_fkey" 
        FOREIGN KEY ("groupId") REFERENCES "Group"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Ajouter la colonne giftType à Gift si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Gift' AND column_name = 'giftType'
    ) THEN
        ALTER TABLE "Gift" ADD COLUMN "giftType" "GiftType" NOT NULL DEFAULT 'SIMPLE';
        RAISE NOTICE 'Colonne giftType ajoutée à Gift';
    ELSE
        RAISE NOTICE 'Colonne giftType existe déjà';
    END IF;
END $$;

RAISE NOTICE '';
RAISE NOTICE '✅ Tables et colonnes créées';
RAISE NOTICE '';

-- ============================================================================
-- ÉTAPE 3: MIGRATION DES DONNÉES
-- ============================================================================

RAISE NOTICE '🔄 Début de la migration des données...';
RAISE NOTICE '';

-- 3.1: Migrer User.groupId → UserGroupMapping (tous en ADMIN)
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    INSERT INTO "UserGroupMapping" ("id", "userId", "groupId", "role", "joinedAt")
    SELECT 
        gen_random_uuid()::text,
        "id" as "userId",
        "groupId",
        'ADMIN'::"Role",
        COALESCE("createdAt", CURRENT_TIMESTAMP)
    FROM "User"
    WHERE "groupId" IS NOT NULL
    ON CONFLICT ("userId", "groupId") DO NOTHING;
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE '  ✓ % utilisateurs migrés vers UserGroupMapping', migrated_count;
END $$;

-- 3.2: Migrer Gift.takenUserId → UserTakenGift
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    INSERT INTO "UserTakenGift" ("id", "userId", "giftId", "takenAt")
    SELECT 
        gen_random_uuid()::text,
        "takenUserId" as "userId",
        "id" as "giftId",
        COALESCE("updatedAt", CURRENT_TIMESTAMP)
    FROM "Gift"
    WHERE "takenUserId" IS NOT NULL
    ON CONFLICT ("giftId") DO NOTHING;
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE '  ✓ % réservations migrées vers UserTakenGift', migrated_count;
END $$;

-- 3.3: Migrer les cadeaux personnels (Gift avec userId=null) → PersonalGift
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    -- Trouver les cadeaux sans userId et avec un parent ayant un userId
    INSERT INTO "PersonalGift" ("id", "name", "description", "userId", "forUserId", "groupId", "createdAt")
    SELECT 
        g."id",
        g."name",
        g."description",
        pg."userId",  -- Le userId du parent
        NULL,  -- forUserId sera mis à jour par l'application
        pg."userGroupId" as "groupId",
        g."createdAt"
    FROM "Gift" g
    INNER JOIN "Gift" pg ON g."parentGiftId" = pg."id"
    WHERE g."userId" IS NULL 
      AND pg."userId" IS NOT NULL
      AND pg."userGroupId" IS NOT NULL
    ON CONFLICT ("id") DO NOTHING;
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE '  ✓ % cadeaux personnels migrés vers PersonalGift', migrated_count;
    
    -- Supprimer les cadeaux migrés de la table Gift
    IF migrated_count > 0 THEN
        DELETE FROM "Gift" 
        WHERE "id" IN (SELECT "id" FROM "PersonalGift");
        RAISE NOTICE '  ✓ Cadeaux personnels supprimés de Gift';
    END IF;
END $$;

-- 3.4: Mettre tous les gifts existants en SIMPLE
UPDATE "Gift" SET "giftType" = 'SIMPLE'::"GiftType" WHERE "giftType" IS NULL OR "giftType" = 'SIMPLE'::"GiftType";

RAISE NOTICE '';
RAISE NOTICE '✅ Migration des données terminée';
RAISE NOTICE '';

-- ============================================================================
-- ÉTAPE 4: VALIDATION
-- ============================================================================

RAISE NOTICE '✅ Validation de la migration...';
RAISE NOTICE '';

DO $$
DECLARE
    user_count INTEGER;
    mapping_count INTEGER;
    gift_taken_count INTEGER;
    taken_count INTEGER;
    personal_count INTEGER;
    orphan_count INTEGER;
BEGIN
    -- Vérifier UserGroupMapping
    SELECT COUNT(*) INTO user_count FROM "User" WHERE "groupId" IS NOT NULL;
    SELECT COUNT(*) INTO mapping_count FROM "UserGroupMapping";
    
    IF mapping_count < user_count THEN
        RAISE EXCEPTION 'ERREUR: UserGroupMapping incomplet (% users, % mappings)', user_count, mapping_count;
    END IF;
    RAISE NOTICE '  ✓ UserGroupMapping: % entrées (>= % users)', mapping_count, user_count;
    
    -- Vérifier UserTakenGift
    SELECT COUNT(*) INTO gift_taken_count FROM "Gift" WHERE "takenUserId" IS NOT NULL;
    SELECT COUNT(*) INTO taken_count FROM "UserTakenGift";
    
    IF taken_count < gift_taken_count THEN
        RAISE EXCEPTION 'ERREUR: UserTakenGift incomplet (% gifts réservés, % entrées)', gift_taken_count, taken_count;
    END IF;
    RAISE NOTICE '  ✓ UserTakenGift: % réservations migrées', taken_count;
    
    -- Vérifier PersonalGift
    SELECT COUNT(*) INTO personal_count FROM "PersonalGift";
    RAISE NOTICE '  ✓ PersonalGift: % cadeaux personnels', personal_count;
    
    -- Vérifier les orphelins (cadeaux sans user ni parent)
    SELECT COUNT(*) INTO orphan_count 
    FROM "Gift" 
    WHERE "userId" IS NULL AND "parentGiftId" IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'ATTENTION: % cadeaux orphelins détectés (userId=NULL, parentGiftId=NULL)', orphan_count;
    ELSE
        RAISE NOTICE '  ✓ Aucun cadeau orphelin';
    END IF;
END $$;

RAISE NOTICE '';
RAISE NOTICE '✅ Validation réussie';
RAISE NOTICE '';

-- ============================================================================
-- ÉTAPE 5 (OPTIONNELLE): CLEANUP DES ANCIENNES COLONNES
-- ============================================================================
-- 
-- ⚠️  DÉCOMMENTER CETTE SECTION SEULEMENT APRÈS VALIDATION EN PRODUCTION
-- ⚠️  Attendre 24-48h minimum avant de supprimer les colonnes
-- 
-- Cette étape est IRRÉVERSIBLE !
-- 
-- -- Supprimer Gift.takenUserId
-- ALTER TABLE "Gift" DROP COLUMN IF EXISTS "takenUserId";
-- RAISE NOTICE '  ✓ Colonne Gift.takenUserId supprimée';
-- 
-- -- Supprimer User.groupId
-- ALTER TABLE "User" DROP COLUMN IF EXISTS "groupId";
-- RAISE NOTICE '  ✓ Colonne User.groupId supprimée';
-- 
-- RAISE NOTICE '';
-- RAISE NOTICE '✅ Cleanup terminé - colonnes obsolètes supprimées';
-- RAISE NOTICE '';

-- ============================================================================
-- VALIDATION FINALE ET COMMIT
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
RAISE NOTICE '║  ✅ MIGRATION v4.0.0 TERMINÉE AVEC SUCCÈS                 ║';
RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
RAISE NOTICE '';
RAISE NOTICE 'Prochaines étapes:';
RAISE NOTICE '1. Vérifier que l''application fonctionne correctement';
RAISE NOTICE '2. Générer le client Prisma: npx prisma generate';
RAISE NOTICE '3. Redémarrer l''application';
RAISE NOTICE '4. Tester toutes les fonctionnalités';
RAISE NOTICE '5. Surveiller pendant 24-48h';
RAISE NOTICE '6. Décommenter et exécuter le cleanup si tout va bien';
RAISE NOTICE '';

-- Commiter la transaction
COMMIT;
