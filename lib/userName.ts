// Lettres, chiffres ; espace, tiret ou apostrophe uniquement entre deux mots
const USER_NAME_REGEX = /^[\p{L}\p{M}\p{N}]+(?:[ '’-][\p{L}\p{M}\p{N}]+)*$/u;

export const INVALID_USER_NAME_MESSAGE = 'Le prénom ne peut contenir que des lettres, chiffres, espaces, tirets et apostrophes.';

export const isValidUserName = (name: string): boolean => USER_NAME_REGEX.test(name.trim());
