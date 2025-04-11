'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "@/app/action/getuser";
import { logout } from "@/app/auth/auth";
import Navbar from "@/app/component/navbar";
import Sidebar from "@/app/component/sidebar";
import Footer from "@/app/component/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"

export default function Setting() {
    const [user, setUser] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);

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
        <div className="h-screen flex flex-col overflow-hidden">
            {user && (
                <div className="flex flex-col h-full w-11/12 mx-auto">
                    {/* Navbar */}
                    <Navbar />

                    <div className="flex flex-grow flex-col lg:flex-row overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-full lg:w-auto lg:flex-shrink-0">
                            <Sidebar />
                        </div>

                        {/* Content */}
                        <div className="flex-grow lg:flex-grow-0 lg:w-4/5 bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 lg:ml-4 rounded-xl border-4 border-[#203D4F] p-3 md:p-5 overflow-y-auto">
                            {/* Account Section */}
                            <section className="mb-8">
                                {/* Title */}
                                <div className="flex w-full justify-between items-center">
                                    <h2 className="text-white font-bold text-xl md:text-2xl">บัญชี</h2>
                                </div>
                                <hr className="border-[#CCCCCC] mt-2 md:mt-3" />

                                {/* Form */}
                                <form className="mt-4 md:mt-5 space-y-4 md:space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                        {/* Full name */}
                                        <div>
                                            <input
                                                id="fullname"
                                                name="fullname"
                                                type="text"
                                                required
                                                autoComplete="off"
                                                placeholder="ชื่อ-นามสกุล"
                                                className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                            />
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                autoComplete="off"
                                                placeholder="ชื่อเล่น"
                                                className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                autoComplete="off"
                                                placeholder="อีเมล"
                                                className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                            />
                                        </div>

                                        {/* Gender & Age */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Gender */}
                                            <div>
                                                <select
                                                    name="gender"
                                                    id="gender"
                                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                                    required
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled hidden>เพศ</option>
                                                    <option value="male">ชาย</option>
                                                    <option value="female">หญิง</option>
                                                    <option value="lgbtqia">LGBTQIA+</option>
                                                    <option value="other">อื่นๆ</option>
                                                </select>
                                            </div>

                                            {/* Age */}
                                            <div>
                                                <input
                                                    id="age"
                                                    name="age"
                                                    type="number"
                                                    required
                                                    autoComplete="off"
                                                    placeholder="อายุ"
                                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-start md:justify-start">
                                        <button
                                            type="submit"
                                            className="rounded-md bg-[#203D4F] px-6 md:px-10 py-1.5 text-sm/6 text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300"
                                        >
                                            บันทึก
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* Password Section */}
                            <section className="mb-8">
                                {/* Title */}
                                <div className="flex w-full justify-between items-center">
                                    <h2 className="text-white font-bold text-xl md:text-2xl">รหัสผ่าน</h2>
                                </div>
                                <hr className="border-[#CCCCCC] mt-2 md:mt-3" />

                                {/* Form */}
                                <form className="mt-4 md:mt-5 space-y-4 md:space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                        {/* Old Password */}
                                        <div className="relative">
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                placeholder="รหัสผ่าน"
                                                autoComplete="off"
                                                className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                            />
                                            <FontAwesomeIcon 
                                                icon={showPassword ? faEye : faEyeSlash} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                            />
                                        </div>

                                        {/* New Password */}
                                        <div className="relative">
                                            <input
                                                id="newpassword"
                                                name="newpassword"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                placeholder="รหัสผ่านใหม่"
                                                autoComplete="off"
                                                className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                            />
                                            <FontAwesomeIcon 
                                                icon={showPassword ? faEye : faEyeSlash} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                            />
                                        </div>

                                        {/* Confirm new password */}
                                        <div className="relative md:col-span-2 lg:col-span-1">
                                            <input
                                                id="confirmpassword"
                                                name="confirmpassword"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                placeholder="ยืนยันรหัสผ่านใหม่"
                                                autoComplete="off"
                                                className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                            />
                                            <FontAwesomeIcon 
                                                icon={showPassword ? faEye : faEyeSlash} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-start md:justify-start">
                                        <button
                                            type="submit"
                                            className="rounded-md bg-[#203D4F] px-6 md:px-10 py-1.5 text-sm/6 text-white font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:bg-[#002D4A] hover:text-[#80ED99] transition-all duration-300"
                                        >
                                            บันทึกรหัสผ่านใหม่
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* Account Actions */}
                            <div className="flex flex-wrap gap-3">
                                {/* Delete account */}
                                <button
                                    className="bg-[#203D4F] border-2 border-[#EF4444] hover:border-red-500 transition-all duration-300 text-white px-4 md:px-6 py-2 rounded-md cursor-pointer text-sm">
                                    ลบบัญชี
                                </button>

                                {/* Logout */}
                                <button 
                                    className="bg-[#EF4444] hover:bg-red-500 transition-all duration-300 text-white px-4 md:px-6 py-2 rounded-md cursor-pointer text-sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        logout().then((res: any) => {
                                            if (res) {
                                                router.push("/login")
                                            }
                                        })
                                    }}>
                                    ออกจากระบบ
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <Footer />
                </div>
            )}
        </div>
    );
}