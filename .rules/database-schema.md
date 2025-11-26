# Database Schema - Ma Liste de Cadeaux

## Overview

- **ORM**: Prisma
- **Database**: PostgreSQL
- **Migrations**: Prisma Migrate
- **Schéma**: `/prisma/schema.prisma`

## Models

### Group

Représente un groupe de personnes (famille, amis) partageant des listes de cadeaux.

```prisma
model Group {
  id            String  @id @default(uuid())
  name          String  // Unique par contrainte métier
  description   String?
  imageUrl      String?
  adminPassword String  @default("admin")

  users User[]

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
}
```

**Champs clés:**

- `name`: Identifiant unique du groupe (non enforced en DB)
- `adminPassword`: Mot de passe pour gérer le groupe
- `description`: Description optionnelle du groupe
- `imageUrl`: URL de l'image du groupe (non utilisé actuellement)

**Relations:**

- `users`: Un groupe a plusieurs utilisateurs

**Contraintes métier:**

- Le nom doit être unique (vérifié en code)
- Pas d'emojis autorisés dans le nom

---

### User

Représente un membre d'un groupe avec sa liste de cadeaux.

```prisma
model User {
  id                  String  @id @default(uuid())
  name                String
  isAdmin             Boolean @default(false)
  acceptSuggestedGift Boolean @default(false)

  group   Group?  @relation(fields: [groupId], references: [id])
  groupId String?

  gifts      Gift[] @relation(name: "user")
  takenGifts Gift[] @relation(name: "takenUser")

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
}
```

**Champs clés:**

- `name`: Prénom/nom de l'utilisateur
- `isAdmin`: Premier utilisateur créé est admin
- `acceptSuggestedGift`: Accepte les suggestions de cadeaux (non utilisé)
- `groupId`: Référence au groupe

**Relations:**

- `group`: Appartient à un groupe
- `gifts`: Cadeaux créés par cet utilisateur
- `takenGifts`: Cadeaux réservés par cet utilisateur

**Cas d'usage:**

- Un utilisateur par groupe (pas de compte global)
- Suppression d'utilisateur supprime ses cadeaux (cascade)

---

### Gift

Représente un cadeau souhaité ou un cadeau personnel.

```prisma
model Gift {
  id              String   @id @default(uuid())
  name            String
  description     String?
  url             String?
  isSuggestedGift Boolean? @default(false)
  order           Int?

  user   User?   @relation(fields: [userId], references: [id], name: "user")
  userId String?

  takenUser   User?   @relation(fields: [takenUserId], references: [id], name: "takenUser")
  takenUserId String?

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
}
```

**Champs clés:**

- `name`: Nom du cadeau (obligatoire)
- `description`: Description détaillée
- `url`: Lien vers le produit
- `order`: Position dans la liste (pour drag & drop)
- `isSuggestedGift`: Cadeau suggéré par un tiers (non utilisé)
- `userId`: Propriétaire du cadeau (null pour cadeaux personnels)
- `takenUserId`: Utilisateur qui réserve le cadeau

**Scénarios d'utilisation:**

1. **Cadeau normal d'un utilisateur:**

    - `userId`: Set (propriétaire)
    - `takenUserId`: null (pas réservé) ou Set (réservé)

2. **Cadeau personnel:**
    - `userId`: null (pas dans une liste utilisateur)
    - `takenUserId`: Set (créateur du cadeau personnel)

**Relations:**

- `user`: Propriétaire du cadeau (relation "user")
- `takenUser`: Utilisateur qui réserve (relation "takenUser")

---

## Queries communes

### Récupérer tous les utilisateurs d'un groupe

```typescript
const users = await prisma.user.findMany({
    where: { groupId: groupId },
    orderBy: { createdAt: 'asc' }
});
```

### Récupérer les cadeaux d'un utilisateur

```typescript
const gifts = await prisma.gift.findMany({
    where: { userId: userId },
    orderBy: { order: 'asc' }
});
```

### Récupérer les cadeaux réservés par un utilisateur

```typescript
const takenGifts = await prisma.gift.findMany({
    where: { takenUserId: userId },
    include: { user: true }, // Inclure le propriétaire
    orderBy: { order: 'asc' }
});
```

### Récupérer un groupe par nom

```typescript
const group = await prisma.group.findFirst({
    where: { name: groupName }
});
```

### Créer un cadeau avec ordre

```typescript
// Récupérer le dernier ordre
const latestGift = await prisma.gift.aggregate({
    _max: { order: true }
});

// Créer avec nouvel ordre
const gift = await prisma.gift.create({
    data: {
        name: giftName,
        userId: userId,
        order: (latestGift._max.order ?? 0) + 1
    }
});
```

### Réserver un cadeau

```typescript
const gift = await prisma.gift.update({
    where: { id: giftId },
    data: { takenUserId: userId }
});
```

### Libérer un cadeau

```typescript
const gift = await prisma.gift.update({
    where: { id: giftId },
    data: { takenUserId: null }
});
```

### Mettre à jour l'ordre des cadeaux

```typescript
// Utiliser transaction pour multiple updates
await prisma.$transaction(
    gifts.map((gift, index) =>
        prisma.gift.update({
            where: { id: gift.id },
            data: { order: index + 1 }
        })
    )
);
```

---

## Managers de base de données

### GroupManager (`/lib/db/groupManager.ts`)

- `getGroups()`: Tous les groupes
- `getGroupById(id)`: Groupe par ID
- `getGroupByName(name)`: Groupe par nom
- `createGroup(name, password, description, imageUrl)`: Nouveau groupe
- `upsertGroup(group)`: Créer ou mettre à jour
- `updateGroup(id, group)`: Mettre à jour
- `deleteGroup(id)`: Supprimer

### UserManager (`/lib/db/userManager.ts`)

- `getUsersFromGroupId(groupId)`: Utilisateurs d'un groupe
- `getUserById(id)`: Utilisateur par ID
- `getUserByGroupAndName(name, groupId)`: Par nom et groupe
- `createUser(name, groupId, isAdmin)`: Nouvel utilisateur
- `upsertUser(user)`: Créer ou mettre à jour
- `deleteUser(id)`: Supprimer

### GiftManager (`/lib/db/giftManager.ts`)

- `getGiftsFromUserId(userId)`: Cadeaux d'un utilisateur
- `getTakenGiftsFromUserId(userId)`: Cadeaux réservés
- `getGiftFromId(id)`: Cadeau par ID
- `upsertGift(gift)`: Créer ou mettre à jour (avec gestion ordre)
- `updateGifts(gifts)`: Mise à jour multiple (pour ordre)
- `deleteGift(id)`: Supprimer

---

## Migrations

### Initialisation

```bash
npm run initDb  # Exécute migration/init.js
```

### Ajouter une migration

```bash
npx prisma migrate dev --name description_migration
```

### Générer client Prisma

```bash
npx prisma generate
```

### Reset database

```bash
npx prisma migrate reset
```

---

## Variables d'environnement

### Requises

```env
POSTGRES_PRISMA_URL=postgresql://user:password@host:port/database
DATABASE_URL=postgresql://user:password@host:port/database
```

### Configuration

- Définies dans `.env.local` (dev)
- Variables Vercel (production)
- Pas de commit des fichiers .env

---

## Bonnes pratiques

### Sécurité

- Toujours valider les IDs avant requêtes
- Utiliser les managers, pas de queries directes dans pages
- Sanitizer les inputs utilisateur

### Performance

- Include relations uniquement si nécessaire
- Utiliser select pour limiter les champs
- Paginer les grandes listes (à implémenter)

### Transactions

- Utiliser `$transaction` pour opérations atomiques
- Exemple: Mise à jour multiple d'ordres

### Dates

- Toujours convertir en ISO string pour SSR
- Gérer les valeurs null explicitement

```typescript
props: {
    items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt?.toISOString() ?? '',
        updatedAt: item.updatedAt?.toISOString() ?? ''
    }));
}
```
