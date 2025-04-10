'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "./action/getuser";
import { logout } from "./auth/auth";
import Navbar from "./component/navbar";
import Sidebar from "./component/sidebar";

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
    <div className="overflow-hidden h-screen">
      {user && (
        <div className="h-full w-11/12 justify-center m-auto">
          {/* Navbar */}
          <Navbar />

          <div className="flex flex-col lg:flex-row">
            {/* Sidebar */}
            <Sidebar />

            <div className="bg-white w-3/4 lg:w-1/4 m-auto mt-8 p-5 rounded-xl">
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
        </div>
      )}
    </div>
  );
}