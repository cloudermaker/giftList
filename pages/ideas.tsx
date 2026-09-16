import { useEffect, useState } from 'react';
import { Idea } from '@prisma/client';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import CustomButton from '@/components/atoms/customButton';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { getIdeas } from '@/lib/db/ideaManager';
import { TIdeaApiResult } from '@/pages/api/idea';

type TIdeaItem = Omit<Idea, 'createdAt' | 'updatedAt' | 'doneAt'> & { createdAt: string; doneAt: string | null };

const VOTED_IDS_KEY = 'votedIdeaIds';
const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });

const readVotedIds = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(VOTED_IDS_KEY) ?? '[]');
    } catch {
        return [];
    }
};

const IdeasPage = ({ ideas }: { ideas: TIdeaItem[] }): JSX.Element => {
    const [localIdeas, setLocalIdeas] = useState<TIdeaItem[]>(ideas);
    const [votedIds, setVotedIds] = useState<string[]>([]);
    const [showDone, setShowDone] = useState(false);
    const [minLikes, setMinLikes] = useState(0);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // localStorage lu après le montage (évite un mismatch d'hydratation)
    useEffect(() => {
        setVotedIds(readVotedIds());
    }, []);

    const persistVotedIds = (ids: string[]) => {
        setVotedIds(ids);
        try {
            localStorage.setItem(VOTED_IDS_KEY, JSON.stringify(ids));
        } catch {
            // stockage indisponible : le vote reste possible, sans mémorisation
        }
    };

    const submitIdea = async () => {
        if (!title.trim()) {
            setFeedback({ ok: false, text: 'Donnez un titre à votre idée.' });
            return;
        }
        setSubmitting(true);
        setFeedback(null);
        try {
            const res = await AxiosWrapper.post('/api/idea', { title: title.trim(), description: description.trim() });
            const data = res?.data as TIdeaApiResult;
            if (data?.success && data.idea) {
                setLocalIdeas((prev) => [{ ...(data.idea as any), createdAt: String(data.idea!.createdAt), doneAt: null }, ...prev]);
                setTitle('');
                setDescription('');
                setFeedback({ ok: true, text: 'Merci ! Votre idée est en ligne.' });
            } else {
                setFeedback({ ok: false, text: data?.error || "Impossible d'envoyer l'idée." });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const toggleVote = async (idea: TIdeaItem) => {
        const hasVoted = votedIds.includes(idea.id);
        const res = hasVoted
            ? await AxiosWrapper.delete(`/api/idea/${idea.id}/vote`)
            : await AxiosWrapper.post(`/api/idea/${idea.id}/vote`);
        const data = res?.data as TIdeaApiResult;
        if (data?.success && data.idea) {
            setLocalIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, likes: data.idea!.likes } : i)));
            persistVotedIds(hasVoted ? votedIds.filter((id) => id !== idea.id) : [...votedIds, idea.id]);
        } else if (data?.error) {
            setFeedback({ ok: false, text: data.error });
        }
    };

    const visibleIdeas = localIdeas
        .filter((i) => (showDone ? true : !i.doneAt))
        .filter((i) => i.likes >= minLikes)
        .sort((a, b) => b.likes - a.likes || (a.createdAt < b.createdAt ? 1 : -1));

    return (
        <Layout withHeader={false}>
            <SEO title="Boîte à idées" description="Proposez vos idées pour améliorer Ma liste de cadeaux et votez pour celles des autres." canonicalPath="/ideas" noIndex />
            <div className="max-w-3xl mx-auto py-8">
                <div className="mb-8 text-center">
                    <div className="text-4xl mb-2" role="img" aria-hidden="true">💡</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Boîte à idées</h1>
                    <p className="text-sm text-gray-500">
                        Une envie, une amélioration ? Proposez votre idée et votez pour celles des autres — les plus populaires seront réalisées en priorité.
                    </p>
                </div>

                {/* Proposer une idée */}
                <div className="item mb-8">
                    <div className="input-group">
                        <label htmlFor="ideaTitleInput" className="input-label">Mon idée :</label>
                        <input
                            id="ideaTitleInput"
                            className="input-field"
                            maxLength={100}
                            placeholder="Ex : pouvoir ajouter une photo sur un cadeau"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="ideaDescriptionInput" className="input-label">Détails (optionnel) :</label>
                        <textarea
                            id="ideaDescriptionInput"
                            className="input-field"
                            maxLength={500}
                            rows={2}
                            placeholder="Précisez si besoin…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    {feedback && (
                        <p className={`text-sm mb-2 ${feedback.ok ? 'text-vertNoel' : 'text-rougeNoel'}`}>{feedback.text}</p>
                    )}
                    <CustomButton className="green-button" onClick={submitIdea} disabled={submitting || !title.trim()}>
                        Proposer mon idée
                    </CustomButton>
                </div>

                {/* Filtres */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" className="accent-vertNoel w-4 h-4" checked={showDone} onChange={() => setShowDone((v) => !v)} />
                        Afficher les idées déjà réalisées
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        Votes minimum :
                        <select className="input-field !p-1.5 !flex-none w-20" value={minLikes} onChange={(e) => setMinLikes(Number(e.target.value))}>
                            <option value={0}>Tous</option>
                            <option value={5}>5+</option>
                            <option value={10}>10+</option>
                            <option value={25}>25+</option>
                        </select>
                    </label>
                </div>

                {/* Liste */}
                {visibleIdeas.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-4xl mb-3">💡</p>
                        <p className="text-sm text-gray-400">Aucune idée pour le moment — proposez la première !</p>
                    </div>
                )}
                {visibleIdeas.map((idea) => {
                    const hasVoted = votedIds.includes(idea.id);
                    return (
                        <div key={idea.id} className="item">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800">{idea.title}</p>
                                    {idea.description && <p className="text-sm text-gray-500 mt-1">{idea.description}</p>}
                                    {idea.doneAt && (
                                        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                            ✅ Réalisée le {DATE_FMT.format(new Date(idea.doneAt))}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleVote(idea)}
                                    aria-label={hasVoted ? 'Retirer mon vote' : 'Voter pour cette idée'}
                                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                                        hasVoted
                                            ? 'bg-vertNoel text-white border-vertNoel'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-vertNoel hover:text-vertNoel'
                                    }`}
                                    style={{ boxShadow: 'none', backgroundImage: 'none', margin: 0 }}
                                >
                                    👍 {idea.likes}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Layout>
    );
};

export async function getServerSideProps() {
    const ideas = await getIdeas();

    return {
        props: {
            ideas: ideas.map((idea) => ({
                ...idea,
                createdAt: idea.createdAt.toISOString(),
                updatedAt: idea.updatedAt.toISOString(),
                doneAt: idea.doneAt ? idea.doneAt.toISOString() : null
            }))
        }
    };
}

export default IdeasPage;
