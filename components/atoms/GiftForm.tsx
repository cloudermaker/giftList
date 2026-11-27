interface GiftFormProps {
    formName: string;
    setFormName: (v: string) => void;
    formDescription: string;
    setFormDescription: (v: string) => void;
    formLink: string;
    setFormLink: (v: string) => void;
    formType: 'SIMPLE' | 'MULTIPLE' | 'UNLIMITED';
    setFormType: (v: 'SIMPLE' | 'MULTIPLE' | 'UNLIMITED') => void;
    autoFocusName?: boolean;
    // Cadeau commun : la liste est vide => le choix du partenaire est masqué
    partners?: { id: string; name: string }[];
    formCoOwnerId?: string | null;
    setFormCoOwnerId?: (v: string | null) => void;
}

export default function GiftForm({
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formLink,
    setFormLink,
    formType,
    setFormType,
    autoFocusName = false,
    partners = [],
    formCoOwnerId = null,
    setFormCoOwnerId
}: GiftFormProps) {
    return (
        <div className="space-y-3">
            <div className="grid">
                <label className="input-label">Nom:</label>
                <textarea
                    id="giftFormNameInput"
                    className="input-field"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    autoFocus={autoFocusName}
                />
            </div>
            <div className="grid">
                <label className="input-label">Description:</label>
                <textarea className="input-field" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="grid">
                <label className="input-label">Lien:</label>
                <textarea className="input-field" value={formLink} onChange={(e) => setFormLink(e.target.value)} />
            </div>
            {partners.length > 0 && setFormCoOwnerId && (
                <div className="grid">
                    <label className="input-label" htmlFor="giftFormCoOwnerSelect">
                        Cadeau commun avec :
                    </label>
                    <select
                        id="giftFormCoOwnerSelect"
                        className="input-field capitalize"
                        value={formCoOwnerId ?? ''}
                        onChange={(e) => setFormCoOwnerId(e.target.value || null)}
                    >
                        <option value="">Personne</option>
                        {partners.map((p) => (
                            <option key={p.id} value={p.id} className="capitalize">
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            <div className="space-y-2">
                <p className="text-sm font-medium text-fg-soft">Type de cadeau :</p>
                <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                            type="radio"
                            name="giftType"
                            className="accent-vertNoel"
                            checked={formType === 'SIMPLE'}
                            onChange={() => setFormType('SIMPLE')}
                        />
                        Cadeau simple
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                            type="radio"
                            name="giftType"
                            className="accent-info"
                            checked={formType === 'MULTIPLE'}
                            onChange={() => setFormType('MULTIPLE')}
                        />
                        Avec sous-éléments <span className="text-fg-subtle">(ex : manga avec ses tomes)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                            type="radio"
                            name="giftType"
                            className="accent-accent"
                            checked={formType === 'UNLIMITED'}
                            onChange={() => setFormType('UNLIMITED')}
                        />
                        Illimité <span className="text-fg-subtle">(plusieurs personnes peuvent le prendre)</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
