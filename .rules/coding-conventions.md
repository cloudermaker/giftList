# Conventions de code - Ma Liste de Cadeaux

## TypeScript

### Général

- **Extensions**: `.ts` pour les fichiers purs, `.tsx` pour les composants React
- **Strict mode**: Activé
- **Type inference**: Privilégier l'inférence quand possible
- **Any**: Éviter, utiliser `unknown` si nécessaire

### Naming

- **Components**: PascalCase (ex: `CustomButton`, `GiftList`)
- **Files**: PascalCase pour composants, camelCase pour utilitaires
- **Variables/Functions**: camelCase (ex: `getUserById`, `localGifts`)
- **Constants**: UPPER_SNAKE_CASE pour les constantes globales
- **Types/Interfaces**: PascalCase avec préfixe `T` pour types (ex: `TGiftApiResult`)
- **Enums**: PascalCase avec préfixe `E` (ex: `EHeader`)

### Imports

```typescript
// Order: React, Next, External libs, Internal libs, Components, Types
import { useState } from 'react';
import Router from 'next/router';
import Swal from 'sweetalert2';
import { getUserById } from '@/lib/db/userManager';
import CustomButton from '@/components/atoms/customButton';
import { Gift, User } from '@prisma/client';
```

## React/Next.js

### Components

- **Functional components** uniquement
- **Hooks** pour la gestion d'état
- **Props destructuring** dans les paramètres
- **Default exports** pour les pages, named exports pour composants réutilisables

```typescript
// ✅ Bon
export default function GiftPage({ user, gifts }: Props): JSX.Element {
    const [localGifts, setLocalGifts] = useState(gifts);
    // ...
}

// ❌ Éviter
export default function GiftPage(props) {
    // ...
}
```

### State Management

**PRINCIPE CLÉS: Minimiser l'utilisation des states**

#### Éviter les states inutiles

- Préférer les props pour les données venant du serveur
- Utiliser des variables dérivées plutôt que des states
- Éviter de dupliquer les données déjà disponibles

```typescript
// ✅ Bon - Variable dérivée
function UserList({ users }: Props) {
    const activeUsers = users.filter(u => u.isActive); // Pas de state
    const userCount = users.length; // Calculé, pas stocké

    return <div>{userCount} utilisateurs</div>;
}

// ❌ Éviter - State inutile
function UserList({ users }: Props) {
    const [activeUsers, setActiveUsers] = useState(users.filter(u => u.isActive));
    const [userCount, setUserCount] = useState(users.length);
    // ...
}
```

#### Quand utiliser un state

- Données modifiées par l'utilisateur (formulaires, toggles)
- Données temporaires UI (modals, menus déroulants)
- Optimistic updates avant appel API

```typescript
// ✅ Bon - State justifié pour modification utilisateur
const [isEditing, setIsEditing] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

#### Regrouper les states liés

- Consolider les states qui changent ensemble
- Utiliser des objets pour les formulaires
- Réduire le nombre de re-renders

```typescript
// ✅ Bon - States groupés
const [formData, setFormData] = useState({
    name: '',
    description: '',
    link: '',
    error: ''
});

setFormData((prev) => ({ ...prev, name: value }));

// ❌ Éviter - States éparpillés
const [name, setName] = useState('');
const [description, setDescription] = useState('');
const [link, setLink] = useState('');
const [error, setError] = useState('');
```

#### Setters fonctionnels

- Toujours utiliser pour updates basées sur valeur précédente
- Évite les bugs de concurrence

```typescript
// ✅ Bon
setCount((prev) => prev + 1);
setItems((prev) => [...prev, newItem]);

// ❌ Éviter
setCount(count + 1); // Peut être obsolète
```

### API Routes

- Structure REST classique
- Validation des permissions
- Types explicites pour Request/Response

```typescript
export type TApiResult = {
    success: boolean;
    data?: T;
    error?: string;
};
```

## Styling (Tailwind)

### Classes

- Utiliser les utilitaires Tailwind
- Thème personnalisé pour couleurs: `vertNoel`, `rougeNoel`
- Responsive mobile-first

```tsx
// ✅ Bon
<div className="flex flex-col md:flex-row gap-4 p-4">

// ❌ Éviter le CSS inline sauf cas particulier
<div style={{ display: 'flex', padding: '16px' }}>
```

### Custom CSS

- Limité aux classes globales dans `globals.css`
- Préfixer les classes custom: `green-button`, `input-field`

## Base de données (Prisma)

### Queries

- Utiliser les managers dans `/lib/db/*Manager.ts`
- Éviter les queries directes dans les pages/components
- Include relations explicitement

```typescript
// ✅ Bon
const gifts = await getGiftsFromUserId(userId);

// ❌ Éviter dans les composants
const gifts = await prisma.gift.findMany({ where: { userId } });
```

### Transactions

- Utiliser les transactions pour opérations multiples
- Gérer les erreurs explicitement

## Git

### Commits

- Format: `type: description`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`
- Exemples:
    - `feat: add personal gifts feature`
    - `fix: correct gift mapping for null users`
    - `chore: update dependencies`

### Branches

- `main`: Production
- `develop`: Développement
- `feat/*`: Nouvelles fonctionnalités
- `fix/*`: Corrections de bugs
- `chore/*`: Maintenance

### Versioning

- Semantic Versioning (MAJOR.MINOR.PATCH)
- Tags Git pour chaque version
- **Mise à jour OBLIGATOIRE du CHANGELOG.md**

### CHANGELOG - RÈGLE CRITIQUE

**⚠️ TOUJOURS mettre à jour `CHANGELOG.md` avant de pousser du code**

#### Pourquoi?

- La page `/changelog` lit ce fichier pour afficher l'historique
- Les utilisateurs voient les nouveautés et corrections
- Traçabilité complète des changements

#### Format (Keep a Changelog)

```markdown
## [Unreleased]

### Added

- Nouvelle fonctionnalité X
- Composant Y ajouté

### Changed

- Modification du comportement Z

### Fixed

- Correction du bug A
- Fix affichage mobile

### Security

- Patch de sécurité B
```

#### Process

1. **Avant chaque commit**: Ajouter vos changements sous `[Unreleased]`
2. **Lors d'une release**:
    - Renommer `[Unreleased]` en `[X.Y.Z] - YYYY-MM-DD`
    - Créer une nouvelle section `[Unreleased]` vide
    - Créer le tag git: `git tag vX.Y.Z`
    - Pousser: `git push origin vX.Y.Z`

#### Catégories

- **Added**: Nouvelles fonctionnalités
- **Changed**: Modifications de fonctionnalités existantes
- **Deprecated**: Fonctionnalités dépréciées (futures suppressions)
- **Removed**: Fonctionnalités supprimées
- **Fixed**: Corrections de bugs
- **Security**: Correctifs de sécurité

#### Exemple complet

```markdown
# Changelog

## [Unreleased]

## [3.8.0] - 2025-11-27

### Added

- Recherche de cadeaux par mot-clé
- Filtre par catégorie sur la page d'accueil

### Fixed

- Affichage des emojis sur iOS
- Ordre des cadeaux après drag & drop

## [3.7.0] - 2025-11-26

...
```

## Sécurité

### Authentification

- Cookies httpOnly uniquement
- Validation côté serveur
- Pas d'informations sensibles en localStorage

### API

- Vérification des permissions sur chaque endpoint
- Validation des entrées utilisateur
- Sanitization des données

### Données sensibles

- Mots de passe hashés (admin)
- Variables d'environnement pour secrets
- Pas de données sensibles dans le code

## Performance

### Images

- Next.js Image component
- Lazy loading par défaut
- Optimisation automatique

### Code splitting

- Dynamic imports pour composants lourds
- getStaticProps/getServerSideProps selon besoin

### Caching

- Static generation quand possible
- ISR pour pages dynamiques peu fréquentes

## Tests (À implémenter)

### Structure recommandée

- Unit tests pour utilitaires
- Integration tests pour API routes
- E2E tests pour flows critiques

## Accessibilité

### Standards

- Utiliser les balises sémantiques HTML
- Labels pour tous les inputs
- Aria attributes quand nécessaire
- Navigation clavier fonctionnelle

## Documentation

### Code

- JSDoc pour fonctions publiques complexes
- Commentaires pour logique non-évidente
- Types TypeScript comme documentation

### Projet

- README.md à jour
- CHANGELOG.md pour chaque version
- Documentation API dans `/docs` (à créer)
