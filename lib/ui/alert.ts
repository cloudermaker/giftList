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
