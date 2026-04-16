-- Migration: add_modern_schema
-- Description: Ajouter les nouvelles tables pour le système multi-groupes et sous-cadeaux
-- Date: 2026-04-16

-- ==================================================
-- ÉTAPE 1: Créer les ENUMS
-- ==================================================

-- Créer l'enum Role pour UserGroupMapping
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN');

-- Créer l'enum GiftType pour Gift
CREATE TYPE "GiftType" AS ENUM ('SIMPLE', 'MULTIPLE');

-- ==================================================
-- ÉTAPE 2: Créer les NOUVELLES TABLES
-- ==================================================

-- Table UserGroupMapping (relation many-to-many users ↔ groupes)
CREATE TABLE "UserGroupMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroupMapping_pkey" PRIMARY KEY ("id")
);

-- Table UserTakenGift (réservations de cadeaux)
CREATE TABLE "UserTakenGift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTakenGift_pkey" PRIMARY KEY ("id")
);

-- Table PersonalGift (cadeaux personnels qu'on apporte)
CREATE TABLE "PersonalGift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "userId" TEXT NOT NULL,
    "forUserId" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalGift_pkey" PRIMARY KEY ("id")
);

-- ==================================================
-- ÉTAPE 3: Ajouter les NOUVELLES COLONNES à Gift
-- ==================================================

-- Ajouter giftType (SIMPLE par défaut)
ALTER TABLE "Gift" ADD COLUMN "giftType" "GiftType" NOT NULL DEFAULT 'SIMPLE';

-- Ajouter parentGiftId pour les sous-cadeaux
ALTER TABLE "Gift" ADD COLUMN "parentGiftId" TEXT;

-- ==================================================
-- ÉTAPE 4: Créer les INDEXES
-- ==================================================

-- Index pour User.name (recherche rapide)
CREATE INDEX "User_name_idx" ON "User"("name");

-- Index pour UserGroupMapping
CREATE UNIQUE INDEX "UserGroupMapping_userId_groupId_key" ON "UserGroupMapping"("userId", "groupId");
CREATE INDEX "UserGroupMapping_userId_idx" ON "UserGroupMapping"("userId");
CREATE INDEX "UserGroupMapping_groupId_idx" ON "UserGroupMapping"("groupId");

-- Index pour UserTakenGift
CREATE UNIQUE INDEX "UserTakenGift_userId_giftId_key" ON "UserTakenGift"("userId", "giftId");
CREATE INDEX "UserTakenGift_userId_idx" ON "UserTakenGift"("userId");
CREATE INDEX "UserTakenGift_giftId_idx" ON "UserTakenGift"("giftId");

-- Index pour PersonalGift
CREATE INDEX "PersonalGift_userId_idx" ON "PersonalGift"("userId");
CREATE INDEX "PersonalGift_groupId_idx" ON "PersonalGift"("groupId");
CREATE INDEX "PersonalGift_forUserId_idx" ON "PersonalGift"("forUserId");

-- Index pour Gift
CREATE INDEX "Gift_parentGiftId_idx" ON "Gift"("parentGiftId");

-- ==================================================
-- ÉTAPE 5: Ajouter les FOREIGN KEYS
-- ==================================================

-- UserGroupMapping → User
ALTER TABLE "UserGroupMapping" ADD CONSTRAINT "UserGroupMapping_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserGroupMapping → Group
ALTER TABLE "UserGroupMapping" ADD CONSTRAINT "UserGroupMapping_groupId_fkey" 
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserTakenGift → User
ALTER TABLE "UserTakenGift" ADD CONSTRAINT "UserTakenGift_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserTakenGift → Gift
ALTER TABLE "UserTakenGift" ADD CONSTRAINT "UserTakenGift_giftId_fkey" 
    FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PersonalGift → User (créateur)
ALTER TABLE "PersonalGift" ADD CONSTRAINT "PersonalGift_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PersonalGift → User (destinataire, optionnel)
ALTER TABLE "PersonalGift" ADD CONSTRAINT "PersonalGift_forUserId_fkey" 
    FOREIGN KEY ("forUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PersonalGift → Group
ALTER TABLE "PersonalGift" ADD CONSTRAINT "PersonalGift_groupId_fkey" 
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Gift → Gift (self-relation pour sous-cadeaux)
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_parentGiftId_fkey" 
    FOREIGN KEY ("parentGiftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==================================================
-- MIGRATION DES DONNÉES
-- ==================================================
-- Cette partie sera exécutée par le script Node.js
-- Voir: migration/modernize_schema.js
