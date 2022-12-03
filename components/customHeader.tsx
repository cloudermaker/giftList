import Link from "next/link"

export const CustomHeader = (): JSX.Element => {
    const commonStyle = "text-neutral-500 mx-2 hover:text-neutral-800";

    return (
        <div className="pb-5">
            <div className="flex justify-around">
                <Link href="/home" className={commonStyle}>Homepage</Link>

                <Link href="/family" className={commonStyle}>Family</Link>

                <Link href="/gift_list" className={commonStyle}>My gift list</Link>

                <Link href="/backoffice" className={commonStyle}>Backoffice</Link>
            </div>

            <hr />
        </div>
    )
}