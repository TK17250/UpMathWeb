'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { getUser } from "@/app/action/getuser";
import Navbar from "@/app/component/navbar";
import Sidebar from "@/app/component/sidebar";
import Footer from "@/app/component/footer";
import Alert1, { AlertType } from "../component/alert1"
import CreateHomeworkModal from "./form_modal";
import QuestionsPreviewModal from "./questions_preview_modal";
import { createSwapy } from 'swapy'
import { createHomework, getHomework, updateHomework } from "../action/homework";

export default function Homework() {
    const [user, setUser] = useState<any>(null);
    const [homeworkData, setHomeworkData] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Swapy
    const swapy = useRef(null) as any;
    const container = useRef(null)
    const router = useRouter();

    // Handle homework creation with proper error handling
    const handleCreateHomework = async (prevState: any, formData: FormData) => {
        try {
            setError(null); // Clear any previous errors
            const result = await createHomework(prevState, formData);
            
            // Check if result indicates an error
            if (result?.type === 'error') {
                setError(result.message);
                return result;
            }
            
            return result;
        } catch (error: any) {
            const errorMsg = `การสร้างชุดฝึกล้มเหลว: ${error.message}`;
            setError(errorMsg);
            return {
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: errorMsg
            };
        }
    };

    // Function to refresh homework data with better error handling
    const refreshHomeworkData = useCallback(async () => {
        console.log("Refreshing homework data...");
        if (!user) {
            console.log("No user available, skipping homework refresh");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await getHomework();
            console.log("Homework data received:", res);
            
            if (res === null) {
                setError("ไม่สามารถโหลดข้อมูลชุดฝึกได้");
                setHomeworkData([]);
            } else if (Array.isArray(res)) {
                setHomeworkData(res);
                setError(null);
            } else {
                console.warn("Invalid homework data format:", res);
                setHomeworkData([]);
                setError("รูปแบบข้อมูลไม่ถูกต้อง");
            }
        } catch (error: any) {
            console.error("Error refreshing homework data:", error);
            setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}`);
            setHomeworkData([]);
        } finally {
            setIsLoading(false);
            // Only close modal if it was a successful refresh
            if (!error) {
                setIsModalOpen(false);
            }
        }
    }, [user, error]);

    // Authentication check - runs first
    useEffect(() => {
        let mounted = true;
        
        const checkAuth = async () => {
            try {
                const userData = await getUser();
                if (!mounted) return;
                
                if (!userData) {
                    router.push("/login");
                    return;
                }
                
                setUser(userData);
            } catch (error: any) {
                console.error("Auth check failed:", error);
                if (mounted) {
                    router.push("/login");
                }
            }
        };
        
        checkAuth();
        
        return () => {
            mounted = false;
        };
    }, [router]);

    // Homework data fetching - only runs after user is confirmed
    useEffect(() => {
        if (!user) return; // Don't fetch if no user
        
        let mounted = true;
        
        const fetchHomework = async () => {
            console.log("Initial homework fetch for user:", user.t_email);
            setIsLoading(true);
            setError(null);
            
            try {
                const res = await getHomework();
                if (!mounted) return;
                
                console.log("Initial homework data:", res);
                
                if (res === null) {
                    setError("ไม่สามารถโหลดข้อมูลชุดฝึกได้");
                    setHomeworkData([]);
                } else if (Array.isArray(res)) {
                    setHomeworkData(res);
                    setError(null);
                } else {
                    console.warn("No homework data or invalid format:", res);
                    setHomeworkData([]);
                }
            } catch (error: any) {
                console.error("Error fetching homework:", error);
                if (mounted) {
                    setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}`);
                    setHomeworkData([]);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchHomework();
        
        return () => {
            mounted = false;
        };
    }, [user]); // Only depend on user

    // Initialize Swapy - only after homework data is loaded
    useEffect(() => {
        if (!container.current || homeworkData.length === 0) return;
        
        try {
            swapy.current = createSwapy(container.current);

            swapy.current.onSwap(({ data, fromPosition, toPosition }: any) => {
                if (data && toPosition !== undefined) {
                    try {
                        const positions = JSON.parse(localStorage.getItem('exercisePositions') || '{}');
                        positions[data] = toPosition;
                        localStorage.setItem('exercisePositions', JSON.stringify(positions));
                    } catch (e) {
                        console.warn('Failed to save exercise positions:', e);
                    }
                }
            });
        } catch (error) {
            console.error('Swapy initialization error:', error);
        }

        return () => {
            if (swapy.current) {
                try {
                    swapy.current.destroy?.();
                } catch (e) {
                    console.warn('Swapy cleanup error:', e);
                }
            }
        };
    }, [homeworkData]);

    // Handle homework click to view questions
    const handleHomeworkClick = (homework: any) => {
        setSelectedHomework(homework);
        setIsQuestionsModalOpen(true);
    };

    // Handle questions save (for editing)
    const handleQuestionsSave = async (questionsData: any) => {
        try {
            const result = await updateHomework(selectedHomework.h_id, questionsData);
            
            if (result.type === 'success') {
                // Update local state
                setHomeworkData((prev: any[]) => 
                    prev.map((item: any) => 
                        item.h_id === selectedHomework.h_id 
                            ? { ...item, h_content: questionsData, h_score: questionsData.metadata.total_score }
                            : item
                    )
                );
                
                setIsQuestionsModalOpen(false);
                setSelectedHomework(null);
                
                if (window.showAlert) {
                    window.showAlert('สำเร็จ', 'บันทึกการแก้ไขเรียบร้อยแล้ว', 'success' as AlertType);
                }
            } else {
                if (window.showAlert) {
                    window.showAlert('เกิดข้อผิดพลาด', result.message, 'error' as AlertType);
                }
            }
        } catch (error: any) {
            console.error('Error saving questions:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการแก้ไขได้', 'error' as AlertType);
            }
        }
    };

    // Show loading state while checking authentication
    if (!user && isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <p className="text-white text-lg">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
            </div>
        );
    }

    // Don't render anything if no user (will redirect)
    if (!user) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <div className="flex flex-col h-full w-11/12 mx-auto">
                {/* Navbar */}
                <Navbar />

                {/* Alert */}
                <Alert1 />

                {/* Error Display */}
                {error && (
                    <div className="bg-red-500 text-white p-3 rounded-md mb-4 mx-4">
                        <p>{error}</p>
                        <button 
                            onClick={() => setError(null)}
                            className="ml-2 underline"
                        >
                            ซ่อน
                        </button>
                    </div>
                )}

                {/* Main content */}
                <div className="flex flex-grow flex-col lg:flex-row overflow-hidden relative">
                    {/* Sidebar */}
                    <div className="w-full lg:w-auto lg:flex-shrink-0">
                        <Sidebar />
                    </div>

                    {/* Content */}
                    <div className="flex-grow lg:flex-grow-0 lg:w-4/5 bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 lg:ml-4 rounded-xl border-4 border-[#203D4F] p-3 md:p-5 overflow-y-auto relative">
                        {/* Add homework */}
                        <div className="w-full">
                            <button 
                                className="text-white bg-[#203D4F] px-5 py-2 rounded-md cursor-pointer hover:bg-[#002D4A] transition-all duration-300 hover:text-[#80ED99] ml-auto block disabled:opacity-50"
                                onClick={() => setIsModalOpen(true)}
                                disabled={isLoading}
                            >
                                + สร้างชุดฝึก
                            </button>
                        </div>

                        {/* Loading state */}
                        {isLoading && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <p className="text-white text-lg">กำลังโหลด...</p>
                            </div>
                        )}

                        {/* Homework list */}
                        {!isLoading && !error && homeworkData && homeworkData.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5 relative" ref={container}>
                                {homeworkData.map((item: any, index: number) => (
                                    <div
                                        key={item.h_id || index}
                                        data-swapy-slot={index}
                                        className="relative"
                                    >
                                        <div
                                            data-swapy-item={index}
                                            className="relative rounded-2xl p-4 transition-colors duration-300 overflow-hidden border-4 border-[#203D4F] cursor-pointer hover:border-[#80ED99] hover:text-[#80ED99] text-white bg-gradient-to-br from-[#203D4F] to-[#2D4A5B]"
                                            onClick={() => handleHomeworkClick(item)}
                                        >
                                            <div className="relative z-10 flex flex-col h-full min-h-[150px]">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h2 className="text-xl font-bold transition-all duration-300 line-clamp-2">ชุดฝึก: {item.h_name}</h2>
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="">
                                                        <span className="text-[#80ED99] text-sm font-semibold">ประเภท: </span>
                                                        <span className="text-gray-300 text-sm">{item.h_type}</span>
                                                    </div>
                                                    {item.h_content && item.h_content.metadata && (
                                                        <div className="">
                                                            <span className="text-[#80ED99] text-sm font-semibold">จำนวนข้อ: </span>
                                                            <span className="text-gray-300 text-sm">{item.h_content.metadata.total_questions} ข้อ</span>
                                                        </div>
                                                    )}
                                                    {item.h_content && item.h_content.metadata && (
                                                        <div className="">
                                                            <span className="text-[#80ED99] text-sm font-semibold">Bloom's: </span>
                                                            <span className="text-gray-300 text-sm">{item.h_content.metadata.bloom_taxonomy}</span>
                                                        </div>
                                                    )}
                                                    {item.h_subject && (
                                                        <div className="">
                                                            <span className="text-[#80ED99] text-sm font-semibold">วิชา: </span>
                                                            <span className="text-gray-300 text-sm">{item.h_subject}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-auto">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs">
                                                            <p className="text-[#80ED99]">
                                                                คะแนนรวม: {item.h_score || 0} คะแนน
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !isLoading && !error ? (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <p className="text-white text-lg">ยังไม่มีชุดฝึก</p>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Footer */}
                <Footer />

                {/* Create Homework Modal */}
                <CreateHomeworkModal 
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setError(null); // Clear errors when closing modal
                    }}
                    formAction={handleCreateHomework}
                    onSaveSuccess={refreshHomeworkData}
                />

                {/* Questions Preview Modal */}
                <QuestionsPreviewModal
                    isOpen={isQuestionsModalOpen}
                    onClose={() => {
                        setIsQuestionsModalOpen(false);
                        setSelectedHomework(null);
                    }}
                    questionsData={selectedHomework?.h_content || null}
                    onSave={handleQuestionsSave}
                    homeworkId={selectedHomework?.h_id}
                    homeworkName={selectedHomework?.h_name}
                    onDelete={() => {
                        refreshHomeworkData();
                        setIsQuestionsModalOpen(false);
                        setSelectedHomework(null);
                    }}
                />
            </div>
        </div>
    );
}