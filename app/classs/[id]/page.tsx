'use client';
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { getUser } from "@/app/action/getuser";
import Navbar from "@/app/component/navbar";
import Sidebar from "@/app/component/sidebar";
import Footer from "@/app/component/footer";
import Alert1, { AlertType } from "../../component/alert1";
import { deleteClass, getClassBanner, getClassDataById, updateClassData } from "../../action/class";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import UpdateClassModal from "./form_modal";
import DeleteClassModal from "./delete_modal";

// Define TypeScript interfaces
interface AlertState {
    title: string;
    message: any;
    type: string;
}

// Declare window with showAlert method for TypeScript
declare global {
    interface Window {
        showAlert?: (title: string, message: string, type: AlertType) => void;
    }
}

interface ClassData {
    c_id: number;
    c_name: string;
    c_tid: string;
    c_temail: string;
    c_homework: Record<string, HomeworkItem>;
    c_medias: Record<string, MediaItem>;
    c_students: Record<string, StudentItem>;
    c_banner: string;
}

interface HomeworkItem {
    title: string;
    description: string;
    [key: string]: any;
}

interface MediaItem {
    title: string;
    description: string;
    [key: string]: any;
}

interface StudentItem {
    name?: string;
    email?: string;
    [key: string]: any;
}

interface UserData {
    t_id: string;
    t_email: string;
    [key: string]: any;
}

const Alert: AlertState = {
    title: "",
    message: "",
    type: "",
}

export default function Class() {
    const [user, setUser] = useState<UserData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [action, formAction] = useActionState(updateClassData, Alert);
    const [deleteAction, setDeleteAction] = useActionState(deleteClass, Alert);
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string>("");
    const [classId, setClassId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<AlertState | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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

    // Check class id
    useEffect(() => {
        const url = window.location.href;
        const id = url.split("/").pop();
        if (id && !isNaN(parseInt(id))) {
            setClassId(parseInt(id));
        } else {
            router.push("/classs");
        }
    }, []);

    // Get class data
    useEffect(() => {
        async function fetchClassData() {
            if (classId <= 0) return;
            
            setLoading(true);
            try {
                // Get class data by id
                const classDetails = await getClassDataById(classId);
                
                if (classDetails && 'title' in classDetails && classDetails.title === "เกิดข้อผิดพลาด") {
                    setError(classDetails as AlertState);
                    setLoading(false);
                    return;
                }
                
                setClassData(classDetails as ClassData);
                
                // Get class banner separately
                const banner = await getClassBanner(classId);
                if (typeof banner === 'string') {
                    setBannerUrl(banner);
                } else if (banner && 'title' in banner && banner.title === "เกิดข้อผิดพลาด") {
                    console.error("Banner error:", banner.message);
                }
            } catch (err: any) {
                console.error("Error fetching class data:", err);
                setError({
                    title: "เกิดข้อผิดพลาด",
                    message: "ไม่สามารถโหลดข้อมูลห้องเรียนได้",
                    type: "error"
                });
            } finally {
                setLoading(false);
            }
        }

        fetchClassData();
    }, [classId, action]);

    // Show alert when action is completed
    useEffect(() => {
        if (action && action.title && action.message && action.type && window.showAlert) {
            window.showAlert(action.title, action.message, action.type as AlertType);
            setIsModalOpen(false);
            router.push(`/classs/${classId}`);
        }

        if (deleteAction && deleteAction.title && deleteAction.message && deleteAction.type && window.showAlert) {
            window.showAlert(deleteAction.title, deleteAction.message, deleteAction.type as AlertType);
            setShowDeleteModal(false);

            if (deleteAction.type === "success") {
                setTimeout(() => {
                    router.push("/classs");
                }, 2000);
            }
        }
    }, [action, deleteAction]);

    // Function to render class information
    const renderClassContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-white">
                    <h2 className="text-xl font-bold mb-4">{error.title}</h2>
                    <p className="mb-4">{error.message}</p>
                    <Link href="/classs">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                            กลับไปหน้าห้องเรียน
                        </button>
                    </Link>
                </div>
            );
        }

        if (!classData) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-white">
                    <h2 className="text-xl font-bold mb-4">ไม่พบข้อมูลห้องเรียน</h2>
                    <Link href="/classs">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                            กลับไปหน้าห้องเรียน
                        </button>
                    </Link>
                </div>
            );
        }

        return (
            <div className="text-white">
                {/* Class Banner */}
                <div className="w-full h-40 md:h-60 lg:h-80 rounded-lg rounded-b-none overflow-hidden mb-6 relative">
                    {/* Banner Image */}
                    {bannerUrl ? (
                        <>
                            <img 
                                src={bannerUrl} 
                                alt={classData.c_name} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-[#203D4F]/80"></div>
                        </>
                    ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                            <p>ไม่พบรูปภาพแบนเนอร์</p>
                        </div>
                    )}

                    {/* Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h1 className="text-2xl md:text-3xl font-bold">{classData.c_name}</h1>
                    </div>

                    {/* count student */}
                    <div className="absolute bottom-0 right-0 p-4">
                        <span className="text-white/80 text-sm">จำนวนผู้เรียนทั้งหมด {classData.c_students ? Object.keys(classData.c_students).length : 0} คน</span>
                    </div>

                    {/* Gear */}
                    <div className="absolute top-0 right-0 m-4 group">
                        <FontAwesomeIcon
                            icon={faGear}
                            className="text-white rounded-md z-20 opacity-30 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                            onClick={() => setIsMenuOpen(true)}
                            onMouseEnter={() => setIsMenuOpen(true)}
                        />
                        {isMenuOpen && (
                            <div className="absolute top-0 right-0 hidden group-hover:block bg-[#2D4A5B] p-2 rounded-lg shadow-md transition-all duration-300">
                                <button 
                                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-all duration-300 cursor-pointer rounded-lg"
                                    onClick={() => { setIsModalOpen(true); }}
                                >
                                    แก้ไข
                                </button>
                                <button 
                                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-all duration-300 cursor-pointer rounded-lg"
                                    onClick={() => { setShowDeleteModal(true); }}
                                >
                                    ลบ
                                </button>
                            </div>
                        )}
                    </div>                    
                </div>

                {/* Class Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-3 md:p-5 pt-0 md:pt-0">
                    {/* Class Details */}
                    <div className="border-none border-[#002D4A] hover:border-[#80ED99] bg-[#203D4F] rounded-lg p-4">
                        <h2 className="text-xl font-bold">รายละเอียดห้องเรียน</h2>
                        <hr className="my-2 border-white/30" />
                        <div className="space-y-2">
                            <p className="text-[#80ec99]"><span className="text-sm text-white/80">รหัสห้องเรียน:</span> class-{classData.c_id}</p>
                            <p className="text-[#80ec99]"><span className="text-sm text-white/80">ชื่อห้องเรียน:</span> {classData.c_name}</p>
                            <p className="text-[#80ec99]"><span className="text-sm text-white/80">อีเมลครูผู้สอน:</span> {classData.c_temail}</p>
                        </div>
                    </div>

                    {/* Student Information */}
                    <div className="border-none border-[#002D4A] hover:border-[#80ED99] bg-[#203D4F] rounded-lg p-4">
                        <h2 className="text-xl font-bold">ข้อมูลนักเรียน</h2>
                        <hr className="my-2 border-white/30" />
                        <div>
                            {classData.c_students && Object.keys(classData.c_students).length > 0 ? (
                                <div className="space-y-2">
                                    <p className="font-semibold">จำนวนนักเรียนทั้งหมด: {Object.keys(classData.c_students).length} คน</p>
                                    {/* Add more student information here if needed */}
                                </div>
                            ) : (
                                <p className="text-sm text-white/60 mt-3">ยังไม่มีนักเรียนในห้องเรียนนี้</p>
                            )}
                        </div>
                    </div>

                    {/* Homework Section */}
                    <div className="border-none border-[#002D4A] hover:border-[#80ED99] bg-[#203D4F] rounded-lg p-4 md:col-span-2">
                        {/* Title */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">ชุดฝึก</h2>

                            {/* New homework */}
                            <button
                                className="rounded-md bg-[#002D4A] px-6 md:px-10 py-1 text-sm/6 text-white hover:text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300"
                            >
                                เพิ่มชุดฝึก
                            </button>
                        </div>

                        <hr className="my-2 border-white/30" />

                        {/* Homework List */}
                        <div>
                            {classData.c_homework && Object.keys(classData.c_homework).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(classData.c_homework).map(([key, value]: [string, HomeworkItem]) => (
                                        <div key={key} className="bg-[#2D4A5B] p-4 rounded-lg">
                                            <h3 className="font-bold">{value.title}</h3>
                                            <p className="text-sm text-gray-300 mt-1">{value.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-white/60 mt-3">ยังไม่มีชุดฝึกในห้องเรียนนี้</p>
                            )}
                        </div>
                    </div>

                    {/* Media Section */}
                    <div className="border-none border-[#002D4A] hover:border-[#80ED99] bg-[#203D4F] rounded-lg p-4 md:col-span-2">
                        {/* Title */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">สื่อการสอน</h2>
                            

                            {/* New media */}
                            <button
                                className="rounded-md bg-[#002D4A] px-6 md:px-10 py-1 text-sm/6 text-white hover:text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300"
                            >
                                เพิ่มสื่อการสอน
                            </button>
                        </div>
                        
                        <hr className="my-2 border-white/30" />

                        {/* Media List */}
                        <div>
                            {classData.c_medias && Object.keys(classData.c_medias).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(classData.c_medias).map(([key, value]) => (
                                        <div key={key} className="bg-[#2D4A5B] p-4 rounded-lg">
                                            <h3 className="font-bold">{value.title}</h3>
                                            <p className="text-sm text-gray-300 mt-1">{value.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-white/60 mt-3">ยังไม่มีสื่อการสอนในห้องเรียนนี้</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {user && (
                <div className="flex flex-col h-full w-11/12 mx-auto">
                    {/* Navbar */}
                    <Navbar />

                    {/* Alert */}
                    <Alert1 />

                    {/* Main content */}
                    <div className="flex flex-grow flex-col lg:flex-row overflow-hidden relative">
                        {/* Sidebar */}
                        <div className="w-full lg:w-auto lg:flex-shrink-0">
                            <Sidebar />
                        </div>

                        {/* Content */}
                        <div className="flex-grow lg:flex-grow-0 lg:w-4/5 bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 lg:ml-4 rounded-xl border-4 border-[#203D4F] overflow-y-auto relative">
                            {renderClassContent()}
                        </div>
                    </div>

                    {/* Footer */}
                    <Footer />

                    {/* Update Class Modal */}
                    <UpdateClassModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        formAction={formAction}
                    />

                    {/* Delete Class */}
                    <DeleteClassModal 
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        formAction={setDeleteAction}
                    />
                </div>
            )}
        </div>
    );
}