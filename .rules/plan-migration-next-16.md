# Plan de Migration : Next.js 16 et Mise à Jour des Dépendances

## 📊 État des Lieux

**Version actuelle de l'application :** 3.8.0

**Architecture actuelle :**

- Next.js 15.5.4 (Pages Router)
- React 18.3.1
- TypeScript 5.7.3
- Prisma 5.22.0
- Node.js 22.20.0
- Tailwind CSS 3.4.17

---

## 🚨 Mises à Jour Critiques

### 1. **Next.js 15.5.4 → 16.0.5** ⚠️ BREAKING CHANGES

**Criticité :** 🔴 MAJEURE

**Version actuelle :** 15.5.4  
**Dernière version :** 16.0.5  
**Type :** Major upgrade (breaking changes attendus)

**Changements majeurs Next.js 16 :**

- **App Router devient la recommandation par défaut** (Pages Router toujours supporté)
- **React 19 recommandé** (mais React 18 toujours compatible)
- **Turbopack devient stable** pour dev et build
- **Nouvelles APIs de caching**
- **Améliorations du build pipeline**

**Impacts potentiels :**

- ⚠️ Changements dans le comportement de `next/image`
- ⚠️ Modifications des conventions de routing (si migration App Router)
- ⚠️ Nouvelles configurations de cache par défaut
- ⚠️ Dépréciation de certaines APIs (à vérifier dans changelog)

**Recommandation :** **DIFFÉRER** - Rester sur Next.js 15.x pour stabilité  
**Alternative :** Passer à Next.js 15.5.6 (dernière 15.x) pour patches de sécurité

---

### 2. **Prisma 5.22.0 → 7.0.1** ⚠️ BREAKING CHANGES

**Criticité :** 🔴 MAJEURE

**Version actuelle :** 5.22.0  
**Dernière version :** 7.0.1  
**Type :** Major upgrade

**Changements majeurs Prisma 7 :**

- **TypedSQL natif** (nouvelle façon d'écrire des requêtes)
- **Refonte du générateur de types**
- **Changements dans les migrations**
- **Nouvelles APIs de connexion**
- **Support Node.js 18+ minimum**

**Impacts potentiels :**

- ⚠️ Migration du schema Prisma potentiellement requise
- ⚠️ Types générés peuvent changer
- ⚠️ Changements dans `@prisma/client` API
- ⚠️ Performances et comportement des requêtes

---

## 🔍 Analyse Approfondie de l'Impact Prisma 7 sur Votre Code

### État des Lieux de l'Architecture Prisma

**Modèles existants :**

```prisma
model Group {
  id            String   @id @default(uuid())
  name          String
  users         User[]
  createdAt     DateTime? @default(now())
  updatedAt     DateTime? @updatedAt
}

model User {
  id        String   @id @default(uuid())
  name      String
  groupId   String?
  gifts     Gift[]   @relation(name: "user")
  takenGifts Gift[]  @relation(name: "takenUser")
  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
}

model Gift {
  id          String   @id @default(uuid())
  name        String
  userId      String?
  takenUserId String?
  order       Int?
  user        User?    @relation(fields: [userId], references: [id], name: "user")
  takenUser   User?    @relation(fields: [takenUserId], references: [id], name: "takenUser")
  createdAt   DateTime? @default(now())
  updatedAt   DateTime? @updatedAt
}
```

**Managers actuels utilisant Prisma :**

- `lib/db/dbSingleton.ts` : Instance PrismaClient unique
- `lib/db/giftManager.ts` : 9 fonctions (CRUD complet)
- `lib/db/userManager.ts` : 8 fonctions (CRUD complet)
- `lib/db/groupManager.ts` : 8 fonctions (CRUD complet)

**Total de fichiers impactés :** 12 fichiers TypeScript

---

### 📋 Analyse Détaillée des Patterns Utilisés

#### 1. **PrismaClient Singleton** ✅ Compatible

**Fichier :** `lib/db/dbSingleton.ts`

```typescript
const prismaClientSingleton = () => {
    return new PrismaClient();
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
```

**Impact Prisma 7 :** 🟢 **AUCUN**

- Pattern recommandé par Prisma (toutes versions)
- Continuera de fonctionner tel quel

---

#### 2. **Requêtes CRUD Basiques** ✅ Compatible

**Patterns utilisés dans votre code :**

**findFirst / findMany :**

```typescript
// giftManager.ts - 2 occurrences
await prisma.gift.findFirst({ where: { id } });
await prisma.gift.findMany({ where: { userId }, orderBy: { order: 'asc' } });

// userManager.ts - 3 occurrences
await prisma.user.findFirst({ where: { id: userId } });
await prisma.user.findMany({ where: { groupId } });

// groupManager.ts - 2 occurrences
await prisma.group.findFirst({ where: { id: groupId } });
```

**Impact Prisma 7 :** 🟢 **AUCUN**

- API stable, pas de breaking changes prévus

---

**create / update / delete :**

```typescript
// 3 managers utilisent ces patterns
await prisma.gift.create({ data: {...} });
await prisma.gift.update({ where: { id }, data: {...} });
await prisma.gift.delete({ where: { id } });
```

**Impact Prisma 7 :** 🟢 **AUCUN**

- Syntaxe identique

---

#### 3. **upsert** ⚠️ Bug Actuel Détecté

**Occurrences dans votre code :**

- `giftManager.ts` : 1 occurrence
- `userManager.ts` : 1 occurrence
- `groupManager.ts` : 1 occurrence

```typescript
// Exemple actuel (giftManager.ts)
await prisma.gift.upsert({
    where: { id: gift.id ?? 'new-gift-placeholder' }, // ❌ PROBLÈME
    create: { ...gift, id: undefined, updatedAt: new Date().toISOString() },
    update: { ...gift, name: gift.name.trim(), updatedAt: new Date().toISOString() }
});
```

**Impact Prisma 7 :** 🔴 **CRITIQUE**

- **Bug actuel détecté** : Si `gift.id = ''` (chaîne vide), Prisma essaie de créer un UUID invalide
- Prisma 7 sera **plus strict** sur les validations d'ID
- Risque de crash en production

**Fix requis AVANT migration :**

```typescript
where: {
    id: (gift.id && gift.id.trim()) || crypto.randomUUID();
}
```

---

#### 4. **aggregate** ⚠️ Attention

**Occurrence dans votre code :**

- `giftManager.ts` : 1 occurrence

```typescript
var latestGift = await prisma.gift.aggregate({
    _max: {
        order: true
    }
});
```

**Impact Prisma 7 :** 🟡 **MINEUR**

- API `aggregate` stable
- Possibilité de typings plus stricts
- Votre usage est simple, risque faible

---

#### 5. **include** (Relations) ✅ Compatible

**Occurrence dans votre code :**

- `giftManager.ts` : 1 occurrence

```typescript
await prisma.gift.findMany({
    where: { takenUserId: userId },
    include: {
        user: true // Relation avec User
    },
    orderBy: { order: 'asc' }
});
```

**Impact Prisma 7 :** 🟢 **AUCUN**

- Pattern fondamental de Prisma, stable

---

#### 6. **Types générés (@prisma/client)** ⚠️ Attention

**Utilisation dans votre code :**

```typescript
import { Gift, User, Group } from '@prisma/client';
```

**Fichiers impactés :** 9 fichiers

- `pages/api/user/*.ts`
- `pages/api/group/*.ts`
- `pages/api/gift/*.ts`
- `lib/db/*Manager.ts`

**Impact Prisma 7 :** 🟠 **MOYEN**

**Changements possibles dans les types générés :**

1. Typage plus strict des relations
2. Types utilitaires refondus (`Prisma.GiftCreateInput`, `Prisma.GiftUpdateInput`)
3. Champs optionnels plus stricts

**Action requise :**

- Après migration : `npx prisma generate`
- Vérifier erreurs TypeScript
- Adapter les types si nécessaire

---

#### 7. **buildDefault Functions** 🔴 BREAKING

**Vos fonctions actuelles :**

```typescript
// giftManager.ts
export const buildDefaultGift = (userId: string, order: number, ...): Gift => {
    return {
        id: '',  // ⚠️ Problème : ID vide invalide
        name: name ?? '',
        userId,
        order,
        takenUserId: null,
        updatedAt: new Date(),
        createdAt: new Date()
    };
};
```

**Même pattern dans :**

- `userManager.ts` : `buildDefaultUser`
- `groupManager.ts` : `buildDefaultGroup`

**Impact Prisma 7 :** 🔴 **ÉLEVÉ**

**Problèmes détectés :**

1. **ID vide (`''`) invalide** - Prisma 7 rejettera les UUIDs vides
2. **Types plus stricts** - `updatedAt`/`createdAt` incompatibles

**Fix recommandé :**

```typescript
// Utiliser les types Prisma natifs
export const buildDefaultGift = (userId: string, order: number, ...): Prisma.GiftCreateInput => {
    return {
        name: name ?? '',
        description: description ?? '',
        url: url ?? '',
        order,
        user: { connect: { id: userId } },
        // Prisma gère automatiquement id, createdAt, updatedAt
    };
};
```

---

#### 8. **updateGifts en boucle (N+1 queries)** 🔴 Performance

**Fichier :** `lib/db/giftManager.ts:68-80`

```typescript
export const updateGifts = async (gifts: Gift[]): Promise<Gift[]> => {
    let updatedGifts: Gift[] = [];
    for (const gift of gifts) {
        const updatedGift = await prisma.gift.update({...});  // ❌ N requêtes
        updatedGifts.push(updatedGift);
    }
    return updatedGifts;
};
```

**Impact Prisma 7 :** 🟡 **PERFORMANCE**

- Pas de breaking change, mais inefficace
- Prisma 7 recommande transactions

**Fix recommandé :**

```typescript
export const updateGifts = async (gifts: Gift[]): Promise<Gift[]> => {
    return await prisma.$transaction(
        gifts.map((gift) =>
            prisma.gift.update({
                where: { id: gift.id },
                data: { ...gift, name: gift.name.trim(), updatedAt: new Date() }
            })
        )
    );
};
```

---

### 📊 Résumé des Impacts Prisma 7

| Catégorie                   | Impact                      | Fichiers | Effort |
| --------------------------- | --------------------------- | -------- | ------ |
| **PrismaClient Singleton**  | 🟢 Aucun                    | 1        | 0h     |
| **CRUD basique**            | 🟢 Aucun                    | 3        | 0h     |
| **upsert**                  | 🔴 Bugs à corriger          | 3        | 1h     |
| **aggregate**               | 🟡 Tests nécessaires        | 1        | 0.5h   |
| **include (relations)**     | 🟢 Aucun                    | 1        | 0h     |
| **Types générés**           | 🟠 Vérification TS          | 9        | 2h     |
| **buildDefault fonctions**  | 🔴 Refonte nécessaire       | 3        | 2h     |
| **updateGifts performance** | 🟡 Optimisation recommandée | 1        | 1h     |

**Total estimé : 6-7 heures de travail**

---

### ✅ Actions Recommandées AVANT Migration Prisma 7

1. **Corriger le bug upsert** (URGENT - même pour rester en Prisma 5)

    ```typescript
    // giftManager.ts:92
    where: {
        id: gift.id?.trim() || crypto.randomUUID();
    }
    ```

2. **Refactoriser buildDefault functions**

    - Utiliser `Prisma.GiftCreateInput` au lieu de `Gift`
    - Supprimer les `id: ''` invalides

3. **Optimiser updateGifts**

    - Utiliser `$transaction` au lieu de boucle

4. **Simplifier les conversions Date**
    - Remplacer `new Date().toISOString()` par `new Date()`

---

### 🎯 Plan de Migration Prisma 7 Révisé

#### Phase 1 : Préparation (2h)

1. ✅ Corriger les bugs identifiés ci-dessus
2. ✅ Ajouter des tests unitaires pour les managers
3. ✅ Créer une branche dédiée `feat/prisma-7`

#### Phase 2 : Migration (1h)

1. Mettre à jour : `npm install prisma@7 @prisma/client@7`
2. Régénérer : `npx prisma generate`
3. Vérifier erreurs TypeScript

#### Phase 3 : Corrections (3h)

1. Adapter les types générés (9 fichiers)
2. Tester chaque manager individuellement
3. Vérifier les relations (include)

#### Phase 4 : Tests (2h)

1. Tests unitaires des managers
2. Tests d'intégration des APIs
3. Tests E2E complets

**Durée totale estimée : 8 heures** (au lieu de 3-5 jours)

---

**Recommandation :** **Corriger d'abord les bugs actuels**, puis migrer Prisma 7 en Q2 2026  
**Alternative :** Rester sur Prisma 5.x (LTS jusqu'à fin 2025)

---

### 3. **React 18.3.1 → 19.2.0** ⚠️ BREAKING CHANGES

**Criticité :** 🟠 HAUTE

**Version actuelle :** 18.3.1  
**Dernière version :** 19.2.0  
**Type :** Major upgrade

**Changements majeurs React 19 :**

- **Nouveau compilateur React** (React Compiler)
- **Actions et Form APIs natives**
- **Changements dans les hooks** (useTransition, useOptimistic)
- **Dépréciation de certaines APIs** (forwardRef, etc.)
- **Nouveaux patterns de suspense**

**Impacts potentiels :**

- ⚠️ Composants utilisant `forwardRef` à migrer
- ⚠️ Hooks custom potentiellement impactés
- ⚠️ Comportement du rendu peut changer
- ⚠️ Librairies tierces doivent supporter React 19

**Dépendances impactées :**

- `@types/react` : 18.0.26 → 19.2.7
- `@types/react-dom` : 18.0.9 → 19.2.3
- `react-select`, `react-spinners`, `react-helmet` : vérifier compatibilité

**Recommandation :** **DIFFÉRER** - Attendre que Next.js 16 soit stable avec React 19  
**Alternative :** Rester sur React 18.x (stable et bien supporté)

---

### 4. **Tailwind CSS 3.4.17 → 4.1.17** ⚠️ BREAKING CHANGES

**Criticité :** 🟠 HAUTE

**Version actuelle :** 3.4.17  
**Dernière version :** 4.1.17  
**Type :** Major upgrade

**Changements majeurs Tailwind 4 :**

- **Nouveau moteur de génération CSS** (Oxide)
- **Configuration en CSS natif** (au lieu de tailwind.config.js)
- **Nouvelles classes utilitaires**
- **Suppression de certaines classes dépréciées**
- **Changements dans le système de couleurs**

**Impacts potentiels :**

- ⚠️ `tailwind.config.js` doit être migré vers CSS
- ⚠️ Classes custom peuvent ne plus fonctionner
- ⚠️ Thème personnalisé à migrer
- ⚠️ PostCSS configuration à adapter

**Recommandation :** **DIFFÉRER** - Migration manuelle importante  
**Alternative :** Passer à Tailwind 3.4.18 (dernière 3.x stable)

---

### 5. **FontAwesome 6.7.2 → 7.1.0** ⚠️ BREAKING CHANGES

**Criticité :** 🟡 MOYENNE

**Version actuelle :** 6.7.2  
**Dernière version :** 7.1.0  
**Type :** Major upgrade

**react-fontawesome :** 0.2.2 → 3.1.0 (BREAKING)

**Impacts potentiels :**

- ⚠️ API de `@fortawesome/react-fontawesome` changée
- ⚠️ Nouvelles icônes, certaines peuvent être renommées
- ⚠️ Props des composants modifiés

**Recommandation :** **À PLANIFIER** - Migration modérée, bénéfices visuels  
**Alternative :** Rester sur FontAwesome 6.x (stable)

---

## ✅ Mises à Jour Sûres (Patches/Minor)

Ces mises à jour sont **recommandées** car elles apportent des correctifs de sécurité et bugs sans breaking changes.

### Haute Priorité (Sécurité)

```json
{
    "axios": "1.12.2 → 1.13.2", // Correctifs de sécurité
    "typescript": "5.7.3 → 5.9.3", // Dernière version stable
    "sweetalert2": "11.23.0 → 11.26.3", // Correctifs bugs
    "nodemailer": "7.0.7 → 7.0.11", // Correctifs bugs
    "pg": "8.13.1 → 8.16.3" // Correctifs PostgreSQL
}
```

### Moyenne Priorité (Améliorations)

```json
{
    "@types/node": "24.6.2 → 24.10.1",
    "@types/nodemailer": "7.0.2 → 7.0.4",
    "@types/lodash": "4.17.14 → 4.17.21",
    "react-select": "5.10.1 → 5.10.2",
    "prettier": "3.4.2 → 3.7.1",
    "autoprefixer": "10.4.20 → 10.4.22"
}
```

### Basse Priorité (Fonctionnalités)

```json
{
    "@dnd-kit/sortable": "8.0.0 → 10.0.0", // Nouvelles fonctionnalités drag-and-drop
    "react-spinners": "0.13.8 → 0.17.0", // Nouveaux spinners
    "uuid": "11.1.0 → 13.0.0" // Nouvelles APIs
}
```

---

## 🎯 Plan de Migration Recommandé

### Phase 1 : Mises à jour de sécurité (IMMÉDIAT) ⚡

**Durée estimée :** 1-2 heures  
**Risque :** 🟢 Faible

**Actions :**

1. Mettre à jour les dépendances de sécurité
2. Tester l'application complète
3. Vérifier les tests

**Commandes :**

```bash
npm install axios@latest typescript@latest sweetalert2@latest nodemailer@latest pg@latest
npm install @types/node@latest @types/nodemailer@latest @types/lodash@latest
npm test
npm run build
```

**Tests de non-régression :**

- ✅ Authentification fonctionne
- ✅ Création/édition de cadeaux
- ✅ Réservation de cadeaux
- ✅ Envoi d'emails
- ✅ Connexion PostgreSQL

---

### Phase 2 : Stabilisation Next.js 15 (COURT TERME) 📦

**Durée estimée :** 1 heure  
**Risque :** 🟢 Faible

**Objectif :** Rester sur Next.js 15.x mais passer à la dernière version stable

**Actions :**

1. Passer à Next.js 15.5.6 (dernière 15.x)
2. Mettre à jour `eslint-config-next` compatible

**Commandes :**

```bash
npm install next@15.5.6 eslint-config-next@^15
npm run build
```

**Bénéfices :**

- ✅ Correctifs de bugs Next.js 15
- ✅ Patches de sécurité
- ✅ Stabilité garantie
- ✅ Temps pour planifier Next.js 16

---

### Phase 3 : Migration Next.js 16 (MOYEN TERME) 🚀

**Durée estimée :** 3-5 jours  
**Risque :** 🟠 Moyen-Élevé

**Pré-requis :**

- ✅ Documentation Next.js 16 complète lue
- ✅ Tests E2E en place
- ✅ Branch dédiée créée

**Option A : Rester sur Pages Router (RECOMMANDÉ)**

Moins de breaking changes, migration plus simple.

**Actions :**

1. Mettre à jour Next.js vers 16.0.5
2. Vérifier les dépréciations dans la console
3. Adapter les configurations de cache si nécessaire
4. Tester toutes les pages et APIs

**Breaking changes potentiels :**

- Configuration de `next.config.js` (vérifier changelog)
- Comportement de `getServerSideProps` / `getStaticProps`
- Nouvelles conventions de `middleware.ts`
- APIs de cache

**Option B : Migration vers App Router (NON RECOMMANDÉ pour l'instant)**

Migration lourde, à faire uniquement si bénéfices clairs.

**Effort estimé :** 10-15 jours (refonte complète)

---

### Phase 4 : Migration React 19 (LONG TERME) ⚛️

**Durée estimée :** 5-7 jours  
**Risque :** 🔴 Élevé

**Pré-requis :**

- ✅ Next.js 16 stable en production
- ✅ Toutes les dépendances compatibles React 19
- ✅ Tests unitaires complets

**Actions :**

1. Vérifier compatibilité de toutes les librairies tierces
2. Mettre à jour React + React-DOM vers 19.x
3. Migrer les composants utilisant `forwardRef`
4. Adapter les hooks custom
5. Tester intensivement

**Librairies à vérifier :**

- `react-select` : Vérifier support React 19
- `react-spinners` : Vérifier support React 19
- `react-helmet` : Possiblement à remplacer par `next/head`
- `@fortawesome/react-fontawesome` : Vérifier compatibilité

---

### Phase 5 : Migration Prisma 7 (LONG TERME) 🗄️

**Durée estimée :** 3-5 jours  
**Risque :** 🟠 Moyen

**Pré-requis :**

- ✅ Backup complet de la base de données
- ✅ Tests de migration en environnement de dev
- ✅ Documentation Prisma 7 migration guide lue

**Actions :**

1. Lire le guide de migration Prisma 5 → 7
2. Mettre à jour `@prisma/client` et `prisma`
3. Régénérer les types : `npx prisma generate`
4. Tester toutes les requêtes DB
5. Vérifier les performances

**Tests critiques :**

- ✅ Création/lecture/modification/suppression de cadeaux
- ✅ Gestion des utilisateurs
- ✅ Gestion des groupes
- ✅ Relations entre modèles
- ✅ Migrations Prisma fonctionnent

---

### Phase 6 : Migration Tailwind 4 (OPTIONNEL) 🎨

**Durée estimée :** 3-5 jours  
**Risque :** 🟠 Moyen

**Actions :**

1. Lire le guide de migration Tailwind 3 → 4
2. Migrer `tailwind.config.js` vers CSS
3. Adapter les classes custom
4. Vérifier tous les styles de l'application
5. Tester responsive

**Bénéfices :**

- ✅ Build plus rapide (Oxide engine)
- ✅ Nouvelles fonctionnalités CSS
- ✅ Meilleure DX

**Inconvénients :**

- ❌ Migration manuelle importante
- ❌ Risque de casse de styles

---

## 📅 Planning Recommandé

### Roadmap sur 6 mois

**Mois 1 (Décembre 2025)** ⚡

- ✅ Phase 1 : Mises à jour de sécurité (FAIT IMMÉDIATEMENT)
- ✅ Phase 2 : Stabilisation Next.js 15.5.6

**Mois 2-3 (Janvier-Février 2026)** 📦

- Monitoring de Next.js 16 en production (autres projets)
- Veille sur les retours communauté
- Préparation de la documentation migration

**Mois 3-4 (Mars-Avril 2026)** 🚀

- ✅ Phase 3 : Migration Next.js 16 (Pages Router)
- Tests intensifs
- Déploiement progressif

**Mois 5 (Mai 2026)** ⚛️

- ✅ Phase 4 : Migration React 19
- Vérification compatibilité librairies

**Mois 6 (Juin 2026)** 🗄️

- ✅ Phase 5 : Migration Prisma 7
- Optimisations performances

**Optionnel (Q3 2026)** 🎨

- Phase 6 : Migration Tailwind 4 (si bénéfices clairs)

---

## ⚠️ Risques et Mitigations

### Risques majeurs

1. **Breaking changes non détectés**

    - Mitigation : Tests E2E complets, déploiement progressif

2. **Incompatibilités entre dépendances**

    - Mitigation : Vérifier matrice de compatibilité, tester en isolation

3. **Régression de performance**

    - Mitigation : Benchmarks avant/après, monitoring en prod

4. **Problèmes de migration Prisma**

    - Mitigation : Backup DB, tests en staging, rollback plan

5. **Styles cassés (Tailwind 4)**
    - Mitigation : Screenshots automatisés, tests visuels

---

## 🎯 Recommandation Finale

### Action Immédiate (Cette semaine)

✅ **Phase 1 : Mises à jour de sécurité**

- Axios, TypeScript, SweetAlert2, Nodemailer, PG
- Risque minimal, bénéfices immédiats

### Court Terme (Ce mois)

✅ **Phase 2 : Next.js 15.5.6**

- Stabilité garantie
- Patches de sécurité
- Temps pour planifier Next.js 16

### Moyen Terme (Q1 2026)

⏸️ **Attendre stabilisation Next.js 16**

- Laisser la communauté tester
- Identifier les breaking changes réels
- Préparer la migration

### Long Terme (Q2-Q3 2026)

📅 **Migrations majeures planifiées**

- Next.js 16 → React 19 → Prisma 7
- Une à la fois, avec tests complets

### À Éviter

❌ **Ne PAS migrer tout d'un coup** ❌ **Ne PAS migrer en production sans tests** ❌ **Ne PAS sous-estimer Tailwind 4** (migration
manuelle importante)

---

## 📝 Checklist de Migration

### Avant chaque migration majeure

- [ ] Lire le guide de migration officiel complet
- [ ] Créer une branche dédiée
- [ ] Faire un backup de la base de données
- [ ] Préparer un plan de rollback
- [ ] Mettre à jour les tests
- [ ] Tester en local
- [ ] Tester en staging
- [ ] Déploiement progressif en production
- [ ] Monitoring intensif post-déploiement

---

**Date de création :** 27 novembre 2025  
**Version actuelle de l'app :** 3.8.0  
**Prochaine révision :** Janvier 2026
