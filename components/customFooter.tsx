import Link from "next/link"

export const CustomFooter = (): JSX.Element => {
    return (
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gray-200">
            <div className="mx-10 flex justify-between h-full items-center">
                <Link href="mailto:pierre.lerendu@gmail.com">Contact us</Link>

                <span>All right reserved by PLR @2022</span>
            </div>
        </div>
    )
}