import { ReactNode } from 'react';
import { Gift, User } from '@prisma/client';
import CustomButton from '@/components/atoms/customButton';
import ModernLink from '@/components/atoms/ModernLink';
import { Medal } from '@/components/icons/medal';
import { Drag } from '@/components/icons/drag';

import { TGroupAndUser } from '@/pages/api/authenticate';
interface GiftItemProps {
    gift?: Gift;
    idx?: number;
    canReorder?: boolean;
    connectedUser?: TGroupAndUser;
    userCanAddGift: boolean;
    isEditing?: boolean;
    isCreating?: boolean;
    name: string;
    description: string;
    link: string;
    error?: string;
    onEdit?: (gift: Gift) => void;
    onRemove?: (giftId: string) => void;
    onUpsert: (giftId?: string) => void;
    onCancelEdit: () => void;
    onBlockUnBlockGift?: (gift: Gift) => void;
    setName: (v: string) => void;
    setDescription: (v: string) => void;
    setLink: (v: string) => void;
}

export const GiftItem = ({
    gift,
    connectedUser,
    userCanAddGift,
    isEditing = false,
    isCreating = false,
    name,
    description,
    link,
    error,
    onEdit,
    onRemove,
    onUpsert,
    onCancelEdit,
    onBlockUnBlockGift,
    setName,
    setDescription,
    setLink
}: GiftItemProps): JSX.Element => {
    const buildStyleIfTaken = (gift: Gift): string => {
        if (gift.userId !== connectedUser?.userId && gift.takenUserId != null) {
            return 'line-through';
        }
        return '';
    };

    return (
        <div className="block md:flex justify-between items-center w-full">
            {/* Affichage cadeau */}
            {!isEditing && !isCreating && gift && (
                <div className={`w-full block ${buildStyleIfTaken(gift)}`}>
                    <p className="py-1">
                        <b className="pr-2">Nom:</b>
                        <span>{gift.name}</span>
                    </p>
                    {gift.description && (
                        <p className="py-1">
                            <b className="pr-2">Description:</b>
                            <span>{gift.description}</span>
                        </p>
                    )}
                    {gift.url && (
                        <p className="py-1">
                            <ModernLink href={gift.url} />
                        </p>
                    )}
                </div>
            )}
            {/* Formulaire édition/création */}
            {(isEditing || isCreating) && (
                <div className={`w-full pr-4 block ${gift ? buildStyleIfTaken(gift) : ''}`}>
                    <div className="py-2 grid md:flex">
                        <label className="input-label">Nom:</label>
                        <textarea
                            id="newGiftInputId"
                            className="input-field"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="py-2 grid md:flex">
                        <label className="input-label">Description:</label>
                        <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="py-2 grid md:flex">
                        <label className="input-label">Lien:</label>
                        <textarea className="input-field" value={link} onChange={(e) => setLink(e.target.value)} />
                    </div>
                    {error && <p className="text-red-500 py-2">{error}</p>}
                </div>
            )}
            <div className="pt-4 md:pt-0 justify-end flex">
                {/* Edition */}
                {userCanAddGift && gift && !isEditing && !isCreating && (
                    <>
                        <CustomButton className="green-button" onClick={() => onEdit && onEdit(gift)}>
                            Modifier
                        </CustomButton>
                        <CustomButton onClick={() => onRemove && onRemove(gift.id)}>Supprimer</CustomButton>
                    </>
                )}
                {/* Validation édition */}
                {userCanAddGift && gift && isEditing && (
                    <>
                        <CustomButton
                            onClick={() => onUpsert(gift.id)}
                            disabled={name == null || name === ''}
                            className="green-button"
                        >
                            Valider
                        </CustomButton>
                        <CustomButton onClick={onCancelEdit}>Annuler</CustomButton>
                    </>
                )}
                {/* Création */}
                {userCanAddGift && isCreating && (
                    <>
                        <CustomButton onClick={() => onUpsert()} disabled={name == null || name === ''} className="green-button">
                            Ajouter
                        </CustomButton>
                        <CustomButton onClick={onCancelEdit}>Annuler</CustomButton>
                    </>
                )}
                {/* Réservation */}
                {!userCanAddGift && gift && gift.takenUserId === connectedUser?.userId && (
                    <CustomButton onClick={() => onBlockUnBlockGift && onBlockUnBlockGift(gift)}>
                        Je ne prends plus ce cadeau
                    </CustomButton>
                )}
                {!userCanAddGift && gift && gift.takenUserId && gift.takenUserId !== connectedUser?.userId && (
                    <span className="text-red-500">Ce cadeau est déjà pris</span>
                )}
                {!userCanAddGift && gift && !gift.takenUserId && gift.takenUserId !== connectedUser?.userId && (
                    <CustomButton className="green-button" onClick={() => onBlockUnBlockGift && onBlockUnBlockGift(gift)}>
                        Je prends ce cadeau
                    </CustomButton>
                )}
            </div>
        </div>
    );
};

export default GiftItem;
