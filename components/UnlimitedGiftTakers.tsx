import { GiftWithTakenUserId, TakenByEntry } from '@/lib/db/giftManager';
import { User } from '@prisma/client';
import axios from 'axios';
import { useState } from 'react';
import Swal from 'sweetalert2';
import CustomButton from './atoms/customButton';

interface UnlimitedGiftTakersProps {
    gift: GiftWithTakenUserId;
    userId?: string;
    groupUserMap?: { [key: string]: User };
    onGiftUpdate?: () => void;
}

function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function UnlimitedGiftTakers({ gift, userId, groupUserMap = {}, onGiftUpdate }: UnlimitedGiftTakersProps) {
    const [expanded, setExpanded] = useState(false);
    const [taking, setTaking] = useState(false);

    const takenByList: TakenByEntry[] = gift.takenByList ?? [];
    const takenByMe = takenByList.some((t) => t.userId === userId);
    const takenCount = takenByList.length;

    const handleTake = async () => {
        if (!userId) return;
        setTaking(true);
        try {
            const res = await axios.post(`/api/gift/${gift.id}/take`, { userId });
            if (res.data?.success) {
                onGiftUpdate?.();
                Swal.fire({ title: 'Cadeau réservé !', icon: 'success', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire({ title: 'Erreur', text: 'Impossible de réserver ce cadeau.', icon: 'error' });
            }
        } catch {
            Swal.fire({ title: 'Erreur', text: 'Impossible de réserver ce cadeau.', icon: 'error' });
        } finally {
            setTaking(false);
        }
    };

    const handleRelease = async (takenGiftId: string) => {
        if (!userId) return;
        setTaking(true);
        try {
            const res = await axios.delete(`/api/gift/${gift.id}/take`, { data: { userId, takenGiftId } });
            if (res.data?.success) {
                onGiftUpdate?.();
                Swal.fire({ title: 'Cadeau libéré !', icon: 'success', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire({ title: 'Erreur', text: 'Impossible de libérer ce cadeau.', icon: 'error' });
            }
        } catch {
            Swal.fire({ title: 'Erreur', text: 'Impossible de libérer ce cadeau.', icon: 'error' });
        } finally {
            setTaking(false);
        }
    };

    const showDetails = () => {
        if (takenByList.length === 0) {
            Swal.fire({ title: 'Personne n\'a encore pris ce cadeau', icon: 'info' });
            return;
        }

        const rows = takenByList.map((t) => {
            const name = groupUserMap[t.userId]?.name ?? 'Utilisateur inconnu';
            return `<li class="py-1 border-b border-gray-100 last:border-0 text-sm"><b>${name}</b> — ${formatDate(t.takenAt)}</li>`;
        }).join('');

        Swal.fire({
            title: `Qui a pris ce cadeau ? (${takenCount})`,
            html: `<ul class="text-left mt-2">${rows}</ul>`,
            icon: 'info'
        });
    };

    return (
        <div>
            {/* Toggle */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 cursor-pointer select-none transition-colors duration-150"
            >
                <span className={`text-orange-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span>
                <span className="text-sm font-medium text-orange-700 flex-1">
                    {expanded ? 'Masquer' : 'Voir'} qui a pris ce cadeau
                </span>

                {/* Pill count */}
                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-semibold">
                    {takenCount} pris
                </span>

                {/* Bouton ? */}
                <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); showDetails(); }}
                    title="Voir les détails"
                    className="w-4 h-4 rounded-full border border-orange-300 text-orange-300 hover:text-orange-500 hover:border-orange-500 text-[10px] font-bold flex items-center justify-center shrink-0 cursor-pointer transition-colors select-none"
                >
                    i
                </span>
            </div>

            {expanded && (
                <div className="border border-orange-200 rounded-lg p-3 space-y-2">
                    {takenByList.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Personne n&apos;a encore pris ce cadeau.</p>
                    )}

                    {takenByList.length > 0 && (
                        <div className="divide-y divide-gray-100">
                            {takenByList.map((t) => {
                                const name = groupUserMap[t.userId]?.name ?? '…';
                                const isMe = t.userId === userId;
                                return (
                                    <div key={t.id} className="flex items-center justify-between py-2 px-2 gap-2">
                                        <div>
                                            <span className="text-sm font-medium">{name}</span>
                                            {isMe && <span className="ml-2 text-xs text-orange-600 font-medium">vous</span>}
                                            <span className="block text-xs text-gray-400">{formatDate(t.takenAt)}</span>
                                        </div>
                                        {isMe && (
                                            <button
                                                onClick={() => handleRelease(t.id)}
                                                disabled={taking}
                                                className="text-xs cursor-pointer disabled:opacity-50"
                                            >
                                                Retirer
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Bouton Je prends toujours visible */}
                    <div className="pt-2">
                        <CustomButton onClick={handleTake} disabled={taking} className="green-button">
                            {taking ? 'En cours...' : 'Je prends ce cadeau'}
                        </CustomButton>
                    </div>
                </div>
            )}
        </div>
    );
}
