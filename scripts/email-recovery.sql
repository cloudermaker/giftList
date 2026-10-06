-- Email de secours + liens de connexion (v5.6.0)
-- 100 % additif : sans risque pour le code déjà en production. À lancer AVANT le déploiement (test puis prod).
-- Rejouable : IF NOT EXISTS partout.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailIsAdminKey" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "LoginToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "grantsAdmin" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoginToken_tokenHash_key" ON "LoginToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "LoginToken_expiresAt_idx" ON "LoginToken"("expiresAt");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Vérification : doit renvoyer 3 lignes
SELECT column_name FROM information_schema.columns
WHERE table_name = 'User' AND column_name IN ('email', 'emailIsAdminKey', 'emailVerifiedAt');
