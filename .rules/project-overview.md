# Ma Liste de Cadeaux - Vue d'ensemble du projet

## Description

Application web permettant de créer et gérer des listes de cadeaux partagées entre groupes (famille, amis). Les utilisateurs
peuvent créer des groupes, ajouter leurs souhaits de cadeaux, et réserver secrètement les cadeaux des autres membres.

## Stack Technique

### Frontend

- **Framework**: Next.js 15.5.4 (React, TypeScript)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components avec Tailwind
- **Drag & Drop**: @dnd-kit
- **Modales**: SweetAlert2
- **Icons**: Custom SVG components

### Backend

- **Runtime**: Node.js 22.20.0
- **API**: Next.js API Routes (REST)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Email**: MailerSend

### Build & Deploy

- **Build**: Next.js
- **Package Manager**: npm
- **Deployment**: Vercel

## Architecture

### Structure des dossiers

```
/pages          - Pages et API routes Next.js
  /api          - API REST endpoints
  /contact      - Page de contact
  /help         - Page d'aide/FAQ
  /giftList     - Listes de cadeaux
  /group        - Gestion des groupes
  /takenGiftList - Cadeaux réservés/personnels
  /changelog    - Historique des versions
/components     - Composants React réutilisables
  /atoms        - Composants de base
  /icons        - Icônes SVG
/lib            - Bibliothèques et utilitaires
  /auth         - Gestion authentification
  /db           - Managers de base de données
  /hooks        - Custom React hooks
  /schema       - Générateurs de structured data
  /wrappers     - Wrappers API
/prisma         - Schéma et migrations Prisma
/public         - Assets statiques
/styles         - CSS global
/migration      - Scripts de migration DB
```

## Modèle de données

### Group

- id (UUID)
- name (String)
- description (String?)
- imageUrl (String?)
- adminPassword (String)
- users (User[])

### User

- id (UUID)
- name (String)
- isAdmin (Boolean)
- acceptSuggestedGift (Boolean)
- groupId (String?)
- gifts (Gift[])
- takenGifts (Gift[])

### Gift

- id (UUID)
- name (String)
- description (String?)
- url (String?)
- isSuggestedGift (Boolean?)
- order (Int?)
- userId (String?) - Propriétaire du cadeau
- takenUserId (String?) - Utilisateur qui réserve le cadeau
- Cas spécial: userId=null & takenUserId=set → Cadeau personnel

## Fonctionnalités principales

### Authentification

- Connexion par nom de groupe + nom d'utilisateur
- Pas de système d'email/mot de passe utilisateur
- Mot de passe admin pour gérer le groupe
- Session cookie-based (httpOnly)

### Gestion des groupes

- Création de groupe avec nom unique
- Invitation par partage du nom du groupe
- Liste des membres
- Mode administrateur

### Listes de cadeaux

- Création/édition/suppression de cadeaux
- Drag & drop pour réorganiser (ordre personnalisé)
- Médailles pour top 3 cadeaux
- Ajout de description et URL
- Sélection multiple et suppression groupée

### Réservation de cadeaux

- Voir les listes des autres membres
- Réserver/libérer des cadeaux
- Liste personnelle des cadeaux réservés
- Cadeaux personnels (non liés à un utilisateur)

### SEO

- Meta tags optimisés
- Structured data (JSON-LD)
- Sitemap.xml
- Robots.txt
- Open Graph tags

## Version actuelle

3.7.0 (26 novembre 2025)
