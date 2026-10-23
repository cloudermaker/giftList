import { useState, type JSX } from 'react';
import { Modal } from './atoms/Modal';
import CustomButton from './atoms/customButton';

type TUser = { id: string; name: string };

export type TPersonalGiftForm = { name: string; description: string; link: string; forUserId: string };

interface PersonalGiftModalProps {
    groupUsers: TUser[];
    currentUserId?: string;
    // Pré-rempli = mode édition
    initial?: TPersonalGiftForm;
    onClose: () => void;
    onSubmit: (data: TPersonalGiftForm) => Promise<void>;
}

export const PersonalGiftModal = ({ groupUsers, currentUserId, initial, onClose, onSubmit }: PersonalGiftModalProps): JSX.Element => {
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [link, setLink] = useState(initial?.link ?? '');
    const [forUserId, setForUserId] = useState(initial?.forUserId ?? '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!initial;

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Il faut rentrer un nom.');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({ name, description, link, forUserId });
            onClose();
        } catch {
            setError('Une erreur est survenue. Réessayez dans quelques instants.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title={isEditing ? 'Modifier le cadeau personnel' : 'Ajouter un cadeau personnel'}
            emoji="📝"
            onClose={onClose}
            footer={
                <div className="flex justify-end gap-2">
                    <CustomButton onClick={onClose}>Annuler</CustomButton>
                    <CustomButton variant="green" onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
                        {isSubmitting ? 'Enregistrement...' : 'Valider'}
                    </CustomButton>
                </div>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-400 -mt-3">Visible uniquement par toi</p>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="input-group">
                    <label className="input-label" htmlFor="newGiftInputId">
                        Nom du cadeau
                    </label>
                    <textarea
                        id="newGiftInputId"
                        className="input-field"
                        value={name}
                        autoFocus
                        onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                        }}
                        placeholder="Ex: Livre Harry Potter"
                    />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="personalGiftForUser">
                        Pour qui ?
                    </label>
                    <select
                        id="personalGiftForUser"
                        className="input-field"
                        value={forUserId}
                        onChange={(e) => setForUserId(e.target.value)}
                    >
                        <option value="">Personne en particulier</option>
                        {currentUserId && <option value={currentUserId}>Moi-même</option>}
                        <option disabled>──────────</option>
                        {groupUsers
                            .filter((u) => u.id !== currentUserId)
                            .map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                    </select>
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="personalGiftDescription">
                        Description
                    </label>
                    <textarea
                        id="personalGiftDescription"
                        className="input-field"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label className="input-label" htmlFor="personalGiftLink">
                        Lien
                    </label>
                    <textarea id="personalGiftLink" className="input-field" value={link} onChange={(e) => setLink(e.target.value)} />
                </div>
            </div>
        </Modal>
    );
};
