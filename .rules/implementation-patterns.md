# Patterns d'implémentation - Ma Liste de Cadeaux

## Pattern: Page avec données serveur

### Utilisation

Pages nécessitant des données de la BDD au chargement.

### Implémentation

```typescript
import { NextPageContext } from 'next';
import { Layout } from '@/components/layout';
import { EHeader } from '@/components/customHeader';
import { getDataFromDb } from '@/lib/db/manager';
import { DataType } from '@prisma/client';

interface Props {
    data: DataType[];
}

export default function MyPage({ data }: Props): JSX.Element {
    const [localData, setLocalData] = useState<DataType[]>(data);

    return (
        <Layout selectedHeader={EHeader.MyPage}>
            {/* Content */}
        </Layout>
    );
}

export async function getServerSideProps(context: NextPageContext) {
    const { query } = context;
    const id = query.id?.toString() ?? '';

    const data = await getDataFromDb(id);

    return {
        props: {
            data: data.map(item => ({
                ...item,
                createdAt: item.createdAt?.toISOString() ?? '',
                updatedAt: item.updatedAt?.toISOString() ?? ''
            }))
        }
    };
}
```

### Points clés

- Sérialiser les dates en ISO string
- Gérer les valeurs nullables
- État local pour mutations optimistes

## Pattern: API Route avec autorisation

### Utilisation

Endpoints nécessitant vérification des permissions.

### Implémentation

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { COOKIE_NAME } from '@/lib/auth/authService';
import { TGroupAndUser } from '../authenticate';

export type TApiResult = {
    success: boolean;
    data?: any;
    error?: string;
};

const isAuthorized = async (req: NextApiRequest) => {
    if (req.method === 'GET') return true;

    const connectedUser = JSON.parse(atob(req.cookies[COOKIE_NAME] as string)) as TGroupAndUser;

    const resourceId = req.body?.resourceId ?? req.query?.resourceId;
    return connectedUser?.isAdmin || connectedUser?.userId === resourceId;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TApiResult>) {
    try {
        const isAuthorizedRequest = await isAuthorized(req);

        if (!isAuthorizedRequest) {
            res.status(403).json({ success: false });
            return;
        }

        if (req.method === 'POST') {
            // Handle POST
            res.status(200).json({ success: true, data });
        } else if (req.method === 'DELETE') {
            // Handle DELETE
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: e as string });
    }
}
```

### Points clés

- Vérifier méthode HTTP
- Valider autorisation avant traitement
- Gérer erreurs avec try/catch
- Retourner codes HTTP appropriés

## Pattern: CRUD avec SweetAlert2

### Utilisation

Opérations de modification avec confirmation utilisateur.

### Implémentation

```typescript
const deleteItem = async (itemId: string): Promise<void> => {
    const swalWithBootstrapButtons = Swal.mixin({
        buttonsStyling: true
    });

    const result = await swalWithBootstrapButtons.fire({
        title: 'Es-tu certain de vouloir supprimer?',
        text: 'Il ne sera pas possible de revenir en arrière!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui!',
        cancelButtonText: 'Non!',
        reverseButtons: true
    });

    if (result.isConfirmed) {
        const apiResult = await AxiosWrapper.delete(`/api/resource/${itemId}`);
        const data = apiResult?.data as TApiResult;

        if (data?.success === true) {
            setLocalItems((items) => items.filter((item) => item.id !== itemId));

            swalWithBootstrapButtons.fire({
                title: 'Supprimé!',
                text: "L'élément a été supprimé.",
                icon: 'success'
            });
        } else {
            swalWithBootstrapButtons.fire({
                title: 'Erreur!',
                text: "L'élément n'a pas pu être supprimé.",
                icon: 'error'
            });
        }
    }
};
```

### Points clés

- Confirmation avant action destructive
- Mise à jour optimiste du state
- Feedback visuel du résultat
- Gestion des erreurs

## Pattern: Formulaire contrôlé avec validation

### Utilisation

Formulaires avec gestion d'état et validation.

### Implémentation

```typescript
const [formData, setFormData] = useState({
    name: '',
    description: '',
    error: ''
});

const validateForm = (): boolean => {
    if (!formData.name) {
        setFormData((prev) => ({ ...prev, error: 'Le nom est requis' }));
        return false;
    }
    return true;
};

const handleSubmit = async (): Promise<void> => {
    setFormData((prev) => ({ ...prev, error: '' }));

    if (!validateForm()) return;

    const result = await AxiosWrapper.post('/api/resource', {
        name: formData.name,
        description: formData.description
    });

    if (result?.data?.success) {
        clearForm();
        // Success handling
    } else {
        setFormData((prev) => ({
            ...prev,
            error: result?.data?.error ?? 'Erreur'
        }));
    }
};

const clearForm = (): void => {
    setFormData({ name: '', description: '', error: '' });
};
```

### Points clés

- State groupé pour formulaire
- Validation avant soumission
- Gestion erreurs serveur
- Reset après succès

## Pattern: Drag & Drop avec @dnd-kit

### Utilisation

Listes réorganisables par drag & drop.

### Implémentation

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Composant Sortable Item
function SortableItem({ item }: { item: Item }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {item.name}
        </div>
    );
}

// Composant Parent
const [items, setItems] = useState<Item[]>(initialItems);

const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
        setItems(prevItems => {
            const oldIndex = prevItems.findIndex(i => i.id === active.id);
            const newIndex = prevItems.findIndex(i => i.id === over.id);

            const newItems = arrayMove(prevItems, oldIndex, newIndex);

            // Update order in DB
            AxiosWrapper.post('/api/update-order', { items: newItems });

            return newItems;
        });
    }
};

return (
    <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
    >
        <SortableContext items={items}>
            {items.map(item => (
                <SortableItem key={item.id} item={item} />
            ))}
        </SortableContext>
    </DndContext>
);
```

### Points clés

- useSortable hook dans item component
- DndContext au niveau parent
- Mise à jour BDD après réorganisation
- Gestion tactile automatique

## Pattern: SEO avec structured data

### Utilisation

Pages nécessitant optimisation SEO.

### Implémentation

```typescript
import SEO from '@/components/SEO';
import { generatePageSchema } from '@/lib/schema/schemaGenerators';

export default function MyPage(): JSX.Element {
    const pageTitle = 'Ma Page - Ma Liste de Cadeaux';
    const pageDescription = 'Description optimisée pour SEO';

    const schema = generatePageSchema(
        pageTitle,
        pageDescription,
        'https://www.malistedecadeaux.fr/my-page'
    );

    return (
        <>
            <SEO
                title={pageTitle}
                description={pageDescription}
                canonicalPath="/my-page"
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
            {/* Page content */}
        </>
    );
}
```

### Points clés

- Titre unique et descriptif
- Description 150-160 caractères
- Canonical URL
- Structured data (JSON-LD)

## Pattern: Sélection multiple avec actions groupées

### Utilisation

Listes avec sélection et actions en masse.

### Implémentation

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [selectAll, setSelectAll] = useState<boolean>(false);

const toggleSelection = (id: string): void => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
        newSelection.delete(id);
    } else {
        newSelection.add(id);
    }
    setSelectedIds(newSelection);
    setSelectAll(newSelection.size === items.length);
};

const toggleSelectAll = (): void => {
    if (selectAll) {
        setSelectedIds(new Set());
        setSelectAll(false);
    } else {
        setSelectedIds(new Set(items.map((item) => item.id)));
        setSelectAll(true);
    }
};

const deleteSelected = async (): Promise<void> => {
    const deletePromises = Array.from(selectedIds).map((id) =>
        AxiosWrapper.delete(`/api/resource/${id}`)
            .then(() => ({ id, success: true }))
            .catch(() => ({ id, success: false }))
    );

    const results = await Promise.all(deletePromises);

    const successfulIds = results.filter((r) => r.success).map((r) => r.id);

    setItems((items) => items.filter((i) => !successfulIds.includes(i.id)));
    setSelectedIds(new Set());
    setSelectAll(false);
};
```

### Points clés

- Set pour O(1) lookups
- Gestion selectAll automatique
- Promise.all pour actions parallèles
- Gestion erreurs partielles
