export type TUserGift = {
    id: string;
    name: string;
    url: string;
    description: string;
    position: number;

    owner_user_id: string;
    taken_user_id?: string;
};
