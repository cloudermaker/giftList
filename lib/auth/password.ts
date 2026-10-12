import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Module serveur uniquement (crypto natif) : ne jamais l'importer depuis du code exécuté dans le navigateur
const scrypt = (password: string, salt: Buffer, keylen: number): Promise<Buffer> =>
    (promisify(scryptCb) as (p: string, s: Buffer, k: number) => Promise<Buffer>)(password, salt, keylen);

const PREFIX = 'scrypt$';
const KEY_LENGTH = 64;

export const isHashed = (stored: string): boolean => stored.startsWith(PREFIX);

// Format stocké : scrypt$<sel base64url>$<empreinte base64url> ; mot de passe vide = pas d'accès admin
export const hashPassword = async (password: string): Promise<string> => {
    if (!password) return '';
    const salt = randomBytes(16);
    const hash = await scrypt(password, salt, KEY_LENGTH);
    return `${PREFIX}${salt.toString('base64url')}$${hash.toString('base64url')}`;
};

// Accepte aussi les anciens mots de passe en clair (convertis à la connexion suivante)
export const verifyPassword = async (stored: string, candidate: string): Promise<boolean> => {
    if (!stored || !candidate) return false;
    if (!isHashed(stored)) {
        const a = Buffer.from(stored);
        const b = Buffer.from(candidate);
        return a.length === b.length && timingSafeEqual(a, b);
    }
    const [saltB64, hashB64] = stored.slice(PREFIX.length).split('$');
    if (!saltB64 || !hashB64) return false;
    const expected = Buffer.from(hashB64, 'base64url');
    if (expected.length !== KEY_LENGTH) return false;
    const actual = await scrypt(candidate, Buffer.from(saltB64, 'base64url'), KEY_LENGTH);
    return timingSafeEqual(expected, actual);
};
