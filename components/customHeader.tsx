import Link from "next/link"

export enum EHeader {
    Homepage = 'Homepage',
    Family = 'My family',
    GiftList = 'My gift list',
    Backoffice = 'Backoffice',
}

export const CustomHeader = ({ selectedHeader = EHeader.Homepage }: { selectedHeader?: EHeader }): JSX.Element => {
    const commonStyle = "text-neutral-500 mx-2 hover:text-neutral-800";

    return (
        <div className="pb-5">
            <div className="flex justify-around">
                <Link href="/home" className={`${commonStyle} ${selectedHeader === EHeader.Homepage ? 'font-bold' : ''}`}>Homepage</Link>

                <Link href="/family" className={`${commonStyle} ${selectedHeader === EHeader.Family ? 'font-bold' : ''}`}>Family</Link>

                <Link href="/gift_list" className={`${commonStyle} ${selectedHeader === EHeader.GiftList ? 'font-bold' : ''}`}>My gift list</Link>

                <Link href="/backoffice" className={`${commonStyle} ${selectedHeader === EHeader.Backoffice ? 'font-bold' : ''}`}>Backoffice</Link>
            </div>

            <hr />
        </div>
    )
}