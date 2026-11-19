/**
 * SubGiftList Component
 * Affiche un cadeau parent avec ses sous-cadeaux (enfants)
 * Exemple: Manga "Naruto" avec les tomes individuels
 */

import { GiftWithTakenUserId } from '@/lib/db/giftManager';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CustomButton from './atoms/customButton';
import { toast, alertError, confirmDestructive } from '@/lib/ui/alert';

interface SubGiftListProps {
    parentGift: GiftWithTakenUserId;
    userId?: string;
    isAdmin?: boolean;
    initialCount?: number;
    onGiftUpdate?: () => void;
}

export default function SubGiftList({ parentGift, userId, isAdmin = false, initialCount, onGiftUpdate }: SubGiftListProps) {
    const [subGifts, setSubGifts] = useState<GiftWithTakenUserId[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [creatingSubGift, setCreatingSubGift] = useState(false);
    const [newSubGiftName, setNewSubGiftName] = useState('');

    const isOwner = parentGift.userId === userId;
    // Tant que la liste n'est pas chargée, le compteur vient du serveur (initialCount)
    const subGiftsCount = loaded ? subGifts.length : (initialCount ?? 0);

    const loadSubGifts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/gift/${parentGift.id}/subgifts`);
            if (response.data.success) {
                setSubGifts(response.data.subGifts || []);
                setLoaded(true);
            }
        } catch (error) {
            console.error('Error loading subgifts:', error);
        } finally {
            setLoading(false);
        }
    }, [parentGift.id]);

    // Charger les sous-cadeaux quand le composant est expanded
    useEffect(() => {
        if (expanded && parentGift.giftType === 'MULTIPLE') {
            loadSubGifts();
        }
    }, [expanded, parentGift.giftType, loadSubGifts]);

    const handleCreateSubGift = async () => {
        if (!newSubGiftName.trim()) {
            alertError('Erreur', 'Le nom du sous-cadeau ne peut pas être vide');
            return;
        }

        try {
            const response = await axios.post(`/api/gift/${parentGift.id}/subgifts`, {
                name: newSubGiftName
            });

            if (response.data.success && response.data.subGift) {
                setSubGifts([...subGifts, response.data.subGift]);
                setNewSubGiftName('');
                setCreatingSubGift(false);

                if (onGiftUpdate) {
                    onGiftUpdate();
                }

                toast('Sous-cadeau ajouté !');
            }
        } catch (error) {
            alertError('Erreur', 'Impossible de créer ce sous-cadeau.');
        }
    };

    const handleDeleteSubGift = async (subGift: GiftWithTakenUserId) => {
        const confirmed = await confirmDestructive({
            title: 'Supprimer ce sous-cadeau ?',
            text: 'Cette action est irréversible.',
            confirmText: 'Oui',
            cancelText: 'Non'
        });
        if (!confirmed) return;

        try {
            await axios.delete(`/api/gift/${subGift.id}`);
            setSubGifts((prev) => prev.filter((g) => g.id !== subGift.id));
            if (onGiftUpdate) onGiftUpdate();
        } catch (error) {
            alertError('Erreur', 'Impossible de supprimer ce sous-cadeau.');
        }
    };

    const handleTakeSubGift = async (subGift: GiftWithTakenUserId) => {
        try {
            const isTaken = subGift.takenUserId != null;
            const endpoint = `/api/gift/${subGift.id}/take`;

            if (isTaken) {
                await axios.delete(endpoint, { data: { userId } });
            } else {
                await axios.post(endpoint, { userId });
            }

            await loadSubGifts();
            if (onGiftUpdate) onGiftUpdate();
            toast(isTaken ? 'Cadeau libéré !' : 'Cadeau réservé !');
        } catch (error) {
            alertError('Erreur', 'Impossible de réserver ce sous-cadeau.');
        }
    };

    // Si ce n'est pas un cadeau MULTIPLE, ne rien afficher
    if (parentGift.giftType !== 'MULTIPLE') {
        return null;
    }

    return (
        <div>
            {/* Toggle pour expand/collapse */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-lg border border-info-line bg-info-soft hover:bg-info-tint cursor-pointer select-none transition-colors duration-150"
            >
                <span className={`text-info transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span>
                <span className="text-sm font-medium text-info-fg-strong flex-1">
                    {expanded ? 'Masquer' : 'Afficher'} les sous-cadeaux
                </span>
                {subGiftsCount > 0 && (
                    <span className="text-xs bg-info-tint-strong text-info-fg-strong px-2 py-0.5 rounded-full font-semibold">
                        {subGiftsCount}
                    </span>
                )}
            </div>

            {expanded && (
                <div className="space-y-2 border border-info-line rounded-lg p-3">
                    {loading && (
                        <>
                            {Array.from({ length: subGifts.length || initialCount || 1 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-lg border border-line bg-surface animate-pulse"
                                >
                                    <div className="h-4 bg-surface-strong rounded-sm w-2/3" />
                                    <div className="h-8 bg-surface-strong rounded-lg w-24" />
                                </div>
                            ))}
                        </>
                    )}

                    {!loading && subGifts.length === 0 && (
                        <div className="text-sm text-fg-faint italic">Aucun sous-cadeau pour le moment</div>
                    )}

                    {/* Liste des sous-cadeaux */}
                    {!loading && subGifts.length > 0 && (
                        <div className="divide-y divide-line-soft">
                            {subGifts.map((subGift) => {
                                const isTaken = subGift.takenUserId != null;
                                const takenByMe = subGift.takenUserId === userId;

                                return (
                                    <div key={subGift.id} className="flex items-center justify-between py-2 px-2 gap-2">
                                        <div className="flex-1 flex items-center gap-2">
                                            <div>
                                                <span
                                                    className={`text-sm ${!isOwner && isTaken ? 'line-through text-fg-subtle' : 'text-fg'}`}
                                                >
                                                    {subGift.name}
                                                </span>
                                                {!isOwner && (
                                                    <span
                                                        className={`ml-2 text-xs font-medium ${isTaken ? 'text-danger' : 'text-success-fg'}`}
                                                    >
                                                        {isTaken
                                                            ? takenByMe
                                                                ? 'Réservé par vous'
                                                                : 'Déjà réservé'
                                                            : 'Disponible'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Boutons selon le rôle */}
                                        {isOwner ? (
                                            <CustomButton onClick={() => handleDeleteSubGift(subGift)}>Supprimer</CustomButton>
                                        ) : isTaken && takenByMe ? (
                                            <CustomButton onClick={() => handleTakeSubGift(subGift)}>
                                                Je ne prends plus
                                            </CustomButton>
                                        ) : !isTaken ? (
                                            <CustomButton onClick={() => handleTakeSubGift(subGift)} variant="green">
                                                Je le prends
                                            </CustomButton>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Formulaire d'ajout de sous-cadeau */}
                    {(isAdmin || isOwner) && (
                        <div className="mt-2">
                            {!creatingSubGift ? (
                                <CustomButton onClick={() => setCreatingSubGift(true)} variant="green">
                                    Ajouter un sous-cadeau
                                </CustomButton>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSubGiftName}
                                        onChange={(e) => setNewSubGiftName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleCreateSubGift()}
                                        placeholder="Nom du sous-cadeau (ex: Tome 1)"
                                        className="flex-1 px-3 py-2 text-sm border border-line-strong rounded-lg focus:ring-2 focus:ring-info-muted"
                                        autoFocus
                                    />
                                    <CustomButton onClick={handleCreateSubGift} variant="green">
                                        Ajouter
                                    </CustomButton>
                                    <CustomButton
                                        onClick={() => {
                                            setCreatingSubGift(false);
                                            setNewSubGiftName('');
                                        }}
                                    >
                                        Annuler
                                    </CustomButton>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
