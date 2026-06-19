import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout';
import { EHeader } from '@/components/customHeader';
import CustomButton from '@/components/atoms/customButton';
import { buildDefaultGroup, getGroups } from '@/lib/db/groupManager';
import { TGroupApiResult } from './api/group';
import { Group } from '@prisma/client';
import Swal from 'sweetalert2';
import Router from 'next/router';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { BACKOFFICE_SECRET, BACKOFFICE_SESSION_KEY } from '@/lib/auth/authService';

const BACKOFFICE_HEADERS = { 'x-backoffice-secret': BACKOFFICE_SECRET };

type TMember = { id: string; name: string; isAdmin: boolean; createdAt?: string };

type TGroupRowProps = {
    group: Group;
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
        const { value: newName } = await Swal.fire({
            title: 'Renommer le groupe',
            input: 'text',
            inputValue: groupName,
            showCancelButton: true,
            confirmButtonText: 'Renommer',
            cancelButtonText: 'Annuler',
        });
        if (!newName || newName === groupName) return;
        const result = await AxiosWrapper.patch(`/api/group/${group.id}`, { group: { name: newName } }, BACKOFFICE_HEADERS);
        if (result?.data?.success) {
            setGroupName(newName);
            onRename(group.id, newName);
            Swal.fire({ title: 'Renommé !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire('Erreur', result?.data?.error || 'Impossible de renommer le groupe.', 'error');
        }
    };

    const addMember = async () => {
        const { value: name } = await Swal.fire({
            title: 'Ajouter un membre',
            input: 'text',
            inputPlaceholder: 'Prénom',
            showCancelButton: true,
            confirmButtonText: 'Ajouter',
            cancelButtonText: 'Annuler',
        });
        if (!name) return;
        const result = await AxiosWrapper.post('/api/user', { user: { name }, groupId: group.id }, BACKOFFICE_HEADERS);
        const data = result?.data;
        if (data?.success && data.user) {
            setMembers((m) => [...m, { id: data.user.id, name: data.user.name, isAdmin: false }]);
            Swal.fire({ title: 'Membre ajouté !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire('Erreur', data?.error || "Impossible d'ajouter le membre.", 'error');
        }
    };

    const renameMember = async (member: TMember) => {
        const { value: newName } = await Swal.fire({
            title: `Renommer ${member.name}`,
            input: 'text',
            inputValue: member.name,
            showCancelButton: true,
            confirmButtonText: 'Renommer',
            cancelButtonText: 'Annuler',
        });
        if (!newName || newName === member.name) return;
        const result = await AxiosWrapper.patch(`/api/user/${member.id}`, { user: { name: newName }, groupId: group.id }, BACKOFFICE_HEADERS);
        if (result?.data?.success) {
            setMembers((m) => m.map((m2) => (m2.id === member.id ? { ...m2, name: newName } : m2)));
            Swal.fire({ title: 'Renommé !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire('Erreur', result?.data?.error || 'Impossible de renommer.', 'error');
        }
    };

    const removeMember = async (member: TMember) => {
        const { isConfirmed } = await Swal.fire({
            title: `Supprimer ${member.name} ?`,
            text: 'Cette action est irréversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui',
            cancelButtonText: 'Non',
        });
        if (!isConfirmed) return;
        const result = await AxiosWrapper.delete(`/api/user/${member.id}`, undefined, BACKOFFICE_HEADERS);
        if (result?.data?.success) {
            setMembers((m) => m.filter((m2) => m2.id !== member.id));
        } else {
            Swal.fire('Erreur', result?.data?.error || 'Impossible de supprimer.', 'error');
        }
    };

    return (
        <div className="item">
            <div
                className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-3">
                    <span className={`text-indigo-400 transition-transform duration-200 text-xs ${expanded ? 'rotate-90' : ''}`}>▶</span>
                    <span className="font-semibold">{groupName}</span>
                    <span className="text-xs text-neutral-400">{group.createdAt ? new Date(group.createdAt).toLocaleString() : ''}</span>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <CustomButton onClick={renameGroup}>Renommer</CustomButton>
                    <CustomButton onClick={() => onRemove(group.id)}>Supprimer</CustomButton>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
                    {loading ? (
                        <p className="text-sm text-neutral-500">Chargement des membres…</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {members.length === 0 && (
                                <p className="text-sm text-neutral-400">Aucun membre</p>
                            )}
                            {members.map((member) => (
                                <div key={member.id} className="flex justify-between items-center">
                                    <span className="text-sm">
                                        {member.name}
                                        {member.isAdmin && (
                                            <span className="ml-2 text-xs text-rougeNoel font-medium">(admin)</span>
                                        )}
                                        {member.createdAt && (
                                            <span className="ml-2 text-xs text-neutral-400">{new Date(member.createdAt).toLocaleString()}</span>
                                        )}
                                    </span>
                                    <div className="flex gap-2">
                                        <CustomButton className="green-button" onClick={() => Router.push(`/giftList/${member.id}`)}>
                                            Voir liste
                                        </CustomButton>
                                        <CustomButton onClick={() => renameMember(member)}>Renommer</CustomButton>
                                        <CustomButton onClick={() => removeMember(member)}>Supprimer</CustomButton>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-1">
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

const Backoffice = ({ groups = [] }: { groups: Group[] }): JSX.Element => {
    useCurrentUser();

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [localGroups, setLocalGroups] = useState<Group[]>(groups);
    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');

    const showLoginModal = useCallback(async (): Promise<void> => {
        const { value: formValues, isDismissed } = await Swal.fire({
            title: 'Accès backoffice',
            html: `<input id="swal-login" class="swal2-input" placeholder="Identifiant" autocomplete="username">
                   <input id="swal-pass" class="swal2-input" type="password" placeholder="Mot de passe" autocomplete="current-password">`,
            confirmButtonText: 'Connexion',
            showCancelButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            focusConfirm: false,
            preConfirm: () => {
                const login = (document.getElementById('swal-login') as HTMLInputElement)?.value;
                const pass = (document.getElementById('swal-pass') as HTMLInputElement)?.value;
                if (!login || !pass) {
                    Swal.showValidationMessage('Identifiant et mot de passe requis');
                    return false;
                }
                return { login, pass };
            }
        });

        if (isDismissed || !formValues) {
            Router.push('/');
            return;
        }

        if (formValues.login === 'pierre' && formValues.pass === BACKOFFICE_SECRET) {
            sessionStorage.setItem(BACKOFFICE_SESSION_KEY, 'true');
            Router.push('/backoffice');
        } else {
            await Swal.fire({ title: 'Accès refusé', icon: 'error', text: 'Identifiants incorrects.' });
            showLoginModal();
        }
    }, []);

    useEffect(() => {
        if (sessionStorage.getItem(BACKOFFICE_SESSION_KEY) === 'true') {
            setIsAuthenticated(true);
            return;
        }
        showLoginModal();
    }, [showLoginModal]);

    if (!isAuthenticated) {
        return <></>;
    }

    const removeGroup = async (groupId: string): Promise<void> => {
        const swalWithBootstrapButtons = Swal.mixin({ buttonsStyling: true });

        swalWithBootstrapButtons
            .fire({
                title: 'Es-tu certain de vouloir supprimer tout le groupe?',
                text: 'Il ne sera pas possible de revenir en arrière!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Oui!',
                cancelButtonText: 'Non!',
                reverseButtons: true
            })
            .then(async (result) => {
                if (result.isConfirmed) {
                    const apiResult = await AxiosWrapper.delete(`/api/group/${groupId}`);
                    const data = apiResult?.data as TGroupApiResult;

                    if (data?.success) {
                        setLocalGroups((groups) => groups.filter((group) => group.id !== groupId));
                        swalWithBootstrapButtons.fire({ title: 'Supprimé !', icon: 'success', timer: 1500, showConfirmButton: false });
                    } else {
                        swalWithBootstrapButtons.fire({
                            title: 'Erreur',
                            text: data?.error || 'Impossible de supprimer ce groupe. Réessayez dans quelques instants.',
                            icon: 'error'
                        });
                    }
                }
            });
    };

    const addGroup = async (): Promise<void> => {
        const groupToAdd: Group = buildDefaultGroup();
        groupToAdd.name = newGroupName;
        groupToAdd.adminPassword = newPassword;

        const result = await AxiosWrapper.post('/api/group', { group: groupToAdd }, { 'x-backoffice-secret': BACKOFFICE_SECRET });
        const data = result?.data as TGroupApiResult;

        if (data && data.success && data.group) {
            setLocalGroups((value) => [...value, data.group!]);
            clearAllFields();
        } else {
            Swal.fire({
                title: 'Erreur',
                text: data?.error || 'Impossible de créer ce groupe. Réessayez dans quelques instants.',
                icon: 'error'
            });
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

    const logoutBackoffice = (): void => {
        sessionStorage.removeItem(BACKOFFICE_SESSION_KEY);
        Router.push('/home');
    };

    return (
        <Layout selectedHeader={EHeader.Backoffice}>
            <div className="mb-10">
                <div className="flex justify-between items-center pb-5">
                    <h1>Backoffice</h1>
                    <button
                        onClick={logoutBackoffice}
                        className="text-white text-sm bg-rougeNoel/80 hover:bg-rougeNoel px-3 py-1.5 rounded transition-colors"
                    >
                        Se déconnecter
                    </button>
                </div>

                <h2 className="pb-3">Groupes:</h2>

                {localGroups.map((group) => (
                    <GroupRow
                        key={group.id}
                        group={group}
                        onRemove={removeGroup}
                        onRename={(id, newName) => setLocalGroups((gs) => gs.map((g) => (g.id === id ? { ...g, name: newName } : g)))}
                    />
                ))}

                {!creatingGroup && (
                    <CustomButton className="green-button mt-2" onClick={onCreatingGroupButtonClick}>
                        Ajouter
                    </CustomButton>
                )}

                {creatingGroup && (
                    <div className='item'>
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
                        <CustomButton onClick={addGroup}>Add</CustomButton>
                        <CustomButton onClick={clearAllFields}>Cancel</CustomButton>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export async function getServerSideProps() {
    const groups = await getGroups();

    return {
        props: {
            groups: groups.map((group) => ({
                ...group,
                updatedAt: group.updatedAt?.toISOString() ?? '',
                createdAt: group.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default Backoffice;
