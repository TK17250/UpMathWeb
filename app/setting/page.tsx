'use client';
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { getUser, getUserData } from "@/app/action/getuser";
import { logout } from "@/app/auth/auth";
import Navbar from "@/app/component/navbar";
import Sidebar from "@/app/component/sidebar";
import Footer from "@/app/component/footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import ConfirmationModal from "../component/modal1";
import { updatePassword, updateSetting } from "../action/setting";
import Alert1, { AlertType } from "../component/alert1"
import ConfirmationModal2 from "../component/modal2";

const Alert = {
    title: "",
    message: "",
    type: "",
}

export default function Setting() {
    const [user, setUser] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showSaveNewPasswordModal, setShowSaveNewPasswordModal] = useState(false);
    const [action, formData] = useActionState(updateSetting, Alert);
    const [actionPassword, formPasswordData] = useActionState(updatePassword, Alert);
    const formRef = useRef<HTMLFormElement>(null);
    const formPasswordRef = useRef<HTMLFormElement>(null);

    // Data
    const [fullname, setFullname] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [gender, setGender] = useState<string>("");
    const [age, setAge] = useState<number>(0);

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

        // Set user data
        getUserData().then((res: any) => {
            setFullname(res?.t_fullname);
            setUsername(res?.t_username);
            setEmail(res?.t_email);
            setGender(res?.t_gender);
            setAge(res?.t_age);
        })
    }, [])

    // Show alert when action is completed
    useEffect(() => {
        if (action && action.title && action.message && action.type && window.showAlert) {
            window.showAlert(action.title, action.message, action.type as AlertType);
        }

        if (actionPassword && actionPassword.title && actionPassword.message && actionPassword.type && window.showAlert) {
            window.showAlert(actionPassword.title, actionPassword.message, actionPassword.type as AlertType);
        }
    }, [action, actionPassword]);

    // Handle for logout
    const handleLogout = async () => {
        logout().then((res: any) => {
            if (res) {
                router.push("/login");
            }
        });
    };

    // Handle for save form
    const handleSaveForm = () => {
        if (formRef.current) {
            formRef.current.requestSubmit();
        }
        setShowSaveModal(false);
    };

    // Handle for save new password
    const handleSaveNewPasswordForm = () => {
        if (formPasswordRef.current) {
            formPasswordRef.current.requestSubmit();
        }
        setShowSaveNewPasswordModal(false);
    }
    
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {user && (
                <div className="flex flex-col h-full w-11/12 mx-auto">
                    {/* Navbar */}
                    <Navbar />

                    {/* Alert */}
                    <Alert1 />

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
                                <form ref={formRef} action={formData} className="mt-4 md:mt-5 space-y-4 md:space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                        {/* Full name */}
                                        <div>
                                            <label htmlFor="fullname" className="text-white font-bold text-sm/6">ชื่อ-นามสกุล</label>
                                            <input
                                                id="fullname"
                                                name="fullname"
                                                type="text"
                                                required
                                                autoComplete="off"
                                                placeholder="ชื่อ-นามสกุล"
                                                className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                                value={fullname}
                                                onChange={(e) => setFullname(e.target.value)}
                                            />
                                        </div>

                                        {/* Name */}
                                        <div>
                                            <label htmlFor="name" className="text-white font-bold text-sm/6">ชื่อเล่น</label>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                autoComplete="off"
                                                placeholder="ชื่อเล่น"
                                                className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label htmlFor="email" className="text-white font-bold text-sm/6">อีเมล</label>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                autoComplete="off"
                                                placeholder="อีเมล"
                                                className="block w-full rounded-md bg-[#002c4a5b] px-3 py-1.5 text-[#9f9f9f] border-2 outline-none border-[#002c4a5b] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled
                                            />
                                        </div>

                                        {/* Gender & Age */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Gender */}
                                            <div>
                                                <label htmlFor="gender" className="text-white font-bold text-sm/6">เพศ</label>
                                                <select
                                                    name="gender"
                                                    id="gender"
                                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                                    required
                                                    defaultValue={gender}
                                                    onChange={(e) => setGender(e.target.value)}
                                                >
                                                    <option value={gender} hidden>{gender}</option>
                                                    <option value="male">ชาย</option>
                                                    <option value="female">หญิง</option>
                                                    <option value="lgbtqia">LGBTQIA+</option>
                                                    <option value="other">อื่นๆ</option>
                                                </select>
                                            </div>

                                            {/* Age */}
                                            <div>
                                                <label htmlFor="age" className="text-white font-bold text-sm/6">อายุ</label>
                                                <input
                                                    id="age"
                                                    name="age"
                                                    type="number"
                                                    required
                                                    autoComplete="off"
                                                    placeholder="อายุ"
                                                    className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-white border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                                                    value={age.toString()}
                                                    min={1}
                                                    onChange={(e) => setAge(parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-start md:justify-start">
                                        <button
                                            type="submit"
                                            className="rounded-md bg-[#203D4F] px-6 md:px-10 py-1.5 text-sm/6 text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowSaveModal(true);
                                            }}
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
                                <form action={formPasswordData} ref={formPasswordRef} className="mt-4 md:mt-5 space-y-4 md:space-y-6">
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
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowSaveNewPasswordModal(true);
                                            }}
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
                                        setShowLogoutModal(true);
                                    }}>
                                    ออกจากระบบ
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <Footer />

                    {/* Show Modal */}
                    {showLogoutModal && (
                        <ConfirmationModal 
                            open={showLogoutModal}
                            setOpen={setShowLogoutModal}
                            onConfirm={handleLogout}
                            title="ยืนยันการออกจากระบบ"
                            message="คุณต้องการออกจากระบบใช่หรือไม่? คุณจะต้องเข้าสู่ระบบใหม่เพื่อเข้าถึงบัญชีของคุณอีกครั้ง"
                            confirmButtonText="ออกจากระบบ"
                            cancelButtonText="ยกเลิก"
                        />
                    )}

                    {showSaveModal && (
                        <ConfirmationModal2 
                            open={showSaveModal}
                            setOpen={setShowSaveModal}
                            onConfirm={handleSaveForm}
                            title="ยืนยันการบันทึกข้อมูล"
                            message="คุณต้องการบันทึกข้อมูลที่แก้ไขใช่หรือไม่?"
                            confirmButtonText="บันทึก"
                            cancelButtonText="ยกเลิก"
                        />
                    )}

                    {showSaveNewPasswordModal && (
                        <ConfirmationModal2 
                            open={showSaveNewPasswordModal}
                            setOpen={setShowSaveNewPasswordModal}
                            onConfirm={handleSaveNewPasswordForm}
                            title="ยืนยันการบันทึกรหัสผ่านใหม่"
                            message="คุณต้องการบันทึกรหัสผ่านใหม่ใช่หรือไม่?"
                            confirmButtonText="บันทึก"
                            cancelButtonText="ยกเลิก"
                        />
                    )}
                </div>
            )}
        </div>
    );
}