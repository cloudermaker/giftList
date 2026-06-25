import { useState, useEffect } from 'react';
import CustomButton from './atoms/customButton';
import Swal from 'sweetalert2';

type Props = {
    userName: string;
    groupName: string;
    inviteToken: string;
    onClose: () => void;
};

const STEPS = 3;

const Dot = ({ active }: { active: boolean }) => (
    <span className={`inline-block rounded-full transition-all duration-300 ${active ? 'w-6 h-2 bg-vertNoel' : 'w-2 h-2 bg-gray-300'}`} />
);

export const OnboardingModal = ({ userName, groupName, inviteToken, onClose }: Props): JSX.Element => {
    const [step, setStep] = useState(0);

    const inviteUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/join/${inviteToken}`
        : `/join/${inviteToken}`;

    const homeUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/home`
        : '/home';

    const mailtoLink = `mailto:?subject=Ma liste de cadeaux — ${groupName}&body=Voici le lien pour revenir sur ma liste : ${homeUrl}`;

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const share = async () => {
        const shareData = {
            title: `Rejoins le groupe ${groupName}`,
            text: `Clique pour rejoindre la liste de cadeaux "${groupName}" !`,
            url: inviteUrl,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); return; } catch {}
        }
        await navigator.clipboard.writeText(inviteUrl);
        Swal.fire({ title: 'Lien copié !', icon: 'success', timer: 1500, showConfirmButton: false });
    };

    const steps = [
        {
            emoji: '🎁',
            title: `Bienvenue, ${userName} !`,
            content: (
                <div className="text-gray-600 space-y-4 text-base">
                    <p>Votre groupe <strong className="text-gray-800">{groupName}</strong> est prêt.</p>
                    <p>Pour l'instant, vous êtes le seul membre. Une liste de cadeaux prend tout son sens quand vos proches peuvent la voir — et partager la leur avec vous.</p>
                    <p>Voici comment bien démarrer.</p>
                </div>
            ),
        },
        {
            emoji: '🔗',
            title: 'Invitez vos proches',
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 text-base">Partagez ce lien à votre famille ou vos amis. Chacun pourra rejoindre le groupe et partager sa propre liste.</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <p className="text-sm text-gray-500 font-mono truncate mb-3">{inviteUrl}</p>
                        <CustomButton className="green-button w-full" onClick={share}>
                            Partager le lien d'invitation
                        </CustomButton>
                    </div>
                    <p className="text-base text-gray-600">
                        En tant qu'administrateur, vous pouvez aussi ajouter des membres directement depuis la page d'accueil — utile si quelqu'un n'a pas de smartphone.
                    </p>
                </div>
            ),
        },
        {
            emoji: '⭐',
            title: 'Revenez facilement',
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 text-base">
                        Votre session dure <strong className="text-gray-800">400 jours</strong> — revenez simplement sur le site et vous serez connecté automatiquement.
                    </p>
                    <p className="text-gray-600 text-base">
                        Pour garder le lien sous la main, envoyez-le vous par email :
                    </p>
                    <a
                        href={mailtoLink}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-bleuNoel text-bleuNoel font-semibold text-base hover:bg-bleuNoel hover:text-white transition-colors"
                    >
                        ✉️ M'envoyer le lien par email
                    </a>
                    <p className="text-base text-gray-600 text-center">Ou ajoutez cette page en favori dans votre navigateur.</p>
                </div>
            ),
        },
    ];

    const current = steps[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-5">
                        <span className="text-4xl">{current.emoji}</span>
                        <button className="icon-btn text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-5">{current.title}</h2>
                    {current.content}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 flex items-center justify-between gap-3 border-t border-gray-100 mt-4">
                    <div className="flex gap-1.5 items-center">
                        {Array.from({ length: STEPS }).map((_, i) => <Dot key={i} active={i === step} />)}
                    </div>
                    <div className="flex gap-2">
                        {step > 0 && (
                            <CustomButton className="slate-button" onClick={() => setStep(s => s - 1)}>
                                Retour
                            </CustomButton>
                        )}
                        {step < STEPS - 1 ? (
                            <CustomButton className="green-button" onClick={() => setStep(s => s + 1)}>
                                Suivant →
                            </CustomButton>
                        ) : (
                            <CustomButton className="green-button" onClick={onClose}>
                                C&apos;est parti !
                            </CustomButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
