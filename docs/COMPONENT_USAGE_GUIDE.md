# Guide d'Utilisation - Nouveaux Composants Multi-Groupes

## GroupSelector Component

### Description
Composant React qui permet à un utilisateur de switcher entre ses différents groupes. Affiche automatiquement un dropdown si l'utilisateur appartient à plusieurs groupes.

### Utilisation Basique

```tsx
import GroupSelector from '../components/GroupSelector';

function MyPage() {
  const [currentGroupId, setCurrentGroupId] = useState<string>();

  return (
    <div>
      <GroupSelector
        userId={user.id}
        currentGroupId={currentGroupId}
        onGroupChange={(groupId) => {
          setCurrentGroupId(groupId);
          // Logique supplémentaire (ex: recharger des données)
        }}
      />
    </div>
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | string | ✅ | ID de l'utilisateur |
| `currentGroupId` | string | ❌ | Groupe actuellement sélectionné |
| `onGroupChange` | (groupId: string) => void | ❌ | Callback appelé lors du changement |
| `className` | string | ❌ | Classes CSS additionnelles |

### Variantes

#### InlineGroupSelector
Version compacte pour affichage inline:

```tsx
import { InlineGroupSelector } from '../components/GroupSelector';

<InlineGroupSelector
  userId={user.id}
  currentGroupId={groupId}
  onGroupChange={setGroupId}
/>
```

---

## useActiveGroup Hook

### Description
Hook personnalisé pour gérer le groupe actuellement actif. Utilise des cookies pour la persistance.

### Utilisation

```tsx
import { useActiveGroup } from '../lib/hooks/useActiveGroup';

function MyComponent() {
  const { activeGroupId, setActiveGroup, clearActiveGroup } = useActiveGroup(userId);

  // Utiliser activeGroupId dans les requêtes API
  useEffect(() => {
    if (activeGroupId) {
      axios.get(`/api/gifts?groupId=${activeGroupId}`)
        .then(response => setGifts(response.data));
    }
  }, [activeGroupId]);

  // Changer de groupe
  const handleGroupChange = (newGroupId: string) => {
    setActiveGroup(newGroupId);
  };

  return (
    <div>
      {/* Votre UI */}
    </div>
  );
}
```

### API

#### `activeGroupId: string | null`
ID du groupe actuellement actif, ou `null` si aucun groupe sélectionné.

#### `setActiveGroup(groupId: string): void`
Définit le groupe actif et le sauvegarde dans un cookie (persiste 365 jours).

#### `clearActiveGroup(): void`
Supprime le groupe actif et le cookie associé.

### Fonctions Utilitaires

#### `getActiveGroupFromCookie(): string | null`
Récupère le groupe actif depuis le cookie (fonctionne côté client uniquement).

```tsx
import { getActiveGroupFromCookie } from '../lib/hooks/useActiveGroup';

const groupId = getActiveGroupFromCookie();
```

#### `saveActiveGroupToCookie(groupId: string): void`
Sauvegarde directement le groupe actif dans le cookie.

```tsx
import { saveActiveGroupToCookie } from '../lib/hooks/useActiveGroup';

saveActiveGroupToCookie('group-uuid');
```

---

## Exemples d'Intégration

### 1. Page d'Accueil avec Sélecteur

```tsx
import { useState, useEffect } from 'react';
import GroupSelector from '../components/GroupSelector';
import { useActiveGroup } from '../lib/hooks/useActiveGroup';

export default function HomePage({ user }) {
  const { activeGroupId, setActiveGroup } = useActiveGroup(user.id);
  const [groupData, setGroupData] = useState(null);

  useEffect(() => {
    if (activeGroupId) {
      // Charger les données du groupe
      axios.get(`/api/group/${activeGroupId}`)
        .then(res => setGroupData(res.data));
    }
  }, [activeGroupId]);

  return (
    <div>
      <header>
        <h1>Bienvenue {user.name}</h1>
        <GroupSelector
          userId={user.id}
          currentGroupId={activeGroupId}
          onGroupChange={setActiveGroup}
        />
      </header>

      {groupData && (
        <main>
          <h2>{groupData.name}</h2>
          {/* Reste du contenu */}
        </main>
      )}
    </div>
  );
}
```

### 2. Navigation avec Groupe Actif

```tsx
import { useActiveGroup } from '../lib/hooks/useActiveGroup';
import Link from 'next/link';

export default function Navigation({ user }) {
  const { activeGroupId } = useActiveGroup(user.id);

  return (
    <nav>
      <Link href={`/group/${activeGroupId}`}>
        Mon Groupe
      </Link>
      <Link href={`/giftList/${user.id}?groupId=${activeGroupId}`}>
        Ma Liste
      </Link>
    </nav>
  );
}
```

### 3. Migration d'une Page Existante

**Avant (groupId unique):**
```tsx
export default function GiftList({ user }) {
  const groupId = user.groupId;  // ❌ Ancien système
  
  return <div>Group: {groupId}</div>;
}
```

**Après (multi-groupes):**
```tsx
import GroupSelector from '../components/GroupSelector';
import { useActiveGroup } from '../lib/hooks/useActiveGroup';

export default function GiftList({ user }) {
  const { activeGroupId, setActiveGroup } = useActiveGroup(user.id);
  
  return (
    <div>
      <GroupSelector
        userId={user.id}
        currentGroupId={activeGroupId}
        onGroupChange={setActiveGroup}
      />
      <div>Group actif: {activeGroupId}</div>
    </div>
  );
}
```

---

## Notes Importantes

### ⚠️ Comportement Actuel
- Le changement de groupe provoque un `window.location.reload()` pour simplifier la mise à jour du contexte
- **TODO:** Améliorer avec un Context React global pour éviter les reloads

### 🔄 Migration Progressive
Pendant la transition, l'ancien système (`User.groupId`) continue de fonctionner:
- Les pages non migrées utilisent toujours `user.groupId`
- Les nouvelles pages utilisent `useActiveGroup()`
- Les deux systèmes coexistent sans conflit

### 🎯 Compatibilité SSR
- `useActiveGroup` fonctionne côté client
- Pour SSR, utilisez `getActiveGroupFromCookie()` dans `getServerSideProps`

```tsx
export async function getServerSideProps(context) {
  // Lire le cookie côté serveur
  const activeGroupId = context.req.cookies.activeGroupId;
  
  return {
    props: { activeGroupId }
  };
}
```

---

## Checklist d'Intégration

Pour migrer une page vers le système multi-groupes:

- [ ] Importer `GroupSelector` et `useActiveGroup`
- [ ] Remplacer `user.groupId` par `activeGroupId`
- [ ] Ajouter le composant `<GroupSelector />` dans l'UI
- [ ] Mettre à jour les appels API pour utiliser `activeGroupId`
- [ ] Tester avec un user dans plusieurs groupes
- [ ] Vérifier la persistance (fermer/rouvrir le navigateur)

---

## Support

Pour plus d'informations:
- Documentation API: `docs/API_CHANGES.md`
- Plan complet: `docs/MODERNIZATION_PLAN.md`
- Status: `migration/MODERNIZATION_STATUS.md`
