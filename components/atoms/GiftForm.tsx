interface GiftFormProps {
    formName: string;
    setFormName: (v: string) => void;
    formDescription: string;
    setFormDescription: (v: string) => void;
    formLink: string;
    setFormLink: (v: string) => void;
    formType: 'SIMPLE' | 'MULTIPLE';
    setFormType: (v: 'SIMPLE' | 'MULTIPLE') => void;
    autoFocusName?: boolean;
}

export default function GiftForm({
    formName, setFormName,
    formDescription, setFormDescription,
    formLink, setFormLink,
    formType, setFormType,
    autoFocusName = false
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
                <textarea
                    className="input-field"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                />
            </div>
            <div className="grid">
                <label className="input-label">Lien:</label>
                <textarea
                    className="input-field"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <input
                    id="giftFormTypeCheckbox"
                    type="checkbox"
                    className="cursor-pointer w-4 h-4 accent-vertNoel shrink-0"
                    checked={formType === 'MULTIPLE'}
                    onChange={(e) => setFormType(e.target.checked ? 'MULTIPLE' : 'SIMPLE')}
                />
                <label htmlFor="giftFormTypeCheckbox" className="cursor-pointer text-sm">
                    Cadeau avec sous-éléments (ex: manga avec ses tomes)
                </label>
            </div>
        </div>
    );
}
