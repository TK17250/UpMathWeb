'use client';
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useRef } from "react";
import { getUser } from "@/app/action/getuser";
import Navbar from "@/app/component/navbar";
import Sidebar from "@/app/component/sidebar";
import Footer from "@/app/component/footer";
import Alert1, { AlertType } from "../component/alert1"
import CreateMediaModal from "./form_modal";
import { createSwapy } from 'swapy'
import { createMedia, getMedia } from "../action/media";

const Alert = {
    title: "",
    message: "",
    type: "",
}

export default function Medias() {
    const [user, setUser] = useState<any>(null);
    const [mediaData, setMediaData] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, formAction] = useActionState(createMedia, Alert);

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

    // Get media data
    useEffect(() => {
        getMedia().then((res: any) => {
            if (res) {
                setMediaData(res);
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
                        const positions = JSON.parse(localStorage.getItem('mediasPositions') || '{}');
                        positions[data] = toPosition;
                        localStorage.setItem('mediasPositions', JSON.stringify(positions));
                    }
                });
            }
        } catch (error) {
            console.error('Swapy initialization error:', error);
        }
    }, [mediaData]);

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
                            {/* Add medias */}
                            <div className="w-full">
                                <button className="text-white bg-[#203D4F] px-5 py-2 rounded-md cursor-pointer hover:bg-[#002D4A] transition-all duration-300 hover:text-[#80ED99] ml-auto block"
                                onClick={() => setIsModalOpen(true)}>+ เพิ่มสื่อการเรียนรู้</button>
                            </div>

                            {/* Class list */}
                            {mediaData && mediaData.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5 relative" ref={container}>
                                    {mediaData.map((item: any, index: number) => (
                                        <div
                                            key={index}
                                            data-swapy-slot={index}
                                            className="relative"
                                        >
                                            <div
                                                data-swapy-item={index}
                                                style={{ 
                                                    backgroundImage: `url(${item.c_banner})`, 
                                                    backgroundSize: 'cover', 
                                                    backgroundPosition: 'center' 
                                                }}
                                                className="relative rounded-2xl p-4 transition-colors duration-300 overflow-hidden border-4 border-[#203D4F] cursor-pointer hover:border-[#80ED99] hover:text-[#80ED99] text-white"
                                            >
                                                <div className="absolute inset-0 bg-[#203D4F]/80"></div>
                                                <div className="relative z-10 flex flex-col h-full">
                                                    <div className="flex items-center justify-between mb-10">
                                                        <h2 className="text-2xl font-bold transition-all duration-300">{item.m_name}</h2>
                                                    </div>
                                                    <div className="mt-auto">
                                                        <div className="flex items-center space-x-2">
                                                            <p>ระยะเวลา: {item.m_period}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <p className="text-white text-lg">ยังไม่มีสื่อการเรียนรู้</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <Footer />

                    {/* Create Class Modal */}
                    <CreateMediaModal 
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        formAction={formAction}
                    />
                </div>
            )}
        </div>
    );
}