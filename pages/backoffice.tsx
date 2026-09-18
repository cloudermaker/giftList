import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout';
import { PageTitle } from '@/components/atoms/PageTitle';
import { EHeader } from '@/components/customHeader';
import CustomButton from '@/components/atoms/customButton';
import { buildDefaultGroup, getGroupsPage } from '@/lib/db/groupManager';
import { TGroupApiResult } from './api/group';
import { Group } from '@prisma/client';
import { toast, alertError, confirmDestructive, promptText, getSwal } from '@/lib/ui/alert';
import Router from 'next/router';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { GetServerSidePropsContext } from 'next';

type TMember = { id: string; name: string; isAdmin: boolean; createdAt?: string };

type TIdeaAdminItem = { id: string; title: string; description: string | null; likes: number; doneAt: string | null };

// Formatage déterministe (locale + fuseau fixes) pour éviter les mismatchs d'hydratation SSR
const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' });

type TGroupItem = { id: string; name: string; createdAt: string };

type TGroupRowProps = {
    group: TGroupItem;
    onRemove: (id: string) => void;
    onRename: (id: string, newName: string) => void;
};

const GroupRow = ({ group, onRemove, onRename }: TGroupRowProps): JSX.Element => {
    const [expanded, setExpanded] = useState(false);
    const [members, setMembers] = useState<TMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [groupName, setGroupName] = useState(group.name);

    useEffect(() => {
        if (!expanded || members.length > 0) return;
        setLoading(true);
        AxiosWrapper.get(`/api/user?groupid=${group.id}`)
            .then((res) => setMembers(res?.data?.users ?? []))
            .finally(() => setLoading(false));
    }, [expanded, group.id, members.length]);

    const renameGroup = async () => {
        const newName = await promptText({ title: 'Renommer le groupe', initialValue: groupName, confirmText: 'Renommer' });
        if (!newName || newName === groupName) return;
        const result = await AxiosWrapper.patch(`/api/group/${group.id}`, { group: { name: newName } });
        if (result?.data?.success) {
            setGroupName(newName);
            onRename(group.id, newName);
            toast('Renommé !');
        } else {
            alertError('Erreur', result?.data?.error || 'Impossible de renommer le groupe.');
        }
    };

    const changePassword = async () => {
        const { value: newPwd } = await (
            await getSwal()
        ).fire({
            title: 'Changer le mot de passe',
            input: 'password',
            inputPlaceholder: 'Nouveau mot de passe',
            showCancelButton: true,
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            inputValidator: (v) => (!v ? 'Le mot de passe ne peut pas être vide.' : null)
        });
        if (!newPwd) return;
        const result = await AxiosWrapper.patch(`/api/group/${group.id}`, { group: { adminPassword: newPwd } });
        if (result?.data?.success) {
            toast('Mot de passe mis à jour !');
        } else {
            alertError('Erreur', result?.data?.error || 'Impossible de changer le mot de passe.');
        }
    };

    const toggleRole = async (member: TMember) => {
        const newRole = member.isAdmin ? 'MEMBER' : 'ADMIN';
        if (member.isAdmin && members.filter((m) => m.isAdmin).length <= 1) {
            (await getSwal()).fire('Impossible', 'Il doit rester au moins un administrateur dans le groupe.', 'warning');
            return;
        }
        const result = await AxiosWrapper.patch('/api/userGroup', { userId: member.id, groupId: group.id, role: newRole });
        if (result?.data?.success) {
            setMembers((m) => m.map((m2) => (m2.id === member.id ? { ...m2, isAdmin: !m2.isAdmin } : m2)));
        } else {
            alertError('Erreur', result?.data?.error || 'Impossible de modifier le rôle.');
        }
    };

    const addMember = async () => {
        const name = await promptText({ title: 'Ajouter un membre', placeholder: 'Prénom', confirmText: 'Ajouter' });
        if (!name) return;
        const result = await AxiosWrapper.post('/api/user', { user: { name }, groupId: group.id });
        const data = result?.data;
        if (data?.success && data.user) {
            setMembers((m) => [...m, { id: data.user.id, name: data.user.name, isAdmin: false }]);
            toast('Membre ajouté !');
        } else {
            alertError('Erreur', data?.error || "Impossible d'ajouter le membre.");
        }
    };

    const renameMember = async (member: TMember) => {
        const newName = await promptText({ title: `Renommer ${member.name}`, initialValue: member.name, confirmText: 'Renommer' });
        if (!newName || newName === member.name) return;
        const result = await AxiosWrapper.patch(`/api/user/${member.id}`, { user: { name: newName }, groupId: group.id });
        if (result?.data?.success) {
            setMembers((m) => m.map((m2) => (m2.id === member.id ? { ...m2, name: newName } : m2)));
            toast('Renommé !');
        } else {
            alertError('Erreur', result?.data?.error || 'Impossible de renommer.');
        }
    };

    const removeMember = async (member: TMember) => {
        const confirmed = await confirmDestructive({
            title: `Supprimer ${member.name} ?`,
            text: 'Cette action est irréversible.',
            confirmText: 'Oui',
            cancelText: 'Non'
        });
        if (!confirmed) return;
        const result = await AxiosWrapper.delete(`/api/user/${member.id}`);
        if (result?.data?.success) {
            setMembers((m) => m.filter((m2) => m2.id !== member.id));
        } else {
            alertError('Erreur', result?.data?.error || 'Impossible de supprimer.');
        }
    };

    return (
        <div className="item">
            <div
                className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-3">
                    <span className={`text-indigo-400 transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`}>
                        ▶
                    </span>
                    <span className="font-semibold">{groupName}</span>
                    <span className="hidden md:inline text-xs text-neutral-400">
                        {group.createdAt ? DATE_FMT.format(new Date(group.createdAt)) : ''}
                    </span>
                </div>
                <div className="flex gap-0.5 md:gap-2" onClick={(e) => e.stopPropagation()}>
                    <CustomButton className="icon-btn md:hidden" onClick={renameGroup}>
                        ✏️
                    </CustomButton>
                    <CustomButton className="green-button hidden md:inline-flex" onClick={renameGroup}>
                        Renommer
                    </CustomButton>
                    <CustomButton className="icon-btn md:hidden" onClick={changePassword}>
                        🔑
                    </CustomButton>
                    <CustomButton className="green-button hidden md:inline-flex" onClick={changePassword}>
                        Mot de passe
                    </CustomButton>
                    <CustomButton className="icon-btn md:hidden" onClick={() => onRemove(group.id)}>
                        🗑️
                    </CustomButton>
                    <CustomButton className="hidden md:inline-flex" onClick={() => onRemove(group.id)}>
                        Supprimer
                    </CustomButton>
                </div>
            </div>

            {expanded && (
                <div className="bg-neutral-50 px-4 py-3 mx-3 mb-3 rounded-lg border border-neutral-200">
                    {loading ? (
                        <div className="flex flex-col gap-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                                    <div className="flex gap-2">
                                        <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse" />
                                        <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse" />
                                        <div className="h-8 w-24 bg-gray-200 rounded-xl animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {members.length === 0 && <p className="text-sm text-neutral-400">Aucun membre</p>}
                            {members.map((member, index) => (
                                <div
                                    key={member.id}
                                    className={`flex justify-between items-center ${index > 0 ? 'border-t border-neutral-200 pt-2' : ''}`}
                                >
                                    <span className="text-sm">
                                        {member.name}
                                        {member.isAdmin && (
                                            <span className="ml-2 text-xs text-rougeNoel font-medium">(admin)</span>
                                        )}
                                        {member.createdAt && (
                                            <span className="hidden md:inline ml-2 text-xs text-neutral-400">
                                                {DATE_FMT.format(new Date(member.createdAt))}
                                            </span>
                                        )}
                                    </span>
                                    <div className="flex gap-0.5 md:gap-2">
                                        <CustomButton
                                            className="icon-btn md:hidden"
                                            onClick={() => Router.push(`/giftList/${member.id}`)}
                                        >
                                            👁
                                        </CustomButton>
                                        <CustomButton
                                            className="slate-button hidden md:inline-flex"
                                            onClick={() => Router.push(`/giftList/${member.id}`)}
                                        >
                                            Voir liste
                                        </CustomButton>
                                        <CustomButton className="icon-btn md:hidden" onClick={() => renameMember(member)}>
                                            ✏️
                                        </CustomButton>
                                        <CustomButton
                                            className="green-button hidden md:inline-flex"
                                            onClick={() => renameMember(member)}
                                        >
                                            Renommer
                                        </CustomButton>
                                        <CustomButton className="icon-btn md:hidden" onClick={() => toggleRole(member)}>
                                            {member.isAdmin ? '⬇️' : '⭐'}
                                        </CustomButton>
                                        <CustomButton
                                            className={`hidden md:inline-flex${member.isAdmin ? '' : ' green-button'}`}
                                            onClick={() => toggleRole(member)}
                                        >
                                            {member.isAdmin ? 'Rétrograder' : 'Promouvoir'}
                                        </CustomButton>
                                        <CustomButton className="icon-btn md:hidden" onClick={() => removeMember(member)}>
                                            🗑️
                                        </CustomButton>
                                        <CustomButton className="hidden md:inline-flex" onClick={() => removeMember(member)}>
                                            Supprimer
                                        </CustomButton>
                                    </div>
                                </div>
                            ))}
                            <div className="border-t border-neutral-200 pt-2">
                                <CustomButton className="green-button" onClick={addMember}>
                                    Ajouter un membre
                                </CustomButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

type TBackofficeProps = {
    groups: TGroupItem[];
    isAuthenticated: boolean;
    page: number;
    totalCount: number;
    pageSize: number;
};

const Backoffice = ({
    groups = [],
    isAuthenticated = false,
    page = 1,
    totalCount = 0,
    pageSize = 10
}: TBackofficeProps): JSX.Element => {
    const [localGroups, setLocalGroups] = useState<TGroupItem[]>(groups);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // Resynchronise l'état local quand les props SSR changent (navigation client : login, pagination)
    useEffect(() => {
        setLocalGroups(groups);
    }, [groups]);
    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');

    const showLoginModal = useCallback(async (): Promise<void> => {
        const swal = await getSwal();
        while (true) {
            const { value: formValues, isDismissed } = await swal.fire({
                title: 'Accès backoffice',
                html: `<input id="swal-login" class="swal2-input" placeholder="Identifiant" autocomplete="username">
                       <input id="swal-pass" class="swal2-input" type="password" placeholder="Mot de passe" autocomplete="current-password">`,
                confirmButtonText: 'Connexion',
                showCancelButton: true,
                showCloseButton: false,
                allowOutsideClick: true,
                icon: 'question',
                allowEscapeKey: true,
                focusConfirm: true,
                preConfirm: () => {
                    const login = (document.getElementById('swal-login') as HTMLInputElement)?.value;
                    const pass = (document.getElementById('swal-pass') as HTMLInputElement)?.value;
                    if (!login || !pass) {
                        swal.showValidationMessage('Identifiant et mot de passe requis');
                        return false;
                    }
                    return { login, pass };
                }
            });

            if (isDismissed || !formValues) {
                Router.push('/');
                return;
            }

            const result = await AxiosWrapper.post('/api/backoffice/auth', { login: formValues.login, pass: formValues.pass });
            if (result?.status === 200) {
                Router.push('/backoffice');
                return;
            }

            await swal.fire({ title: 'Accès refusé', icon: 'error', text: 'Identifiants incorrects.' });
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            showLoginModal();
        }
    }, [isAuthenticated, showLoginModal]);

    if (!isAuthenticated) {
        return <></>;
    }

    const removeGroup = async (groupId: string): Promise<void> => {
        const confirmed = await confirmDestructive({
            title: 'Es-tu certain de vouloir supprimer tout le groupe?',
            text: 'Il ne sera pas possible de revenir en arrière!'
        });
        if (!confirmed) return;

        const apiResult = await AxiosWrapper.delete(`/api/group/${groupId}`);
        const data = apiResult?.data as TGroupApiResult;

        if (data?.success) {
            setLocalGroups((groups) => groups.filter((group) => group.id !== groupId));
            toast('Supprimé !');
        } else {
            alertError('Erreur', data?.error || 'Impossible de supprimer ce groupe. Réessayez dans quelques instants.');
        }
    };

    const addGroup = async (): Promise<void> => {
        const groupToAdd: Group = buildDefaultGroup();
        groupToAdd.name = newGroupName;
        groupToAdd.adminPassword = newPassword;

        const result = await AxiosWrapper.post('/api/group', { group: groupToAdd });
        const data = result?.data as TGroupApiResult;

        if (data && data.success && data.group) {
            clearAllFields();
            Router.push('/backoffice'); // newest first: the new group shows on page 1
        } else {
            alertError('Erreur', data?.error || 'Impossible de créer ce groupe. Réessayez dans quelques instants.');
        }
    };

    const onCreatingGroupButtonClick = (): void => {
        setCreatingGroup(true);
        window.setTimeout(() => document.getElementById('newGroupInputId')?.focus(), 0);
    };

    const clearAllFields = () => {
        setNewGroupName('');
        setNewPassword('');
        setCreatingGroup(false);
    };

    const logoutBackoffice = async (): Promise<void> => {
        await AxiosWrapper.delete('/api/backoffice/auth');
        Router.push('/');
    };

    return (
        <Layout selectedHeader={EHeader.Backoffice}>
            <div>
                <div className="flex justify-between items-center mb-8">
                    <PageTitle className="">Backoffice</PageTitle>
                    <button
                        onClick={logoutBackoffice}
                        className="text-white text-sm bg-rougeNoel/80 hover:bg-rougeNoel px-3 py-1.5 rounded transition-colors"
                    >
                        Se déconnecter
                    </button>
                </div>

                <h2 className="text-base font-semibold text-gray-600 uppercase tracking-wide mb-4">Groupes</h2>

                {localGroups.map((group) => (
                    <GroupRow
                        key={group.id}
                        group={group}
                        onRemove={removeGroup}
                        onRename={(id, newName) =>
                            setLocalGroups((gs) => gs.map((g) => (g.id === id ? { ...g, name: newName } : g)))
                        }
                    />
                ))}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4 mb-2">
                        <CustomButton disabled={page <= 1} onClick={() => Router.push(`/backoffice?page=${page - 1}`)}>
                            ← Précédent
                        </CustomButton>
                        <span className="text-sm text-neutral-500">
                            Page {page} / {totalPages}
                        </span>
                        <CustomButton disabled={page >= totalPages} onClick={() => Router.push(`/backoffice?page=${page + 1}`)}>
                            Suivant →
                        </CustomButton>
                    </div>
                )}

                {!creatingGroup && (
                    <CustomButton className="green-button mt-2" onClick={onCreatingGroupButtonClick}>
                        Ajouter
                    </CustomButton>
                )}

                {creatingGroup && (
                    <div className="item">
                        <div className="input-group">
                            <label className="input-label">Nom du groupe:</label>
                            <input
                                id="newGroupInputId"
                                className="input-field"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Mot de passe:</label>
                            <input
                                id="newPasswordInputId"
                                className="input-field"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                type="password"
                            />
                        </div>
                        <CustomButton className="green-button" onClick={addGroup}>
                            Ajouter
                        </CustomButton>
                        <CustomButton onClick={clearAllFields}>Annuler</CustomButton>
                    </div>
                )}

                <IdeasAdmin />
            </div>
        </Layout>
    );
};

// Modération de la boîte à idées (/ideas)
const IdeasAdmin = (): JSX.Element => {
    const [ideas, setIdeas] = useState<TIdeaAdminItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AxiosWrapper.get('/api/idea')
            .then((res) => setIdeas(res?.data?.ideas ?? []))
            .finally(() => setLoaded(true));
    }, []);

    const toggleDone = async (idea: TIdeaAdminItem) => {
        const result = await AxiosWrapper.patch(`/api/idea/${idea.id}`, { done: !idea.doneAt });
        if (result?.data?.success && result.data.idea) {
            setIdeas((prev) => prev.map((i) => (i.id === idea.id ? result.data.idea : i)));
        }
    };

    const editIdea = async (idea: TIdeaAdminItem) => {
        const swal = await getSwal();
        // valeurs injectées via le DOM (pas dans le html), le contenu vient d'utilisateurs publics
        const { isConfirmed, value } = await swal.fire<{ title: string; description: string }>({
            title: "Modifier l'idée",
            html:
                '<input id="ideaEditTitle" class="swal2-input" maxlength="100" placeholder="Titre">' +
                '<textarea id="ideaEditDescription" class="swal2-textarea" maxlength="500" placeholder="Description (optionnel)"></textarea>',
            didOpen: () => {
                const titleInput = document.getElementById('ideaEditTitle') as HTMLInputElement;
                titleInput.value = idea.title;
                (document.getElementById('ideaEditDescription') as HTMLTextAreaElement).value = idea.description ?? '';
                titleInput.focus();
                // Entrée dans le titre = valider (pas dans la description : retour à la ligne)
                titleInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') swal.clickConfirm();
                });
            },
            showCancelButton: true,
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            preConfirm: () => {
                const title = (document.getElementById('ideaEditTitle') as HTMLInputElement).value.trim();
                const description = (document.getElementById('ideaEditDescription') as HTMLTextAreaElement).value.trim();
                if (title.length < 3) {
                    swal.showValidationMessage('Le titre doit faire au moins 3 caractères.');
                    return false;
                }
                return { title, description };
            }
        });
        if (!isConfirmed || !value) return;
        const result = await AxiosWrapper.patch(`/api/idea/${idea.id}`, value);
        if (result?.data?.success && result.data.idea) {
            setIdeas((prev) => prev.map((i) => (i.id === idea.id ? result.data.idea : i)));
        }
    };

    const removeIdea = async (idea: TIdeaAdminItem) => {
        const confirmed = await confirmDestructive({ title: `Supprimer « ${idea.title} » ?`, confirmText: 'Oui', cancelText: 'Non' });
        if (!confirmed) return;
        const result = await AxiosWrapper.delete(`/api/idea/${idea.id}`);
        if (result?.data?.success) {
            setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
        }
    };

    return (
        <div className="mt-12">
            <h2 className="text-base font-semibold text-gray-600 uppercase tracking-wide mb-4">Boîte à idées</h2>
            {loaded && ideas.length === 0 && <p className="text-sm text-neutral-400">Aucune idée proposée.</p>}
            {ideas.map((idea) => (
                <div className="item" key={idea.id}>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800">{idea.title}</span>
                            <span className="ml-2 text-xs text-neutral-400">👍 {idea.likes}</span>
                            {idea.doneAt && <span className="ml-2 text-xs text-green-600 font-medium">✅ Réalisée</span>}
                            {idea.description && <p className="text-xs text-neutral-400 truncate">{idea.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <CustomButton className="green-button" onClick={() => toggleDone(idea)}>
                                {idea.doneAt ? 'Rouvrir' : 'Fait'}
                            </CustomButton>
                            <CustomButton onClick={() => editIdea(idea)}>Modifier</CustomButton>
                            <CustomButton onClick={() => removeIdea(idea)}>Supprimer</CustomButton>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const PAGE_SIZE = 10;

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const isAuthenticated = context.req.cookies['backoffice_session'] === '1';

    if (!isAuthenticated) {
        return { props: { groups: [], isAuthenticated: false, page: 1, totalCount: 0, pageSize: PAGE_SIZE } };
    }

    const page = Math.max(1, parseInt((context.query.page as string) ?? '1', 10) || 1);
    const { groups, totalCount } = await getGroupsPage(page, PAGE_SIZE);

    return {
        props: {
            isAuthenticated: true,
            page,
            totalCount,
            pageSize: PAGE_SIZE,
            groups: groups.map((group) => ({
                ...group,
                createdAt: group.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default Backoffice;
