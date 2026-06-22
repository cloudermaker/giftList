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
import { GetServerSidePropsContext } from 'next';

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
        const result = await AxiosWrapper.patch(`/api/group/${group.id}`, { group: { name: newName } });
        if (result?.data?.success) {
            setGroupName(newName);
            onRename(group.id, newName);
            Swal.fire({ title: 'Renommé !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire('Erreur', result?.data?.error || 'Impossible de renommer le groupe.', 'error');
        }
    };

    const changePassword = async () => {
        const { value: newPwd } = await Swal.fire({
            title: 'Changer le mot de passe',
            input: 'password',
            inputPlaceholder: 'Nouveau mot de passe',
            showCancelButton: true,
            confirmButtonText: 'Enregistrer',
            cancelButtonText: 'Annuler',
            inputValidator: (v) => (!v ? 'Le mot de passe ne peut pas être vide.' : null),
        });
        if (!newPwd) return;
        const result = await AxiosWrapper.patch(`/api/group/${group.id}`, { group: { adminPassword: newPwd } });
        if (result?.data?.success) {
            Swal.fire({ title: 'Mot de passe mis à jour !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire('Erreur', result?.data?.error || 'Impossible de changer le mot de passe.', 'error');
        }
    };

    const toggleRole = async (member: TMember) => {
        const newRole = member.isAdmin ? 'MEMBER' : 'ADMIN';
        if (member.isAdmin && members.filter((m) => m.isAdmin).length <= 1) {
            Swal.fire('Impossible', 'Il doit rester au moins un administrateur dans le groupe.', 'warning');
            return;
        }
        const result = await AxiosWrapper.patch('/api/userGroup', { userId: member.id, groupId: group.id, role: newRole });
        if (result?.data?.success) {
            setMembers((m) => m.map((m2) => (m2.id === member.id ? { ...m2, isAdmin: !m2.isAdmin } : m2)));
        } else {
            Swal.fire('Erreur', result?.data?.error || 'Impossible de modifier le rôle.', 'error');
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
        const result = await AxiosWrapper.post('/api/user', { user: { name }, groupId: group.id });
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
        const result = await AxiosWrapper.patch(`/api/user/${member.id}`, { user: { name: newName }, groupId: group.id });
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
        const result = await AxiosWrapper.delete(`/api/user/${member.id}`);
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
                    <span className="hidden md:inline text-xs text-neutral-400">{group.createdAt ? new Date(group.createdAt).toLocaleString() : ''}</span>
                </div>
                <div className="flex gap-0.5 md:gap-2" onClick={(e) => e.stopPropagation()}>
                    <CustomButton className="icon-btn md:hidden" onClick={renameGroup}>✏️</CustomButton>
                    <CustomButton className="hidden md:inline-flex" onClick={renameGroup}>Renommer</CustomButton>
                    <CustomButton className="icon-btn md:hidden" onClick={changePassword}>🔑</CustomButton>
                    <CustomButton className="hidden md:inline-flex" onClick={changePassword}>Mot de passe</CustomButton>
                    <CustomButton className="icon-btn md:hidden" onClick={() => onRemove(group.id)}>🗑️</CustomButton>
                    <CustomButton className="hidden md:inline-flex" onClick={() => onRemove(group.id)}>Supprimer</CustomButton>
                </div>
            </div>

            {expanded && (
                <div className="bg-neutral-50 px-4 py-3 mx-3 mb-3 rounded-lg border border-neutral-200">
                    {loading ? (
                        <p className="text-sm text-neutral-500">Chargement des membres…</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {members.length === 0 && (
                                <p className="text-sm text-neutral-400">Aucun membre</p>
                            )}
                            {members.map((member, index) => (
                                <div key={member.id} className={`flex justify-between items-center ${index > 0 ? 'border-t border-neutral-200 pt-2' : ''}`}>
                                    <span className="text-sm">
                                        {member.name}
                                        {member.isAdmin && (
                                            <span className="ml-2 text-xs text-rougeNoel font-medium">(admin)</span>
                                        )}
                                        {member.createdAt && (
                                            <span className="hidden md:inline ml-2 text-xs text-neutral-400">{new Date(member.createdAt).toLocaleString()}</span>
                                        )}
                                    </span>
                                    <div className="flex gap-0.5 md:gap-2">
                                        <CustomButton className="icon-btn md:hidden" onClick={() => Router.push(`/giftList/${member.id}`)}>👁</CustomButton>
                                        <CustomButton className="green-button hidden md:inline-flex" onClick={() => Router.push(`/giftList/${member.id}`)}>Voir liste</CustomButton>
                                        <CustomButton className="icon-btn md:hidden" onClick={() => renameMember(member)}>✏️</CustomButton>
                                        <CustomButton className="hidden md:inline-flex" onClick={() => renameMember(member)}>Renommer</CustomButton>
                                        <CustomButton className="icon-btn md:hidden" onClick={() => toggleRole(member)}>{member.isAdmin ? '⬇️' : '⭐'}</CustomButton>
                                        <CustomButton className="hidden md:inline-flex" onClick={() => toggleRole(member)}>{member.isAdmin ? 'Rétrograder' : 'Promouvoir'}</CustomButton>
                                        <CustomButton className="icon-btn md:hidden" onClick={() => removeMember(member)}>🗑️</CustomButton>
                                        <CustomButton className="hidden md:inline-flex" onClick={() => removeMember(member)}>Supprimer</CustomButton>
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

const Backoffice = ({ groups = [], isAuthenticated: initialAuth = false }: { groups: Group[]; isAuthenticated: boolean }): JSX.Element => {
    const [isAuthenticated] = useState<boolean>(initialAuth);
    const [localGroups, setLocalGroups] = useState<Group[]>(groups);
    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');

    const showLoginModal = useCallback(async (): Promise<void> => {
        while (true) {
            const { value: formValues, isDismissed } = await Swal.fire({
                title: 'Accès backoffice',
                html: `<input id="swal-login" class="swal2-input" placeholder="Identifiant" autocomplete="username">
                       <input id="swal-pass" class="swal2-input" type="password" placeholder="Mot de passe" autocomplete="current-password">`,
                confirmButtonText: 'Connexion',
                showCancelButton: true,
                showCloseButton: false,
                allowOutsideClick: true,
                icon: "question",
                allowEscapeKey: true,
                focusConfirm: true,
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

            const result = await AxiosWrapper.post('/api/backoffice/auth', { login: formValues.login, pass: formValues.pass });
            if (result?.status === 200) {
                Router.push('/backoffice');
                return;
            }

            await Swal.fire({ title: 'Accès refusé', icon: 'error', text: 'Identifiants incorrects.' });
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

        const result = await AxiosWrapper.post('/api/group', { group: groupToAdd });
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

    const logoutBackoffice = async (): Promise<void> => {
        await AxiosWrapper.delete('/api/backoffice/auth');
        Router.push('/');
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const isAuthenticated = context.req.cookies['backoffice_session'] === '1';

    if (!isAuthenticated) {
        return { props: { groups: [], isAuthenticated: false } };
    }

    const groups = await getGroups();

    return {
        props: {
            isAuthenticated: true,
            groups: groups.map((group) => ({
                ...group,
                updatedAt: group.updatedAt?.toISOString() ?? '',
                createdAt: group.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default Backoffice;
