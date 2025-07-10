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
    const [homeworkData, setHomeworkData] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<any>(null);

    // Swapy
    const swapy = useRef(null) as any;
    const container = useRef(null)

    // Handle homework creation
    const handleCreateHomework = async (prevState: any, formData: FormData) => {
        const result = await createHomework(prevState, formData);
        
        // Don't automatically close modal here since preview will handle it
        // Refresh data will be handled by the modal's onSaveSuccess callback
        
        return result;
    };

    // Function to refresh homework data (can be called from modal)
    const refreshHomeworkData = () => {
        getHomework().then((res: any) => {
            if (res) {
                setHomeworkData(res);
            }
        });
        setIsModalOpen(false); // Close modal after refresh
    };

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

    // Get homework data
    useEffect(() => {
        getHomework().then((res: any) => {
            if (res) {
                setHomeworkData(res);
            }
        })
    }, []);

    // Initialize Swapy
    useEffect(() => {
        try {
            if (container.current) {
                swapy.current = createSwapy(container.current)
    
                swapy.current.onSwap(({ data, fromPosition, toPosition }: any) => {
                    if (data && toPosition !== undefined) {
                        const positions = JSON.parse(localStorage.getItem('exercisePositions') || '{}');
                        positions[data] = toPosition;
                        localStorage.setItem('exercisePositions', JSON.stringify(positions));
                    }
                });
            }
        } catch (error) {
            console.error('Swapy initialization error:', error);
        }
    }, [homeworkData]);

    // Handle homework click to view questions
    const handleHomeworkClick = (homework: any) => {
        setSelectedHomework(homework);
        setIsQuestionsModalOpen(true);
    };

    // Handle questions save (for editing)
    const handleQuestionsSave = async (questionsData: any) => {
        try {
            // Update homework in database
            const result = await updateHomework(selectedHomework.h_id, questionsData);
            
            if (result.type === 'success') {
                // Update local state
                setHomeworkData((prev: any) => 
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
        } catch (error) {
            console.error('Error saving questions:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการแก้ไขได้', 'error' as AlertType);
            }
        }
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
                            {/* Add homework */}
                            <div className="w-full">
                                <button className="text-white bg-[#203D4F] px-5 py-2 rounded-md cursor-pointer hover:bg-[#002D4A] transition-all duration-300 hover:text-[#80ED99] ml-auto block"
                                onClick={() => setIsModalOpen(true)}>+ สร้างชุดฝึก</button>
                            </div>

                            {/* Homework list */}
                            {homeworkData && homeworkData.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5 relative" ref={container}>
                                    {homeworkData.map((item: any, index: number) => (
                                        <div
                                            key={index}
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
                                                    </div>
                                                    <div className="mt-auto">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs">
                                                                <p className="text-[#80ED99]">
                                                                    คะแนนรวม: {item.h_score} คะแนน
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <p className="text-white text-lg">ยังไม่มีชุดฝึก</p>
                                </div>
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
                    />
                </div>
            )}
        </div>
    );
}