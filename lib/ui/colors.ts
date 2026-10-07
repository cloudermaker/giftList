// Palette avatar partagée (home, takenGiftList)
export const AVATAR_COLORS = [
    { bg: '#fde8e6', text: '#c0392b' },
    { bg: '#e8f2ec', text: '#4a7c59' },
    { bg: '#e8edf5', text: '#4a6fa5' },
    { bg: '#fef3cd', text: '#b8860b' },
    { bg: '#f0ebf8', text: '#7b5ea7' },
    { bg: '#e6f3f5', text: '#2e7d8a' }
];

export const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
