import type Swal from 'sweetalert2';

type SwalModule = typeof Swal;

let cached: SwalModule | null = null;

// sweetalert2 chargé à la demande : ~40 kB gz hors du bundle initial
export const getSwal = async (): Promise<SwalModule> => {
    if (!cached) cached = (await import('sweetalert2')).default;
    return cached;
};

export const toast = async (title: string, icon: 'success' | 'error' | 'info' = 'success'): Promise<void> => {
    await (await getSwal()).fire({ title, icon, timer: 1500, showConfirmButton: false });
};

export const alertError = async (title: string, text?: string): Promise<void> => {
    await (await getSwal()).fire({ title, text, icon: 'error' });
};

export const confirmDestructive = async ({
    title,
    text,
    confirmText = 'Oui!',
    cancelText = 'Non!'
}: {
    title: string;
    text?: string;
    confirmText?: string;
    cancelText?: string;
}): Promise<boolean> => {
    const result = await (
        await getSwal()
    ).fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true
    });
    return result.isConfirmed;
};

const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Connexion sans email : le nom du groupe et le prénom sont la seule clé d'accès
export const rememberAccessPopup = async (groupName: string, userName: string): Promise<void> => {
    await (
        await getSwal()
    ).fire({
        title: '📝 Note bien ces infos',
        html: `<p>Sans email, ce sont tes seules clés pour revenir :</p>
<p style="margin-top:12px">Groupe : <b>${escapeHtml(groupName)}</b><br>Prénom : <b>${escapeHtml(userName)}</b></p>
<p style="margin-top:12px;font-size:14px;color:#6b7280">Astuce : tu pourras ajouter un email plus tard depuis ton profil 👤</p>`,
        icon: 'info',
        confirmButtonText: "C'est noté"
    });
};

export const checkInboxPopup = async (email: string): Promise<void> => {
    await (
        await getSwal()
    ).fire({
        title: '📧 Vérifie ta boîte mail',
        html: `<p>Un lien de confirmation a été envoyé à <b>${escapeHtml(email)}</b>.</p>
<p style="margin-top:12px;font-size:14px;color:#6b7280">Clique dessus pour pouvoir retrouver ton accès en cas d'oubli.</p>`,
        icon: 'success',
        confirmButtonText: 'OK'
    });
};

export const promptText = async ({
    title,
    placeholder,
    initialValue,
    confirmText = 'Valider',
    cancelText = 'Annuler'
}: {
    title: string;
    placeholder?: string;
    initialValue?: string;
    confirmText?: string;
    cancelText?: string;
}): Promise<string | null> => {
    const { value } = await (
        await getSwal()
    ).fire({
        title,
        input: 'text',
        inputPlaceholder: placeholder,
        inputValue: initialValue,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText
    });
    return value || null;
};
