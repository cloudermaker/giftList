export type TUserGift = {
    id: string;
    name: string;
    url: string;
    description: string;

    owner_user_id: string;
    taken_user_id?: string;
};
