import { atom } from 'jotai';

export type TToaster = {
    message: string;
    type: 'information' | 'error' | 'warning';
    show: boolean;
    response?: boolean;
};

export const defaultToaster: TToaster = {
    message: '',
    type: 'information',
    show: false,
    response: false
};

export const toasterAtom = atom<TToaster>(defaultToaster);
