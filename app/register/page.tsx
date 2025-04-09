'use client'
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import { register } from "../action/auth"
import Alert1, { AlertType } from "../component/alert1"

const Alert = {
    title: "",
    message: "",
    type: "",
}

export default function Login() {
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [action, formAction] = useActionState(register, Alert)

    // Show alert when action is completed
    useEffect(() => {
        if (action && action.title && action.message && action.type && window.showAlert) {
            window.showAlert(action.title, action.message, action.type as AlertType);
        }
    }, [action]);

    return (
        <>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-scroll h-screen">
                {/* Alert */}
                <Alert1 />

                {/* Logo */}
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mb-6 text-center text-3xl/9 font-bold tracking-tight text-[#57CC99]">
                        สมัครสมาชิก <span className="text-[#CCCCCC] text-lg">สำหรับคุณครู</span>
                    </h2>
                    <img
                        alt="logo"
                        src="./logo.png"
                        className="mx-auto h-40 w-auto border-4 border-[#002D4A] rounded-4xl"
                    />
                </div>

                <div className="sm:mx-auto sm:w-full sm:max-w-[480px] p-8">
                    <form action={formAction} method="POST" className="space-y-6">
                        {/* Full name */}
                        <div>
                            <div className="mt-2">
                                <input
                                    id="fullname"
                                    name="fullname"
                                    type="text"
                                    required
                                    autoComplete="off"
                                    placeholder="ชื่อ-นามสกุล"
                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <div className="mt-2">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    autoComplete="off"
                                    placeholder="ชื่อเล่น"
                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="off"
                                    placeholder="อีเมล"
                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                />
                            </div>
                        </div>

                        {/* Gender & Age */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Gender */}
                            <div>
                                <select
                                    name="gender"
                                    id="gender"
                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
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
                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="mt-2 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="รหัสผ่าน"
                                    autoComplete="off"
                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                />

                                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                            </div>
                        </div>

                        {/* Confirm password */}
                        <div>
                            <div className="mt-2 relative">
                                <input
                                    id="confirmpassword"
                                    name="confirmpassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="ยืนยันรหัสผ่าน"
                                    autoComplete="off"
                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                />

                                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                            </div>
                        </div>

                        {/* Remember me and Forgot password */}
                        <div className="flex items-center justify-between">
                            {/* Submit */}
                            <div>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-md bg-[#203D4F] px-10 py-1.5 text-sm/6 text-[#80ED99] font-bold shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 border-[#002D4A]  border-2 hover:border-[#80ED99] transition-all duration-300"
                                >
                                    เข้าสู่ระบบ
                                </button>
                            </div>

                            {/* Sign in */}
                            <div className="text-sm/6">
                                <Link href="/login" className="font-semibold text-white hover:text-[#CCCCCC] transition-all duration-300">
                                    มีบัญชีอยู่แล้ว?
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}