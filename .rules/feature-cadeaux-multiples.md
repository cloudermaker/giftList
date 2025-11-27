# Feature : Cadeaux Multiples et Collections

## 📋 Problématique

Actuellement, un cadeau = 1 réservation. Cela pose problème pour :

- **Collections** (mangas, livres, films) : "Naruto tome 5, 6, 7..." → besoin de créer 3 cadeaux différents
- **Quantités multiples** : "Je veux 3 paires de chaussettes" → impossible de le spécifier
- **Cadeaux récurrents** : "Chaque année je veux du chocolat" → besoin de supprimer/recréer

## 🎯 Objectifs

1. Permettre de demander plusieurs exemplaires d'un même cadeau
2. Gérer les collections (tomes, volumes, épisodes)
3. Supporter les cadeaux "illimités" (plusieurs personnes peuvent offrir)
4. Éviter la multiplication des entrées dans la liste

## 💡 Solution : Système de Variantes

**Nouveau modèle de données :**

```prisma
model Gift {
  id          String   @id @default(cuid())
  name        String
  description String?
  url         String?
  userId      String?
  groupId     String

  // NOUVEAU
  isCollection Boolean @default(false)
  isUnlimited  Boolean @default(false)

  variants    GiftVariant[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model GiftVariant {
  id          String   @id @default(cuid())
  giftId      String
  gift        Gift     @relation(fields: [giftId], references: [id], onDelete: Cascade)

  label       String   // "Tome 5", "Tome 6", "Paire blanche", "Paire rouge"
  position    Int      // Pour trier

  takenById   String?
  takenBy     User?    @relation(fields: [takenById], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([giftId])
}
```

**Fonctionnement :**

1. **Collections (Mangas, Livres, Films)**

    - `isCollection = true`
    - Créer des variantes : "Tome 5", "Tome 6", "Tome 7"
    - Chaque variante peut être réservée indépendamment
    - L'utilisateur voit : "Naruto (3/10 tomes réservés)"

2. **Quantités multiples (Chaussettes)**

    - `isCollection = false`, créer N variantes
    - Labels : "Paire 1", "Paire 2", "Paire 3"
    - Ou labels personnalisés : "Paire blanche", "Paire rouge"

3. **Cadeaux illimités (Chocolat, Fleurs)**
    - `isUnlimited = true`
    - Pas de variantes
    - Plusieurs personnes peuvent "réserver" (ajout dans une liste)
    - Affichage : "Chocolat noir (réservé par Marie, Jean, Sophie)"

**Avantages :**

- ✅ Très flexible
- ✅ Traçabilité complète (qui a pris quoi)
- ✅ Gère tous les cas d'usage
- ✅ Interface claire pour l'utilisateur
- ✅ Facile d'ajouter/retirer des variantes

**Inconvénients :**

- Plus complexe à implémenter
- Nécessite migration de la DB
- Interface utilisateur plus riche nécessaire

---

## 🏗️ Plan d'Implémentation

### Phase 0 : Refactoring préparatoire ⚠️

**Avant de commencer la feature, refactoriser la page `giftList/[...id].tsx`**

**Problème actuel :**

- La page giftList est devenue énorme (plusieurs centaines de lignes)
- Logique d'affichage et de gestion des cadeaux mélangée
- Difficile à maintenir et tester
- Ajout de variantes va encore complexifier le code

**Objectif :** Créer un composant dédié `GiftItem.tsx` qui encapsule l'affichage et la gestion d'un cadeau

**Nouveau composant : `components/GiftItem.tsx`**

Architecture unifiée avec un seul composant gérant tous les états pour éviter les sauts visuels et faciliter la maintenance.

```typescript
interface GiftItemProps {
    gift: Gift & { variants?: GiftVariant[] };
    isOwner: boolean; // Est-ce le cadeau de l'utilisateur connecté ?
    isAdmin: boolean; // Est-ce un admin du groupe ?
    onUpdate: (gift: Gift) => void;
    onDelete: (giftId: string) => void;
    onReserve: (giftId: string) => void;
    onUnreserve: (giftId: string) => void;
}

export const GiftItem: React.FC<GiftItemProps> = ({ gift, isOwner, isAdmin, onUpdate, onDelete, onReserve, onUnreserve }) => {
    const [isEditing, setIsEditing] = useState(false);
    const hasVariants = gift.variants && gift.variants.length > 0;

    return (
        <div className="gift-card"> {/* Container unique avec styles communs */}

            {/* Header toujours visible */}
            <div className="gift-header">
                {isEditing ? (
                    <input value={name} onChange={...} />
                ) : (
                    <h3>{gift.name}</h3>
                )}
            </div>

            {/* Description */}
            <div className="gift-description">
                {isEditing ? (
                    <textarea value={description} onChange={...} />
                ) : (
                    <p>{gift.description}</p>
                )}
            </div>

            {/* Type et variantes (si édition) */}
            {isEditing && (
                <div className="gift-type-selector">
                    <select value={giftType} onChange={handleTypeChange}>
                        <option value="simple">Simple</option>
                        <option value="collection">Collection</option>
                        <option value="unlimited">Illimité</option>
                    </select>
                </div>
            )}

            {/* Variantes (affichage conditionnel) */}
            {hasVariants && (
                <div className="gift-variants">
                    {isEditing ? (
                        <VariantEditList variants={variants} onChange={setVariants} />
                    ) : (
                        <VariantDisplayList variants={gift.variants} onReserve={...} />
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="gift-actions">
                {isEditing ? (
                    <>
                        <button onClick={handleSave}>Enregistrer</button>
                        <button onClick={() => setIsEditing(false)}>Annuler</button>
                    </>
                ) : (
                    <>
                        {isOwner && <button onClick={() => setIsEditing(true)}>Modifier</button>}
                        {!hasVariants && <button onClick={handleReserve}>Réserver</button>}
                    </>
                )}
            </div>
        </div>
    );
};
```

**Avantages de cette approche :**

- ✅ **Transition fluide** : Même container, pas de démontage/remontage du composant
- ✅ **Styles unifiés** : Une seule classe `.gift-card` pour tous les états
- ✅ **Maintenance simplifiée** : Pas de synchronisation entre 3 composants différents
- ✅ **UX cohérente** : Pas de flash visuel lors du passage édition ↔ affichage
- ✅ **State local** : `isEditing` géré directement dans le composant

**Sous-composants utiles (dans le même fichier ou dossier `components/gift/`) :**

- `VariantEditList` : Liste éditable des variantes (ajout/suppression)
- `VariantDisplayList` : Affichage read-only avec boutons de réservation

**Fonctionnalités :**

- Changer le nom, description, lien (comme aujourd'hui)
- **NOUVEAU** : Choisir le type (Simple / Collection / Illimité)
- **NOUVEAU** : Si Collection, gérer les variantes (ajouter/supprimer)
- Sauvegarder les modifications (y compris la conversion Simple → Collection)

**Structure après refactoring :**

```
pages/giftList/[...id].tsx
  ├─ Logique de la page (fetch, tri, filtres)
  ├─ Layout général
  └─ Map des cadeaux → <GiftItem /> pour chaque cadeau

components/gift/
  ├─ GiftItem.tsx (composant principal unifié)
  │   ├─ Affichage et édition dans le même container
  │   ├─ Gestion des états (isEditing, hasVariants)
  │   └─ Gestion des interactions
  │
  ├─ VariantEditList.tsx (sous-composant)
  │   └─ Liste éditable de variantes
  │
  └─ VariantDisplayList.tsx (sous-composant)
      └─ Affichage read-only avec réservation
```

**Bénéfices :**

- ✅ Code plus lisible et maintenable
- ✅ Composant réutilisable
- ✅ Facilite l'ajout des variantes (tout sera dans GiftItem)
- ✅ Plus facile à tester unitairement
- ✅ **UX fluide** : Pas de rechargement visuel entre modes
- ✅ **Styles cohérents** : Un seul container, styles automatiquement synchronisés
- ✅ **Maintenance simplifiée** : Pas de duplication de code CSS entre composants

**Estimation : 1 jour**

---

### Phase 1 : Base de données

**1.1 Migration Prisma**

```bash
# Créer la migration
npx prisma migrate dev --name add_gift_variants
```

**1.2 Schéma**

- Ajouter le modèle `GiftVariant`
- Ajouter les champs `isCollection`, `isUnlimited` à `Gift`

**1.3 Mise à jour des managers**

- `lib/db/giftManager.ts` :
    - `createGift()` avec support des variantes
    - `getGiftsWithVariants()` : include les variantes
    - `createVariant()`, `deleteVariant()`, `updateVariant()`
    - `reserveVariant()`, `unreserveVariant()`

### Phase 2 : API

**2.1 Endpoints existants à adapter**

- `POST /api/gift` : supporter `variants[]` dans le body
- `PUT /api/gift/[id]` : permettre ajout/modification de variantes
- `GET /api/gift` : inclure les variantes dans la réponse

**2.2 Nouveaux endpoints**

```typescript
// /api/gift/[id]/variant
POST   → créer une variante
PUT    → modifier une variante
DELETE → supprimer une variante

// /api/gift/[id]/variant/[variantId]/reserve
POST   → réserver une variante
DELETE → annuler réservation variante
```

### Phase 3 : Interface Utilisateur

**3.1 Formulaire de création/édition**

Le formulaire permet de choisir le type dès la création OU lors de l'édition :

```
┌─────────────────────────────────────┐
│ Nom du cadeau: [Naruto             ]│
│ Description:   [Manga shonen       ]│
│ Lien:          [https://...        ]│
│                                      │
│ Type de cadeau:                      │
│ ○ Simple (par défaut)                │
│ ● Collection / Plusieurs exemplaires│
│ ○ Illimité (plusieurs personnes)    │
│                                      │
│ [Si Collection sélectionné]          │
│ Variantes:                           │
│ 1. [Tome 5      ] [×]               │
│ 2. [Tome 6      ] [×]               │
│ 3. [Tome 7      ] [×]               │
│ [+ Ajouter une variante]            │
│                                      │
│ [Annuler] [Enregistrer]             │
└─────────────────────────────────────┘
```

**3.1.1 Choix du type**

**À la création d'un nouveau cadeau :**

- L'utilisateur voit le formulaire avec les 3 options de type
- **Par défaut** : "Simple" est pré-sélectionné
- Si l'utilisateur sélectionne "Collection", la section "Variantes" apparaît dynamiquement
- Si l'utilisateur sélectionne "Illimité", pas de variantes
- L'utilisateur peut créer son cadeau directement avec le type souhaité

**À l'édition d'un cadeau existant :**

- Le formulaire affiche le type actuel du cadeau
- L'utilisateur peut changer le type via "Modifier"
    - De Simple → Collection : la section variantes apparaît (vide), il peut ajouter des variantes
    - De Collection → Simple : avertissement de perte de variantes + confirmation requise
    - De Simple → Illimité : conversion directe
- **Pas de conversion automatique** : C'est à chaque utilisateur de choisir le type qui lui convient

**Comportement UI dynamique :**

```typescript
// Dans le formulaire
const [giftType, setGiftType] = useState<'simple' | 'collection' | 'unlimited'>('simple');
const [variants, setVariants] = useState<string[]>([]);

// Affichage conditionnel
{giftType === 'collection' && (
  <div className="variants-section">
    <h3>Variantes</h3>
    {variants.map((v, i) => (
      <input key={i} value={v} onChange={...} />
    ))}
    <button onClick={addVariant}>+ Ajouter une variante</button>
  </div>
)}
```

**3.1.2 Logique du formulaire**

```typescript
// Lors de l'enregistrement du formulaire
if (formData.type === 'collection' && formData.variants.length > 0) {
    // Passer en mode collection
    await updateGift({
        ...gift,
        isCollection: true,
        variants: formData.variants
    });
}

// Si l'utilisateur repasse de Collection à Simple
if (formData.type === 'simple' && gift.variants.length > 0) {
    // Avertissement : "Attention, les variantes seront supprimées"
    // Nécessite confirmation
}
```

**3.1.3 Validation**

- ✅ Un cadeau "Collection" doit avoir **au moins 1 variante**
- ✅ Si on passe de "Simple" à "Collection", forcer l'ajout d'au moins 1 variante
- ❌ Empêcher de sauvegarder un cadeau Collection sans variante
- ⚠️ Avertir si on repasse de Collection à Simple (perte des variantes)

**3.2 Affichage dans la liste**

```
┌─────────────────────────────────────┐
│ 🎁 Naruto                           │
│ Manga shonen                         │
│                                      │
│ Tomes disponibles:                   │
│ ✓ Tome 5 (réservé par Marie)       │
│ ○ Tome 6 [Réserver]                │
│ ○ Tome 7 [Réserver]                │
│                                      │
│ Progression: 1/3 tomes réservés     │
└─────────────────────────────────────┘
```

**3.3 Vue "Cadeaux réservés"**

```
Tu as réservé:
- Naruto - Tome 5 (pour Jean)
- Chaussettes - Paire rouge (pour Sophie)
```

**3.4 Composants à créer**

- `components/gift/GiftItem.tsx` : composant principal unifié (affichage + édition)
- `components/gift/VariantEditList.tsx` : sous-composant pour éditer les variantes
- `components/gift/VariantDisplayList.tsx` : sous-composant pour afficher les variantes avec statut de réservation

### Phase 4 : Rétrocompatibilité et comportement par défaut

**4.1 Cadeaux existants - Aucune action requise**

- ✅ **Aucune migration de données nécessaire**
- ✅ **Aucune conversion automatique**
- Tous les cadeaux existants restent en mode "Simple" :
    - `isCollection = false`
    - `isUnlimited = false`
    - `variants = []` (tableau vide)
- Les utilisateurs qui veulent des variantes devront **manuellement** éditer leurs cadeaux et changer le type

**4.2 Garanties de non-régression**

Le composant `GiftItem.tsx` gère nativement les cadeaux avec et sans variantes dans le même container :

- Utilise `hasVariants` pour afficher conditionnellement la section variantes
- Les cadeaux simples (sans variantes) affichent uniquement nom, description, lien et bouton réserver
- Pas de code séparé = comportement identique garanti

**Vérifications obligatoires :**

- ✅ Les cadeaux sans variantes fonctionnent exactement comme avant
- ✅ La réservation classique reste inchangée (`Gift.takenById`)
- ✅ L'affichage reste identique pour les cadeaux simples
- ✅ Les utilisateurs ne voient pas de changement tant qu'ils ne créent pas de variantes
- ✅ **Pas de conversion automatique** : chaque utilisateur doit éditer manuellement ses cadeaux s'il veut utiliser les variantes

**4.3 Changement de type par l'utilisateur**

Pour passer un cadeau existant en mode Collection :

1. L'utilisateur clique sur "Modifier" sur son cadeau
2. Dans le formulaire, il change le type de "Simple" à "Collection"
3. Il ajoute les variantes souhaitées
4. Il sauvegarde

C'est un choix **volontaire et manuel** de chaque utilisateur.

### Phase 5 : Tests et validation

**5.1 Tests unitaires**

- [ ] Création de cadeau avec variantes
- [ ] Réservation de variante
- [ ] Annulation de réservation
- [ ] Suppression de variante
- [ ] Cas limite : suppression de cadeau avec variantes réservées
- [ ] **Cadeaux sans variantes (comportement classique)**
- [ ] **Migration d'un cadeau simple vers collection**

**5.2 Tests d'intégration**

- [ ] Workflow complet : création → réservation → annulation
- [ ] **Cadeaux existants continuent de fonctionner**
- [ ] Performance avec beaucoup de variantes (100+)
- [ ] **Mix de cadeaux avec et sans variantes dans une même liste**

**5.3 Tests utilisateur**

- [ ] Créer un manga avec 10 tomes
- [ ] Réserver quelques tomes
- [ ] Vérifier l'affichage pour le propriétaire
- [ ] Vérifier l'affichage pour les autres membres

---

## 📊 Cas d'usage détaillés

### Cas 1 : Collection de mangas

```
Utilisateur: Jean
Cadeau: One Piece
Type: Collection
Variantes:
  - Tome 50 (disponible)
  - Tome 51 (réservé par Marie)
  - Tome 52 (disponible)
  - Tome 53 (réservé par Sophie)

Affichage pour Jean:
"One Piece - 2/4 tomes réservés"

Affichage pour Marie:
"One Piece
 ○ Tome 50 [Réserver]
 ✓ Tome 51 (par toi)
 ○ Tome 52 [Réserver]
 ✓ Tome 53 (par Sophie)"
```

### Cas 2 : Plusieurs exemplaires identiques

```
Utilisateur: Sophie
Cadeau: Paires de chaussettes rigolotes
Type: Collection
Variantes:
  - Paire 1 (disponible)
  - Paire 2 (disponible)
  - Paire 3 (disponible)

Affichage simplifié:
"Paires de chaussettes - 0/3 réservées [Réserver une paire]"
```

### Cas 3 : Cadeau illimité

```
Utilisateur: Marie
Cadeau: Chocolat noir 70%
Type: Illimité

Affichage:
"Chocolat noir 70%
Déjà offert par: Jean, Sophie, Antoine
[Je veux aussi offrir ça]"
```

---

## 🚀 Évolutions futures possibles

### V2 : Aide à la conversion (optionnel)

- Détection de mots-clés dans la description ("tome", "volume", "paire", "exemplaire")
- Message informatif suggérant l'utilisation de variantes (sans conversion auto)
- Exemple : "💡 Ce cadeau contient 'tome 5' - voulez-vous le convertir en collection ?"

### V3 : Suggestions intelligentes

- Détection automatique de collections dans le nom/description
- "Naruto" → proposer automatiquement de créer des variantes par tome
- API externe pour récupérer les tomes manquants (Google Books, MyAnimeList)

### V4 : Import en masse

- Importer une liste de tomes depuis un fichier CSV
- Coller une liste de tomes et les créer automatiquement

### V5 : Priorités par variante

- Certains tomes plus importants que d'autres
- Affichage visuel de la priorité

---

## ⚠️ Points d'attention

### Rétrocompatibilité ⚠️ CRITIQUE

**Comportement par défaut :**

- ✅ Tous les cadeaux existants : `isCollection = false`, `isUnlimited = false`, `variants = []`
- ✅ **Aucune migration de données requise**
- ✅ Les cadeaux sans variantes affichent l'interface classique (inchangée)
- ✅ La logique de réservation classique reste active pour les cadeaux sans variantes
- ✅ Zéro impact sur l'existant tant que l'utilisateur ne crée pas de variantes

**Tests de non-régression obligatoires :**

- Vérifier qu'un cadeau sans variantes se comporte exactement comme avant
- Tester la réservation classique (Gift.takenById)
- Valider l'affichage identique pour les anciennes données

### Performance

- Avec 50 cadeaux × 10 variantes = 500 entrées
- Optimiser les requêtes avec `include` Prisma
- Pagination si nécessaire

### UX

- Ne pas complexifier l'interface pour les cas simples
- Garder le mode "simple" par défaut
- Mode avancé optionnel pour collections

### Règles métier

- **Suppression de variantes** : Il faut toujours au moins 1 variante. La dernière variante ne peut pas être supprimée (pas de
  bouton supprimer). Pour supprimer un cadeau avec variantes, il faut supprimer le cadeau entier.
- **Réservation multiple** : Un utilisateur ne peut réserver qu'une seule variante par cadeau. Empêcher la réservation si
  l'utilisateur a déjà réservé une variante du même cadeau.
- **Collection vs Illimité** : Un cadeau ne peut pas être à la fois collection ET illimité (exclusion mutuelle)

---

## 📝 Checklist avant démarrage

- [ ] **Phase 0 : Refactoring de giftList/[...id].tsx** (1 jour)
    - [ ] Créer le composant `GiftItem.tsx`
    - [ ] Extraire la logique d'affichage d'un cadeau
    - [ ] Migrer les interactions (édition, suppression, réservation)
    - [ ] Tester que tout fonctionne comme avant
    - [ ] Valider la PR de refactoring avant de continuer
- [ ] Valider l'approche avec l'équipe
- [ ] Estimer la charge totale (environ 4-6 jours avec refactoring)
- [ ] Préparer des maquettes UI pour validation
- [ ] Décider du scope MVP (peut-être commencer sans "illimité")
- [ ] **Confirmer que les cadeaux existants ne nécessitent AUCUNE migration**
- [ ] **Prévoir tests de non-régression approfondis**

---

## 🎯 MVP Recommandé

**Roadmap en 2 étapes :**

### Étape 0 : Refactoring (1 jour) - **OBLIGATOIRE**

- ✅ Extraction du composant `GiftItem.tsx`
- ✅ Nettoyage de la page giftList
- ✅ Tests de non-régression

### Étape 1 : Feature Variantes (3-4 jours)

1. ✅ Collections uniquement (pas d'illimité dans un premier temps)
2. ✅ Interface simple : ajouter des variantes en mode texte
3. ✅ Affichage basique de la progression
4. ❌ Reporter les suggestions automatiques
5. ❌ Reporter l'import en masse

**Estimation totale : 4-5 jours de développement**

---

## 📚 Ressources

- Documentation Prisma : https://www.prisma.io/docs/concepts/components/prisma-schema/relations
- Exemple similaire : systèmes de e-commerce avec variantes de produits
- Pattern "Composite" pour gérer les collections

---

**Date de création :** 27 novembre 2025 **Statut :** Proposition - En attente de validation **Priorité :** Moyenne **Complexité
:** Élevée (nécessite migration DB + refonte UI)
