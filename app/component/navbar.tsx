'use client'
import Link from "next/link"
import { useEffect, useState } from "react"
import { getUserData } from "../action/getuser"

export default function Navbar() {
    const [userData, setUserData] = useState<any>(null)

    // Get user data
    useEffect(() => {
        getUserData().then((res: any) => {
            if (res) {
                setUserData(res)
            }
        })
    }, [])

    return (
        <div className="bg-[#203D4F] w-3/4 lg:w-1/2 m-auto mt-8 p-5 rounded-3xl hover:shadow-[0px_0px_40px_5px_rgba(32,61,79,1)] transition-all duration-300 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="h-10 w-10 mr-3 ml-2" />
                <Link href="/" className="text-[#57CC99] text-xl font-bold">UpMath</Link>
            </div>

            <div className="mr-3">
                <p className="text-[#57CC99]">{userData?.t_username}</p>
            </div>
        </div>
    )
}