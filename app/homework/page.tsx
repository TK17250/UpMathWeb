'use client';
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useRef } from "react";
import { getUser } from "@/app/action/getuser";
import Navbar from "@/app/component/navbar";
import Sidebar from "@/app/component/sidebar";
import Footer from "@/app/component/footer";
import Alert1, { AlertType } from "../component/alert1"
import CreateHomeworkModal from "./form_modal";
import { createSwapy } from 'swapy'
import { createHomework, getHomework } from "../action/homework";

const Alert = {
    title: "",
    message: "",
    type: "",
}

export default function Homework() {
    const [user, setUser] = useState<any>(null);
    const [homeworkData, setHomeworkData] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, formAction] = useActionState(createHomework, Alert);

    // Swapy
    const swapy = useRef(null) as any;
    const container = useRef(null)

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

    // Show alert when action is completed
    useEffect(() => {
        if (action && action.title && action.message && action.type && window.showAlert) {
            window.showAlert(action.title, action.message, action.type as AlertType);
            setIsModalOpen(false);
        }
    }, [action]);

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
                                            >
                                                <div className="relative z-10 flex flex-col h-full min-h-[200px]">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <h2 className="text-xl font-bold transition-all duration-300 line-clamp-2">{item.h_name}</h2>
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="mb-2">
                                                            <span className="text-[#80ED99] text-sm font-semibold">เนื้อหา: </span>
                                                            <span className="text-gray-300 text-sm">{item.h_subject}</span>
                                                        </div>
                                                        <div className="mb-2">
                                                            <span className="text-[#80ED99] text-sm font-semibold">ประเภท: </span>
                                                            <span className="text-gray-300 text-sm">{item.h_type}</span>
                                                        </div>
                                                        {item.h_content && (
                                                            <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                                                                {item.h_content}
                                                            </p>
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
                        formAction={formAction}
                    />
                </div>
            )}
        </div>
    );
}