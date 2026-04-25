# Changements d'API - Modernisation Base de Données

## Résumé des Changements

| Endpoint | Méthode | Avant | Après | Breaking? |
|----------|---------|-------|-------|-----------|
| `/api/user` | GET | Paramètre `groupid` | Inchangé (utilise UserGroupMapping) | NON |
| `/api/user` | POST | Body avec `groupId` | Body sans `groupId`, appel séparé `/api/userGroup` | OUI |
| `/api/gift` | POST/PUT | `takenUserId` dans body | Utiliser `/api/gift/{id}/take` | OUI |
| `/api/authenticate` | POST | Retourne `groupId` | Retourne `groupIds[]` + `activeGroupId` | OUI |

## Nouveaux Endpoints

### UserGroup Management

#### `POST /api/userGroup`
Ajouter un user à un groupe.

**Request:**
```json
{
  "userId": "uuid",
  "groupId": "uuid",
  "role": "MEMBER" | "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "membership": {
    "id": "uuid",
    "userId": "uuid",
    "groupId": "uuid",
    "role": "MEMBER",
    "joinedAt": "2026-04-16T10:00:00Z"
  }
}
```

#### `DELETE /api/userGroup`
Retirer un user d'un groupe.

**Query params:** `userId`, `groupId`

**Response:**
```json
{
  "success": true
}
```

---

### Personal Gifts

#### `GET /api/personalGift?userId={uuid}&groupId={uuid}`
Récupérer les cadeaux personnels d'un user dans un groupe.

**Response:**
```json
{
  "gifts": [
    {
      "id": "uuid",
      "name": "Chocolats",
      "description": "Boîte de chocolats belges",
      "url": null,
      "userId": "uuid",
      "forUserId": "uuid",
      "groupId": "uuid",
      "createdAt": "2026-04-16T10:00:00Z"
    }
  ]
}
```

#### `POST /api/personalGift`
Créer un cadeau personnel.

**Request:**
```json
{
  "name": "Chocolats",
  "description": "Boîte de chocolats belges",
  "url": "",
  "forUserId": "uuid",
  "groupId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "gift": {
    "id": "uuid",
    "name": "Chocolats",
    "userId": "uuid",
    "groupId": "uuid"
  }
}
```

#### `PUT /api/personalGift/{id}`
Modifier un cadeau personnel.

**Request:** Mêmes champs que POST

#### `DELETE /api/personalGift/{id}`
Supprimer un cadeau personnel.

**Response:**
```json
{
  "success": true
}
```

---

### Sub-Gifts

#### `GET /api/gift/{parentId}/subgifts`
Récupérer les sous-cadeaux d'un cadeau parent.

**Response:**
```json
{
  "subGifts": [
    {
      "id": "uuid",
      "name": "Naruto Tome 1",
      "parentGiftId": "parent-uuid",
      "giftType": "SIMPLE",
      "order": 0,
      "takenBy": [
        {
          "userId": "uuid",
          "userName": "Bob",
          "takenAt": "2026-04-16T10:00:00Z"
        }
      ]
    }
  ]
}
```

#### `POST /api/gift/{parentId}/subgifts`
Créer un sous-cadeau.

**Request:**
```json
{
  "name": "Naruto Tome 2",
  "description": "Le tome où...",
  "url": "https://...",
  "order": 1
}
```

**Response:**
```json
{
  "success": true,
  "subGift": {
    "id": "uuid",
    "name": "Naruto Tome 2",
    "parentGiftId": "parent-uuid",
    "order": 1
  }
}
```

---

### Gift Reservation (Modifié)

#### `POST /api/gift/{id}/take`
Réserver un cadeau (remplace le PATCH avec takenUserId).

**Comportement:**
- Si `giftType=MULTIPLE`: prend automatiquement tous les sous-cadeaux
- Si cadeau est un sous-cadeau: prend uniquement ce sous-cadeau

**Response:**
```json
{
  "success": true,
  "taken": {
    "giftId": "uuid",
    "userId": "uuid",
    "takenAt": "2026-04-16T10:00:00Z",
    "subGiftsTaken": ["uuid1", "uuid2"]
  }
}
```

#### `DELETE /api/gift/{id}/release`
Libérer un cadeau réservé.

**Comportement:**
- Si `giftType=MULTIPLE`: libère tous les sous-cadeaux
- Si sous-cadeau: libère uniquement celui-ci

**Response:**
```json
{
  "success": true,
  "released": {
    "giftId": "uuid",
    "subGiftsReleased": ["uuid1", "uuid2"]
  }
}
```

---

## Endpoints Modifiés

### `POST /api/authenticate`

**Changements:**
- Retourne maintenant `groupIds[]` au lieu de `groupId`
- Retourne `activeGroupId` (premier groupe par défaut)

**Nouvelle Response:**
```json
{
  "userId": "uuid",
  "userName": "Alice",
  "groupIds": ["group1-uuid", "group2-uuid"],
  "activeGroupId": "group1-uuid",
  "isAdmin": false
}
```

**Impact:** Frontend doit gérer plusieurs groupes et permettre de switcher entre eux.

---

### `GET /api/gift/{id}`

**Changements:**
- Inclut maintenant `giftType`, `parentGiftId`, `subGifts[]`
- Remplace `takenUserId` par `takenBy[]` (array)

**Nouvelle Response:**
```json
{
  "gift": {
    "id": "uuid",
    "name": "Naruto Collection",
    "giftType": "MULTIPLE",
    "parentGiftId": null,
    "user": {
      "id": "uuid",
      "name": "Alice"
    },
    "takenBy": [
      {
        "userId": "uuid",
        "userName": "Bob",
        "takenAt": "2026-04-16T10:00:00Z"
      }
    ],
    "subGifts": [
      {
        "id": "sub-uuid-1",
        "name": "Tome 1",
        "order": 0,
        "takenBy": [
          {
            "userId": "uuid",
            "userName": "Bob",
            "takenAt": "2026-04-16T10:00:00Z"
          }
        ]
      }
    ]
  }
}
```

**Impact:** Frontend doit afficher les sous-cadeaux et gérer `takenBy` comme array.

---

### `POST /api/gift`

**Changements:**
- Champ `userId` devient obligatoire (non-nullable)
- Ajout optionnel de `giftType` et `parentGiftId`
- Suppression de `takenUserId`

**Nouveau Request:**
```json
{
  "gift": {
    "name": "Naruto Collection",
    "description": "Tous les tomes de Naruto",
    "giftType": "MULTIPLE",
    "userId": "uuid"
  }
}
```

**Impact:** Ne plus créer de gifts avec `userId=null`. Utiliser `/api/personalGift` à la place.

---

## Migration Client-Side

### Avant
```typescript
// Réserver un cadeau
await axios.patch(`/api/gift/${giftId}`, {
  gift: {
    ...gift,
    takenUserId: currentUser.userId
  }
});

// Libérer un cadeau
await axios.patch(`/api/gift/${giftId}`, {
  gift: {
    ...gift,
    takenUserId: null
  }
});

// Créer cadeau personnel
await axios.post('/api/gift', {
  gift: {
    name: 'Chocolats',
    userId: null,
    takenUserId: currentUser.userId
  }
});

// Vérifier si cadeau pris
const isTaken = gift.takenUserId != null;
const isTakenByMe = gift.takenUserId === currentUser.userId;
```

### Après
```typescript
// Réserver un cadeau
await axios.post(`/api/gift/${giftId}/take`);

// Libérer un cadeau
await axios.delete(`/api/gift/${giftId}/release`);

// Créer cadeau personnel
await axios.post('/api/personalGift', {
  name: 'Chocolats',
  groupId: currentGroupId
});

// Vérifier si cadeau pris
const isTaken = gift.takenBy && gift.takenBy.length > 0;
const isTakenByMe = gift.takenBy?.some(t => t.userId === currentUser.userId);
```

---

## Types TypeScript

### Avant
```typescript
interface Gift {
  id: string;
  name: string;
  description?: string;
  url?: string;
  userId?: string;
  takenUserId?: string;
  isSuggestedGift?: boolean;
  order?: number;
}

interface User {
  id: string;
  name: string;
  groupId?: string;
  isAdmin: boolean;
}
```

### Après
```typescript
enum GiftType {
  SIMPLE = 'SIMPLE',
  MULTIPLE = 'MULTIPLE'
}

interface Gift {
  id: string;
  name: string;
  description?: string;
  url?: string;
  userId: string;  // Non-nullable
  giftType: GiftType;
  parentGiftId?: string;
  isSuggestedGift?: boolean;
  order?: number;
  
  // Relations chargées optionnellement
  user?: User;
  takenBy?: UserTakenGift[];
  subGifts?: Gift[];
}

interface UserTakenGift {
  id: string;
  userId: string;
  giftId: string;
  takenAt: Date;
  
  // Relations
  user?: User;
  gift?: Gift;
}

interface PersonalGift {
  id: string;
  name: string;
  description?: string;
  url?: string;
  userId: string;
  forUserId?: string;
  groupId: string;
  
  // Relations
  user?: User;
  forUser?: User;
  group?: Group;
}

interface User {
  id: string;
  name: string;
  isAdmin: boolean;
  
  // Plus de groupId direct
  groupMemberships?: UserGroupMapping[];
}

interface UserGroupMapping {
  id: string;
  userId: string;
  groupId: string;
  role: 'MEMBER' | 'ADMIN';
  joinedAt: Date;
}
```

---

## Rétrocompatibilité

Pour minimiser l'impact pendant une phase transitoire:

### Option 1: Middleware de Compatibilité
```typescript
// Exemple middleware dans pages/api/gift/[...id].ts
if (req.method === 'PATCH' && req.body.gift?.takenUserId !== undefined) {
  console.warn('DEPRECATED: Use POST /api/gift/{id}/take instead');
  
  const isTaking = req.body.gift.takenUserId !== null;
  
  if (isTaking) {
    // Rediriger vers le nouveau endpoint
    return handleTakeGift(req, res);
  } else {
    return handleReleaseGift(req, res);
  }
}
```

### Option 2: Versioning
Considérer un versioning d'API:
- `/api/v1/...` — ancienne API (deprecated)
- `/api/v2/...` — nouvelle API

### Option 3: Feature Flag
```typescript
const USE_NEW_GIFT_API = process.env.NEXT_PUBLIC_FEATURE_NEW_GIFT_API === 'true';

if (USE_NEW_GIFT_API) {
  await axios.post(`/api/gift/${giftId}/take`);
} else {
  await axios.patch(`/api/gift/${giftId}`, { gift: { takenUserId: userId } });
}
```

---

## Checklist de Migration

### Backend
- [ ] Créer nouveaux database managers
- [ ] Créer nouveaux endpoints API
- [ ] Modifier endpoints existants
- [ ] Ajouter tests unitaires
- [ ] Mettre à jour validation Zod/Yup

### Frontend
- [ ] Mettre à jour types TypeScript
- [ ] Modifier appels API pour réservations
- [ ] Créer composant SubGiftList
- [ ] Créer composant GroupSelector
- [ ] Mettre à jour formulaires de création
- [ ] Gérer multi-groupes dans auth context
- [ ] Tester tous les parcours utilisateur

### Documentation
- [ ] Mettre à jour README
- [ ] Documenter nouveaux endpoints
- [ ] Créer guide migration pour contributeurs
- [ ] Mettre à jour diagramme architecture
