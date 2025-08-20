'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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

    // Handle homework creation
    const handleCreateHomework = async (prevState: any, formData: FormData) => {
        try {
            const result = await createHomework(prevState, formData);
            return result;
        } catch (error: any) {
            console.error("Error creating homework:", error);
            return {
                type: "error",
                title: "เกิดข้อผิดพลาด",
                message: "ไม่สามารถสร้างชุดฝึกได้ กรุณาลองใหม่",
            };
        }
    };

    // Function to refresh homework data (can be called from modal)
    const refreshHomeworkData = async () => {
        console.log("Refreshing homework data...");
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await getHomework();
            console.log("Homework data received:", res);
            
            // Handle different response formats
            if (Array.isArray(res)) {
                setHomeworkData(res);
            } else if (res === null || res === undefined) {
                // Handle null/undefined response
                setHomeworkData([]);
                console.warn("Received null/undefined response, setting empty array");
            } else if (res && res.type === "error") {
                // Handle error response
                setError(res.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
                setHomeworkData([]);
            } else {
                console.warn("Unexpected response format:", res);
                setHomeworkData([]);
            }
        } catch (error: any) {
            console.error("Error refreshing homework data:", error);
            setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
            setHomeworkData([]);
        } finally {
            setIsLoading(false);
            setIsModalOpen(false); // Close modal after refresh
        }
    };

    // Check login with better error handling
    const router = useRouter();
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await getUser();
                if (!res) {
                    router.push("/login");
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                router.push("/login");
            }
        };
        
        checkAuth();
    }, [router]);

    // Get user with better error handling
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getUser();
                if (res) {
                    setUser(res);
                } else {
                    console.warn("No user data received");
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
            }
        };
        
        fetchUser();
    }, []);

    // Get homework data with comprehensive error handling
    useEffect(() => {
        const fetchHomework = async () => {
            console.log("Initial homework fetch...");
            setIsLoading(true);
            setError(null);
            
            try {
                const res = await getHomework();
                console.log("Initial homework data:", res);
                
                // Handle different response formats more robustly
                if (Array.isArray(res)) {
                    setHomeworkData(res);
                    console.log(`Successfully loaded ${res.length} homework items`);
                } else if (res === null || res === undefined) {
                    // Handle null/undefined response gracefully
                    console.warn("Received null/undefined response, setting empty array");
                    setHomeworkData([]);
                } else if (res && typeof res === 'object' && res.type === "error") {
                    // Handle error response
                    console.error("Server returned error:", res.message);
                    setError(res.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
                    setHomeworkData([]);
                } else {
                    console.warn("Unexpected response format:", typeof res, res);
                    setHomeworkData([]);
                    setError("รูปแบบข้อมูลไม่ถูกต้อง");
                }
            } catch (error: any) {
                console.error("Critical error fetching homework:", error);
                setError("ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่");
                setHomeworkData([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch if user is available
        if (user) {
            fetchHomework();
        }
    }, [user]); // Depend on user instead of empty array

    // Initialize Swapy with error handling
    useEffect(() => {
        try {
            if (container.current && homeworkData.length > 0) {
                // Clean up previous swapy instance
                if (swapy.current) {
                    try {
                        swapy.current.destroy?.();
                    } catch (e) {
                        console.warn("Failed to destroy previous swapy instance:", e);
                    }
                }

                swapy.current = createSwapy(container.current);
    
                swapy.current.onSwap(({ data, fromPosition, toPosition }: any) => {
                    try {
                        if (data && toPosition !== undefined) {
                            const positions = JSON.parse(localStorage.getItem('exercisePositions') || '{}');
                            positions[data] = toPosition;
                            localStorage.setItem('exercisePositions', JSON.stringify(positions));
                        }
                    } catch (localStorageError) {
                        console.warn("Failed to save exercise positions:", localStorageError);
                    }
                });
            }
        } catch (error) {
            console.error('Swapy initialization error:', error);
        }

        // Cleanup function
        return () => {
            try {
                if (swapy.current) {
                    swapy.current.destroy?.();
                }
            } catch (e) {
                console.warn("Failed to cleanup swapy:", e);
            }
        };
    }, [homeworkData]);

    // Handle homework click to view questions
    const handleHomeworkClick = (homework: any) => {
        try {
            if (!homework || !homework.h_id) {
                console.error("Invalid homework data:", homework);
                if (window.showAlert) {
                    window.showAlert('เกิดข้อผิดพลาด', 'ข้อมูลชุดฝึกไม่ถูกต้อง', 'error' as AlertType);
                }
                return;
            }

            setSelectedHomework(homework);
            setIsQuestionsModalOpen(true);
        } catch (error) {
            console.error("Error handling homework click:", error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเปิดชุดฝึกได้', 'error' as AlertType);
            }
        }
    };

    // Handle questions save (for editing)
    const handleQuestionsSave = async (questionsData: any) => {
        try {
            if (!selectedHomework?.h_id || !questionsData) {
                throw new Error("ข้อมูลไม่ถูกต้อง");
            }

            // Update homework in database
            const result = await updateHomework(selectedHomework.h_id, questionsData);
            
            if (result.type === 'success') {
                // Update local state
                setHomeworkData((prev: any[]) => 
                    prev.map((item: any) => 
                        item.h_id === selectedHomework.h_id 
                            ? { ...item, h_content: questionsData, h_score: questionsData.metadata?.total_score || 0 }
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
                    window.showAlert('เกิดข้อผิดพลาด', result.message || 'ไม่สามารถบันทึกได้', 'error' as AlertType);
                }
            }
        } catch (error: any) {
            console.error('Error saving questions:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถบันทึกการแก้ไขได้', 'error' as AlertType);
            }
        }
    };

    // Retry function for error states
    const handleRetry = () => {
        setError(null);
        refreshHomeworkData();
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
                        <div className="flex-grow lg:flex-grow-0 lg:w-4/5 bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 lg:ml-4 rounded-xl border-4 border-[#203D4F] p-3 md:p-5 overflow-y-auto relative">
                            {/* Add homework button */}
                            <div className="w-full">
                                <button 
                                    className="text-white bg-[#203D4F] px-5 py-2 rounded-md cursor-pointer hover:bg-[#002D4A] transition-all duration-300 hover:text-[#80ED99] ml-auto block disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => setIsModalOpen(true)}
                                    disabled={isLoading}
                                >
                                    + สร้างชุดฝึก
                                </button>
                            </div>

                            {/* Error state */}
                            {error && !isLoading && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                        <p className="text-lg font-semibold">เกิดข้อผิดพลาด</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                    <button
                                        onClick={handleRetry}
                                        className="bg-[#203D4F] text-white px-4 py-2 rounded hover:bg-[#002D4A] transition-colors"
                                    >
                                        ลองใหม่
                                    </button>
                                </div>
                            )}

                            {/* Loading state */}
                            {isLoading && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                    <p className="text-white text-lg">กำลังโหลด...</p>
                                </div>
                            )}

                            {/* Homework list */}
                            {!isLoading && !error && (
                                homeworkData && homeworkData.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5 relative" ref={container}>
                                        {homeworkData.map((item: any, index: number) => {
                                            // Validate homework item before rendering
                                            if (!item || !item.h_id || !item.h_name) {
                                                console.warn("Skipping invalid homework item:", item);
                                                return null;
                                            }

                                            return (
                                                <div
                                                    key={`homework-${item.h_id}-${index}`}
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
                                                                <h2 className="text-xl font-bold transition-all duration-300 line-clamp-2">
                                                                    ชุดฝึก: {item.h_name}
                                                                </h2>
                                                            </div>
                                                            <div className="flex-grow">
                                                                <div className="">
                                                                    <span className="text-[#80ED99] text-sm font-semibold">ประเภท: </span>
                                                                    <span className="text-gray-300 text-sm">{item.h_type || 'ไม่ระบุ'}</span>
                                                                </div>
                                                                {item.h_content && item.h_content.metadata && (
                                                                    <div className="">
                                                                        <span className="text-[#80ED99] text-sm font-semibold">จำนวนข้อ: </span>
                                                                        <span className="text-gray-300 text-sm">
                                                                            {item.h_content.metadata.total_questions || 0} ข้อ
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {item.h_content && item.h_content.metadata && item.h_content.metadata.bloom_taxonomy && (
                                                                    <div className="">
                                                                        <span className="text-[#80ED99] text-sm font-semibold">Bloom's: </span>
                                                                        <span className="text-gray-300 text-sm">
                                                                            {item.h_content.metadata.bloom_taxonomy}
                                                                        </span>
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
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                        <div className="text-white">
                                            <div className="mb-4">
                                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-lg mb-2">ยังไม่มีชุดฝึก</p>
                                            <p className="text-gray-400 text-sm">คลิกปุ่ม "สร้างชุดฝึก" เพื่อเริ่มต้น</p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <Footer />

                    {/* Create Homework Modal */}
                    <CreateHomeworkModal 
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
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
            )}
        </div>
    );
}