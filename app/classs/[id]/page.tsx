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
import { faBold, faGear, faItalic, faTrash, faUnderline } from "@fortawesome/free-solid-svg-icons";
import UpdateClassModal from "./form_modal";
import DeleteClassModal from "./delete_modal";
import { formatText, insertLink, updateHiddenInput } from "@/utils/richTextEditor";
import { createNews, deleteNews, getNewsByClassId, updateNews } from "@/app/action/news";
import ConfirmationModal2 from "@/app/component/modal2";
import { getStudentID } from "@/app/action/students";
import { getActivesByClassId } from "@/app/action/actives";
import AddHomeworkToClassModal from "../add_homework_to_class_modal";
import HomeworkProgressModal from "../homework_progress_modal";
import ConfirmationModal from "@/app/component/modal1";

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
    h_id: number;
    h_name: string;
    h_subject: string;
    h_score: number;
    h_type: string;
    h_bloom_taxonomy: string;
    h_content: any;
    assignedAt?: string;
    check_type: string;
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

interface NewsItem {
    n_id: string;
    n_cid: string | number;
    n_content: string;
    n_time: string;
}

interface AlertState {
    title: string;
    message: any;
    type: string;
}

interface NewsActionState {
    title: string;
    message: string;
    type: string;
}

export default function Class() {
    const [user, setUser] = useState<UserData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [action, formAction] = useActionState(updateClassData, Alert);
    const [deleteAction, setDeleteAction] = useActionState(deleteClass, Alert);
    const [newsAction, setNewsAction] = useActionState<NewsActionState, FormData>(createNews, Alert);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string>("");
    const [classId, setClassId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<AlertState | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>("");
    const [showDeleteNewsModal, setShowDeleteNewsModal] = useState(false);
    const [deleteNewsById, setDeleteNewsById] = useState<number | null>(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showAddHomeworkModal, setShowAddHomeworkModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedHomeworkProgress, setSelectedHomeworkProgress] = useState<{id: number, name: string} | null>(null);
    const [classHomework, setClassHomework] = useState<any[]>([]);
    const [studentsData, setStudentsData] = useState<Record<string, any>>({});

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

        async function fetchNewsData() {
            try {
                const response = await getNewsByClassId(classId)
                if (Array.isArray(response)) {
                    setNews(response);
                } else {
                    console.error("News fetch error:", response);
                }
            } catch (err: any) {
                console.error("Error fetching news:", err);
            }
        }

        async function fetchClassHomework() {
            if (classId <= 0) return;
            
            try {
                const result = await getActivesByClassId(classId);
                if (Array.isArray(result)) {
                    setClassHomework(result);
                } else if (result?.type === 'error') {
                    console.error("Homework fetch error:", result.message);
                }
            } catch (err: any) {
                console.error("Error fetching class homework:", err);
            }
        }

        fetchNewsData()
        fetchClassData();
        fetchClassHomework();
    }, [classId, action]);

    // Get student data from c_students
    useEffect(() => {
        if (!classData || !classData.c_students) return;

        const fetchStudentsData = async () => {
            const studentPromises = Object.entries(classData.c_students).map(async ([email, studentInfo]: [string, any]) => {
                try {
                    const studentData = await getStudentID(studentInfo.s_id);
                    return studentData;
                } catch (err) {
                    console.error("Error fetching student data for", email, ":", err);
                    return null;
                }
            });

            const students = await Promise.all(studentPromises);
            const studentData: Record<string, any> = {};
            students.forEach((student: any) => {
                if (student && student.s_id) {
                    studentData[student.s_id] = student;
                }
            });
            setStudentsData(studentData);
        };

        fetchStudentsData();
    }, [classData]);

    // Refresh homework when modal closes
    const handleHomeworkRefresh = () => {
        if (classId > 0) {
            const fetchClassHomework = async () => {
                try {
                    const result = await getActivesByClassId(classId);
                    if (Array.isArray(result)) {
                        setClassHomework(result);
                    }
                } catch (err: any) {
                    console.error("Error refreshing homework:", err);
                }
            };
            fetchClassHomework();
        }
    };

    // Handle homework progress view
    const handleViewProgress = (homeworkId: number, homeworkName: string) => {
        setSelectedHomeworkProgress({ id: homeworkId, name: homeworkName });
        setShowProgressModal(true);
    };

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

        if (newsAction && newsAction.title && newsAction.message && newsAction.type && window.showAlert) {
            window.showAlert(newsAction.title, newsAction.message, newsAction.type as AlertType);
            
            // ถ้าสำเร็จ ให้ล้างข้อมูลใน editor
            if (newsAction.type === "success") {
                const editor = document.getElementById('editor');
                if (editor) {
                    updateHiddenInput(editor);
                }

                getNewsByClassId(classId).then((res: any) => {
                    setNews(res)
                })
            }
        }
    }, [action, deleteAction, newsAction]);

    const handleEditNews = (newsId: string, content: string) => {
        setEditingNewsId(newsId);
        setEditContent(content);
        
        // จำเป็นต้องรอให้ DOM render ก่อน แล้วจึงเริ่มการแก้ไข
        setTimeout(() => {
          const editor = document.getElementById('edit-editor');
          if (editor) {
            editor.innerHTML = content;
            editor.focus();
          }
        }, 10);
    };
      
    // ฟังก์ชันบันทึกการแก้ไข
    const handleSaveEdit = async () => {
        if (!editingNewsId) return;
    
        const content = (document.getElementById('edit-content-input') as HTMLInputElement)?.value;
        if (!content) return window.showAlert?.("เกิดข้อผิดพลาด", "กรุณากรอกเนื้อหา", "error");
    
        try {
            const formData = new FormData();
            formData.append("id", editingNewsId);
            formData.append("content", content);
    
            const result = await updateNews(null, formData); // ส่ง FormData ไปยังฟังก์ชัน updateNews
    
            if (result.type === "success") {
                getNewsByClassId(classId).then((res: any) => {
                    setNews(res)
                })
                
                window.showAlert?.("สำเร็จ", "อัปเดตข่าวประกาศเรียบร้อยแล้ว", "success");
            } else {
                window.showAlert?.("เกิดข้อผิดพลาด", result.message || "ไม่สามารถอัปเดตข่าวได้", "error");
            }
        } catch (error) {
            console.error("Error updating news:", error);
            window.showAlert?.("เกิดข้อผิดพลาด", "ไม่สามารถอัปเดตข่าวได้", "error");
        } finally {
            // ยกเลิกโหมดแก้ไข
            setEditingNewsId(null);
            setEditContent("");
        }
    };    
    
    // ฟังก์ชันยกเลิกการแก้ไข
    const handleCancelEdit = () => {
        setEditingNewsId(null);
        setEditContent("");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (openMenuId && !((event.target as Element).closest('.news-menu-container'))) {
            setOpenMenuId(null);
          }
        };
      
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // Delete News
    const handleConfirmDeleteNews = async () => {
        if (!deleteNewsById) return;
    
        try {
            const result = await deleteNews(deleteNewsById)
            if (result.type === "success") {
                getNewsByClassId(classId).then((res: any) => {
                    setNews(res)
                })

                window.showAlert?.("สำเร็จ", "ลบข่าวประกาศเรียบร้อยแล้ว", "success");
            } else {
                window.showAlert?.("เกิดข้อผิดพลาด", result.message || "ไม่สามารถลบข่าวได้", "error");
            }
        } catch (error) {
            console.error("Error deleting news:", error);
            window.showAlert?.("เกิดข้อผิดพลาด", "ไม่สามารถลบข่าวได้", "error");
        } finally {
            // ปิด modal และเคลียร์ id
            setShowDeleteModal(false);
            setDeleteNewsById(null);
        }
    };

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
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="bg-[#2D4A5B] p-3 rounded-lg">
                                            <div className="text-2xl font-bold text-[#80ED99]">{Object.keys(classData.c_students).length}</div>
                                            <div className="text-sm text-white/80">นักเรียนทั้งหมด</div>
                                        </div>
                                        <div className="bg-[#2D4A5B] p-3 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-400">{classHomework.length}</div>
                                            <div className="text-sm text-white/80">ชุดฝึกที่มอบหมาย</div>
                                        </div>
                                    </div>
                                    
                                    {/* Student List Preview */}
                                    <div className="max-h-32 overflow-y-auto">
                                        {Object.entries(studentsData).slice(0, 5).map(([email, studentInfo]: [string, any], index) => (
                                            <div key={email} className="flex items-center space-x-3 py-2 border-b border-white/10 last:border-b-0">
                                                <div className="w-8 h-8 bg-[#80ED99] rounded-full flex items-center justify-center text-[#203D4F] font-bold text-sm">
                                                    {(studentInfo?.s_email || email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white text-sm font-medium truncate">
                                                        ชื่อผู้ใช้: {studentInfo?.s_username || 'ไม่มีชื่อ'}
                                                    </div>
                                                    <div className="text-white/60 text-xs truncate">
                                                        อีเมล: {studentInfo?.s_email || email}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {Object.keys(studentsData).length > 5 && (
                                            <div className="text-center text-white/60 text-sm py-2">
                                                และอีก {Object.keys(studentsData).length - 5} คน
                                            </div>
                                        )}
                                        {Object.keys(studentsData).length === 0 && Object.keys(classData.c_students).length > 0 && (
                                            <div className="text-center text-white/60 text-sm py-2">
                                                กำลังโหลดข้อมูลนักเรียน...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 bg-[#2D4A5B] rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-white/60">ยังไม่มีนักเรียนในห้องเรียนนี้</p>
                                    <p className="text-xs text-white/40 mt-1">นักเรียนสามารถเข้าร่วมด้วยรหัส: class-{classData.c_id}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* News Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                        {/* New Announcement Box */}
                        <div className="border-none border-[#002D4A] hover:border-[#80ED99] bg-[#203D4F] rounded-lg p-4">
                            {/* Title */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">ประกาศข่าวสาร</h2>
                            </div>
                            
                            {/* Post announcement input with form */}
                            <form action={setNewsAction}>
                                <div className="bg-[#2D4A5B] rounded-lg p-4">
                                    <div className="flex flex-col">
                                        {/* Rich text editor toolbar */}
                                        <div className="flex items-center bg-[#1a3240] p-2 rounded-t-lg">
                                            <button 
                                                type="button"
                                                className="p-1.5 text-white/70 hover:text-[#80ED99] hover:bg-white/10 mr-1 w-7 h-7 flex items-center justify-center rounded"
                                                onClick={() => formatText('bold')}
                                                title="ตัวหนา"
                                            >
                                                <FontAwesomeIcon 
                                                    icon={faBold} 
                                                    className="w-3 h-3"
                                                />
                                            </button>
                                            <button 
                                                type="button"
                                                className="p-1.5 text-white/70 hover:text-[#80ED99] hover:bg-white/10 mr-1 w-7 h-7 flex items-center justify-center rounded"
                                                onClick={() => formatText('italic')}
                                                title="ตัวเอียง"
                                            >
                                                <FontAwesomeIcon 
                                                    icon={faItalic} 
                                                    className="w-3 h-3"
                                                />
                                            </button>
                                            <button 
                                                type="button"
                                                className="p-1.5 text-white/70 hover:text-[#80ED99] hover:bg-white/10 mr-1 w-7 h-7 flex items-center justify-center rounded"
                                                onClick={() => formatText('underline')}
                                                title="ขีดเส้นใต้"
                                            >
                                                <FontAwesomeIcon 
                                                    icon={faUnderline} 
                                                    className="w-3 h-3"
                                                />
                                            </button>
                                            <div className="h-4 w-px bg-white/20 mx-1"></div>
                                            <button 
                                                type="button"
                                                className="p-1.5 text-white/70 hover:text-[#80ED99] hover:bg-white/10 mr-1 w-7 h-7 flex items-center justify-center rounded"
                                                onClick={() => insertLink()}
                                                title="แทรกลิงก์"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        {/* Input field */}
                                        <div 
                                            id="editor" 
                                            contentEditable="true"
                                            className="w-full bg-transparent border border-[#1a3240] rounded-b-lg p-3 text-white min-h-[120px] focus:outline-none overflow-auto text-sm"
                                            onInput={(e: React.FormEvent<HTMLDivElement>) => updateHiddenInput(e.currentTarget)}
                                            dangerouslySetInnerHTML={{ __html: '' }}
                                        ></div>
                                        
                                        {/* Hidden inputs to store data */}
                                        <input type="hidden" name="content" id="content-input" />
                                        <input type="hidden" name="classid" value={classId} />
                                        
                                        {/* Buttons */}
                                        <div className="flex justify-end mt-3">
                                            <button 
                                                type="submit"
                                                className="rounded-md bg-[#002D4A] px-6 py-2 text-sm text-white hover:text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300"
                                            >
                                                โพสต์
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        {/* Previous Announcements Box */}
                        <div className="border-none border-[#002D4A] hover:border-[#80ED99] bg-[#203D4F] rounded-lg p-4">
                            {/* Title */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">ประกาศก่อนหน้า</h2>
                            </div>
                            
                            {/* Scrollable area for previous announcements */}
                            <div className="overflow-y-auto max-h-[350px] pr-2 scrollbar-thin scrollbar-thumb-[#80ED99] scrollbar-track-[#002D4A]">
                                {/* Check if there are announcements */}
                                {news && news.length > 0 ? (
                                    <div className="space-y-4">
                                        {news.map((item: any, index: number) => (
                                            <div key={index} className="bg-[#2D4A5B] rounded-lg p-4 relative">
                                                {editingNewsId === item.n_id ? (
                                                    // โหมดแก้ไข
                                                    <div className="flex flex-col">
                                                        {/* Delete */}
                                                        <button 
                                                            className="absolute top-3 right-3 text-red-400 hover:text-red-600 cursor-pointer"
                                                            onClick={() => {
                                                                setDeleteNewsById(item.n_id);
                                                                setShowDeleteNewsModal(true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>

                                                        {/* Title */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="font-bold">แก้ไขประกาศ</h4>
                                                        </div>
                                                        
                                                        {/* Rich text editor toolbar สำหรับแก้ไข */}
                                                        <div className="flex items-center bg-[#1a3240] p-2 rounded-t-lg">
                                                            <button 
                                                                type="button"
                                                                className="p-1.5 text-white/70 hover:text-[#80ED99] hover:bg-white/10 mr-1 w-7 h-7 flex items-center justify-center rounded"
                                                                onClick={() => formatText('bold')}
                                                                title="ตัวหนา"
                                                            >
                                                                <FontAwesomeIcon 
                                                                    icon={faBold} 
                                                                    className="w-3 h-3"
                                                                />
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                className="p-1.5 text-white/70 hover:text-[#80ED99] hover:bg-white/10 mr-1 w-7 h-7 flex items-center justify-center rounded"
                                                                onClick={() => formatText('italic')}
                                                                title="ตัวเอียง"
                                                            >
                                                                <FontAwesomeIcon 
                                                                    icon={faItalic} 
                                                                    className="w-3 h-3"
                                                                />
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                className="p-1.5 text-white/70 hover:text-[#80ED99] hover:bg-white/10 mr-1 w-7 h-7 flex items-center justify-center rounded"
                                                                onClick={() => formatText('underline')}
                                                                title="ขีดเส้นใต้"
                                                            >
                                                                <FontAwesomeIcon 
                                                                    icon={faUnderline} 
                                                                    className="w-3 h-3"
                                                                />
                                                            </button>
                                                            <div className="h-4 w-px bg-white/20 mx-1"></div>
                                                            <button 
                                                                type="button"
                                                                className="p-1.5 text-white/70 hover:text-[#80ED99] hover:bg-white/10 mr-1 w-7 h-7 flex items-center justify-center rounded"
                                                                onClick={() => insertLink()}
                                                                title="แทรกลิงก์"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        
                                                        {/* Input field สำหรับแก้ไข */}
                                                        <div 
                                                            id="edit-editor" 
                                                            contentEditable="true"
                                                            className="w-full bg-transparent border border-[#1a3240] rounded-b-lg p-3 text-white min-h-[120px] focus:outline-none overflow-auto text-sm"
                                                            onInput={(e: React.FormEvent<HTMLDivElement>) => {
                                                                const editInput = document.getElementById('edit-content-input');
                                                                if (editInput) {
                                                                    (editInput as HTMLInputElement).value = e.currentTarget.innerHTML;
                                                                }
                                                            }}
                                                        ></div>
                                                        
                                                        {/* Hidden input */}
                                                        <input type="hidden" id="edit-content-input" />
                                                        
                                                        {/* Action buttons */}
                                                        <div className="flex justify-end mt-3 space-x-2">
                                                            <button 
                                                                className="px-4 py-2 text-sm text-white bg-[#203D4F]/80 hover:bg-[#203D4F] rounded-lg transition-colors cursor-pointer"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                ยกเลิก
                                                            </button>
                                                            <button 
                                                                className="px-4 py-2 text-sm text-white bg-[#002D4A] hover:text-[#80ED99] font-bold rounded-lg border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300 cursor-pointer"
                                                                onClick={handleSaveEdit}
                                                            >
                                                                บันทึก
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // โหมดแสดงเนื้อหาปกติ
                                                    <div className="flex items-start">
                                                        {/* Content */}
                                                        <div className="flex-grow">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="font-bold">ครูผู้สอน</h4>
                                                                    {/* Time */}
                                                                    <span className="text-white/50 text-xs">
                                                                        {(() => {
                                                                            const utcTime = new Date(item.n_time);
                                                                            // ปรับเวลาเป็น GMT+7 (เวลาประเทศไทย)
                                                                            const bangkokTime = new Date(utcTime.getTime() + (7 * 60 * 60 * 1000));
                                                                            
                                                                            // แสดงวันที่ในรูปแบบไทย
                                                                            const thaiDate = bangkokTime.toLocaleDateString('th-TH', {
                                                                                day: 'numeric',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            });
                                                                            
                                                                            // แสดงเวลาในรูปแบบ 24 ชั่วโมง
                                                                            const thaiTime = bangkokTime.toLocaleTimeString('th-TH', {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                                hour12: false
                                                                            });
                                                                            
                                                                            return `${thaiDate} เวลา ${thaiTime} น.`;
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* ปุ่มแก้ไข */}
                                                                <button 
                                                                    className="text-white/50 hover:text-[#80ED99] bg-[#1a3240] hover:bg-[#1a3240]/80 rounded-lg p-2 transition-colors duration-200 cursor-pointer"
                                                                    onClick={() => handleEditNews(item.n_id, item.n_content)}
                                                                    title="แก้ไขประกาศนี้"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                            
                                                            <div 
                                                                className="mt-2 news-content text-sm text-white/50"
                                                                style={{ 
                                                                    wordWrap: 'break-word',
                                                                    overflowWrap: 'break-word',
                                                                    wordBreak: 'break-word',
                                                                    whiteSpace: 'pre-wrap',
                                                                    hyphens: 'auto'
                                                                }}
                                                                dangerouslySetInnerHTML={{ __html: item.n_content }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white/60 text-sm">ยังไม่มีประกาศในห้องเรียนนี้</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Homework Section */}
                    <div className="border-none border-[#002D4A] hover:border-[#80ED99] bg-[#203D4F] rounded-lg p-4 md:col-span-2">
                        {/* Title */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">ชุดฝึก</h2>

                            {/* New homework */}
                            <button
                                onClick={() => setShowAddHomeworkModal(true)}
                                className="rounded-md bg-[#002D4A] px-6 md:px-10 py-1 text-sm/6 text-white hover:text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300"
                            >
                                เพิ่มชุดฝึก
                            </button>
                        </div>

                        <hr className="my-2 border-white/30" />

                        {/* Homework List */}
                        <div>
                            {classHomework && classHomework.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {classHomework.map((homework: HomeworkItem) => (
                                        <div key={homework.h_id} className="bg-[#2D4A5B] p-4 rounded-lg border border-[#203D4F] hover:border-[#80ED99] transition-all duration-300">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-white line-clamp-2">{homework.h_name}</h3>
                                                <div className={`text-xs px-2 py-1 rounded-full ${homework.check_type === 'AI' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                    {homework.check_type === 'AI' ? 'AI ตรวจ' : 'ครูตรวจ'}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1 text-sm mb-4">
                                                <div className="flex">
                                                    <span className="text-[#80ED99] w-16">วิชา:</span>
                                                    <span className="text-white/80">{homework.h_subject}</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-[#80ED99] w-16">ประเภท:</span>
                                                    <span className="text-white/80">{homework.h_type}</span>
                                                </div>
                                                <div className="flex">
                                                    <span className="text-[#80ED99] w-16">คะแนน:</span>
                                                    <span className="text-white/80">{homework.h_score} คะแนน</span>
                                                </div>
                                                {homework.h_content?.metadata && (
                                                    <div className="flex">
                                                        <span className="text-[#80ED99] w-16">จำนวน:</span>
                                                        <span className="text-white/80">{homework.h_content.metadata.total_questions} ข้อ</span>
                                                    </div>
                                                )}
                                                <div className="flex">
                                                    <span className="text-[#80ED99] w-16">Bloom's:</span>
                                                    <span className="text-white/80 text-xs line-clamp-2">{homework.h_bloom_taxonomy}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleViewProgress(homework.h_id, homework.h_name)}
                                                className="w-full py-2 px-4 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 cursor-pointer"
                                            >
                                                ดูความคืบหน้า
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-white/60 text-sm mb-4">ยังไม่มีชุดฝึกในห้องเรียนนี้</p>
                                    <button
                                        onClick={() => setShowAddHomeworkModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 cursor-pointer"
                                    >
                                        + เพิ่มชุดฝึกแรก
                                    </button>
                                </div>
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

                    {/* Confirm Update News */}
                    <ConfirmationModal2
                        open={showUpdateModal}
                        setOpen={setShowUpdateModal}
                        onConfirm={handleSaveEdit}
                        title="ยืนยันการอัปเดต"
                        message="คุณแน่ใจว่าต้องการบันทึกการแก้ไขข่าวประกาศหรือไม่?"
                        confirmButtonText="บันทึก"
                        cancelButtonText="ยกเลิก"
                    />

                    {/* Confirm Delete News */}
                    <ConfirmationModal
                        open={showDeleteNewsModal}
                        setOpen={setShowDeleteNewsModal}
                        onConfirm={handleConfirmDeleteNews}
                        title="ยืนยันการลบ"
                        message="คุณแน่ใจว่าต้องการลบข่าวประกาศนี้หรือไม่?"
                        confirmButtonText="ยืนยันการลบ"
                        cancelButtonText="ยกเลิก"
                    />

                    {/* Add Homework to Class Modal */}
                    <AddHomeworkToClassModal
                        isOpen={showAddHomeworkModal}
                        onClose={() => setShowAddHomeworkModal(false)}
                        classId={classId}
                        onSuccess={handleHomeworkRefresh}
                    />

                    {/* Homework Progress Modal */}
                    {selectedHomeworkProgress && (
                        <HomeworkProgressModal
                            isOpen={showProgressModal}
                            onClose={() => {
                                setShowProgressModal(false);
                                setSelectedHomeworkProgress(null);
                            }}
                            classId={classId}
                            homeworkId={selectedHomeworkProgress.id}
                            homeworkName={selectedHomeworkProgress.name}
                        />
                    )}
                </div>
            )}
        </div>
    );
}