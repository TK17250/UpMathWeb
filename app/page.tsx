'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "./action/getuser";
import { logout } from "./action/auth";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  // Check login
  const router = useRouter();
  useEffect(() => {
    getUser().then((res: any) => {
      if (!res) {
        router.push("/login")
      }
    })
  }, [router])

  // Get user
  useEffect(() => {
    getUser().then((res: any) => {
      if (res) {
        setUser(res);
      }
    })
  }, [])

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-scroll h-screen">
      {/* Box */}
      <div className="bg-gray-100 p-8 rounded-lg shadow-md w-1/4 m-auto">
        <p className="text-center">สวัสดี {user?.email}</p>
        <button className="bg-red-700 text-white px-4 py-2 rounded mt-4 w-full cursor-pointer" 
          onClick={(e) => {
            e.preventDefault();
            logout().then((res: any) => {
              if (res) {
                router.push("/login")
              }
            })
          }}>ออกจากระบบ</button>
      </div>

    </div>
  );
}