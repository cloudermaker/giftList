import Link from "next/link"
import Router from "next/router";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket, faHomeUser } from '@fortawesome/free-solid-svg-icons'

export enum EHeader {
    Homepage = 'Homepage',
    Family = 'My family',
    GiftList = 'My gift list',
    Backoffice = 'Backoffice',
}

export const CustomHeader = ({ selectedHeader = EHeader.Homepage, groupId, userId, onDisconnectClick }: { selectedHeader?: EHeader; groupId: string; userId: string; onDisconnectClick: () => void }): JSX.Element => {
    const commonStyle = "text-neutral-500 mx-2 hover:text-neutral-800 hover:cursor-pointer";

    return (
        <div className="pb-5 text-xl">
            <div className="flex justify-between mx-4">
                <Link href="/home" className={`${commonStyle} ${selectedHeader === EHeader.Homepage ? 'font-bold' : ''}`}>
                    <FontAwesomeIcon icon={faHomeUser} />
                </Link>

                <span onClick={() => Router.push(`/family/${groupId}`)} className={`${commonStyle} ${selectedHeader === EHeader.Family ? 'font-bold' : ''}`}>Ma famille</span>

                <span onClick={() => Router.push(`/giftList/${userId}`)} className={`${commonStyle} ${selectedHeader === EHeader.GiftList ? 'font-bold' : ''}`}>Ma liste de cadeaux</span>

                <div className={commonStyle} onClick={onDisconnectClick}>
                    <FontAwesomeIcon icon={faRightFromBracket} />
                </div>
            </div>

            <hr />
        </div>
    )
}