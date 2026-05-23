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
            <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Type de cadeau :</p>
                <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="giftType" className="accent-vertNoel" checked={formType === 'SIMPLE'} onChange={() => setFormType('SIMPLE')} />
                        Cadeau simple
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="giftType" className="accent-indigo-500" checked={formType === 'MULTIPLE'} onChange={() => setFormType('MULTIPLE')} />
                        Avec sous-éléments <span className="text-gray-400">(ex : manga avec ses tomes)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="giftType" className="accent-orange-500" checked={formType === 'UNLIMITED'} onChange={() => setFormType('UNLIMITED')} />
                        Illimité <span className="text-gray-400">(plusieurs personnes peuvent le prendre)</span>
                    </label>
                </div>
            </div>

        </div>
    );
}
