import { TGift } from "./gift";

export type TFamilyMember = {
    id: number;
    name: string;

    wantedGifts: TGift[];
}

export type TFamily = {
    id: number;
    name: string;

    familyMembers?: TFamilyMember[];
}