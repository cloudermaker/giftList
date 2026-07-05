import { useState } from 'react';
import { Modal } from './atoms/Modal';
import CustomButton from './atoms/customButton';

type TUser = { id: string; name: string };

interface PersonalGiftModalProps {
    groupUsers: TUser[];
    currentUserId?: string;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; link: string; forUserId: string }) => Promise<void>;
}

export const PersonalGiftModal = ({ groupUsers, currentUserId, onClose, onSubmit }: PersonalGiftModalProps): JSX.Element => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [forUserId, setForUserId] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) { setError('Il faut rentrer un nom.'); return; }
        setIsSubmitting(true);
        try {
            await onSubmit({ name, description, link, forUserId });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title="Ajouter un cadeau personnel"
            emoji="📝"
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-2">
                    <CustomButton onClick={onClose}>Annuler</CustomButton>
                    <CustomButton className="green-button" onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
                        {isSubmitting ? 'Ajout en cours...' : 'Valider'}
                    </CustomButton>
                </div>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-400 -mt-3">Visible uniquement par toi</p>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="input-group">
                    <label className="input-label">Nom du cadeau</label>
                    <textarea
                        id="newGiftInputId"
                        className="input-field"
                        value={name}
                        autoFocus
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        placeholder="Ex: Livre Harry Potter"
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Pour qui ?</label>
                    <select
                        className="input-field"
                        value={forUserId}
                        onChange={(e) => setForUserId(e.target.value)}
                    >
                        <option value="">Personne en particulier</option>
                        <option value={currentUserId}>Moi-même</option>
                        <option disabled>──────────</option>
                        {groupUsers.filter(u => u.id !== currentUserId).map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea
                        className="input-field"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label">Lien</label>
                    <textarea
                        className="input-field"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};
