-- ============================================================
-- Ideas board (v5.4.0) — table "Idea", purement ADDITIF.
-- À exécuter MANUELLEMENT :
--   1. sur la base de TEST (pour les tests e2e)
--   2. sur la base de PROD — avant ou après le merge, sans risque
-- ============================================================

CREATE TABLE "Idea" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "likes"       INTEGER NOT NULL DEFAULT 0,
    "doneAt"      TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Idea_doneAt_likes_idx" ON "Idea"("doneAt", "likes");
