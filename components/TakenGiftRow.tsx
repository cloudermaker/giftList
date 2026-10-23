import type { JSX } from 'react';
import { Check } from 'lucide-react';
import { GiftShopLink } from '@/components/atoms/GiftShopLink';
import { toSafeUrl } from '@/lib/ui/url';
import { avatarColor } from '@/lib/ui/colors';

export type TRecipient = { id: string; name: string };

// Réservation ou cadeau personnel, au même format pour l'affichage
export type TTakenRow = {
    key: string;
    kind: 'reserved' | 'personal';
    // id du cadeau (réservé) ou du cadeau personnel
    id: string;
    takenGiftId: string | null;
    parentGiftId: string | null;
    parentName: string | null;
    name: string;
    description: string | null;
    url: string | null;
    giftType: string;
    recipient: TRecipient | null;
    boughtAt: string | null;
};

export const RecipientAvatar = ({ recipient, size = 'md' }: { recipient: TRecipient | null; size?: 'sm' | 'md' }) => {
    const color = recipient ? avatarColor(recipient.name) : { bg: '#f3f4f6', text: '#6b7280' };
    return (
        <span
            className={`rounded-full flex items-center justify-center font-bold shrink-0 ${size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-9 h-9 text-sm'}`}
            style={{ background: color.bg, color: color.text }}
            aria-hidden="true"
        >
            {recipient ? recipient.name.charAt(0).toUpperCase() : '📝'}
        </span>
    );
};

export const TakenGiftRow = ({
    row,
    busy,
    onOpen,
    onToggleBought
}: {
    row: TTakenRow;
    busy: boolean;
    onOpen: () => void;
    onToggleBought: () => void;
}): JSX.Element => {
    const bought = !!row.boughtAt;
    const safeUrl = toSafeUrl(row.url);

    // Toute la ligne est cliquable à la souris ; au clavier, c'est le bouton du nom
    return (
        <div onClick={onOpen} className={`item flex items-center gap-3 cursor-pointer p-2.5! sm:p-[18px]! ${bought ? 'opacity-60' : ''}`}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleBought();
                }}
                disabled={busy}
                aria-pressed={bought}
                aria-label={bought ? `Marquer ${row.name} comme pas encore acheté` : `Marquer ${row.name} comme acheté`}
                title={bought ? 'Pas encore acheté' : 'Marquer comme acheté'}
                className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-wait ${
                    bought ? 'bg-vertNoel border-vertNoel text-white' : 'border-gray-300 text-transparent hover:border-vertNoel'
                }`}
            >
                <Check className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                }}
                className="flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer"
            >
                <span className={`block font-medium wrap-break-word ${bought ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {row.parentName && <span className="font-normal text-gray-400">{row.parentName} › </span>}
                    {row.name}
                </span>
                <span className="flex flex-wrap items-center gap-2 mt-1 empty:hidden">
                    {row.kind === 'personal' && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <RecipientAvatar recipient={row.recipient} size="sm" />
                            {row.recipient ? `Pour ${row.recipient.name}` : 'Pour personne en particulier'}
                        </span>
                    )}
                    {row.giftType === 'UNLIMITED' && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">🔁 Illimité</span>
                    )}
                    {bought && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Acheté</span>
                    )}
                </span>
            </button>

            {safeUrl && <GiftShopLink url={safeUrl} name={row.name} />}
        </div>
    );
};
