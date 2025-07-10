// app/medias/page.tsx

'use client';
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useRef } from "react";
import { getUser } from "@/app/action/getuser";
import Navbar from "@/app/component/navbar";
import Sidebar from "@/app/component/sidebar";
import Footer from "@/app/component/footer";
import Alert1, { AlertType } from "../component/alert1";
import CreateMediaModal from "./form_modal";
import { createMedia, getMediaWithSignedUrls, updateMedia, deleteMedia } from "../action/media";
import UpdateMediaModal from "./update_form_modal";
import ConfirmationModal from "../component/modal1";
import { ClockIcon, FilmIcon, PhotoIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface MediaItem {
    m_id: number;
    m_name: string;
    m_period: string;
    m_media: {
        file_name: string;
        description: string;
    };
    signedUrl: string | null;
    fileType: 'image' | 'video' | 'unknown';
}

const Alert = { title: "", message: "", type: "" };

export default function Medias() {
    const [user, setUser] = useState<any>(null);
    const [mediaData, setMediaData] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const deleteFormRef = useRef<HTMLFormElement>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createAction, createFormAction] = useActionState(createMedia, Alert);

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [editingMediaItem, setEditingMediaItem] = useState<MediaItem | null>(null);
    const [updateAction, updateFormAction] = useActionState(updateMedia, Alert);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingMediaItem, setDeletingMediaItem] = useState<MediaItem | null>(null);
    const [deleteAction, deleteFormAction] = useActionState(deleteMedia, Alert);

    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        getUser().then((res: any) => {
            if (!res) router.push("/login");
            else setUser(res);
        });
    }, [router]);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getMediaWithSignedUrls().then((res: any) => {
                if (Array.isArray(res)) setMediaData(res);
                else console.error("Failed to fetch media data:", res?.message);
                setIsLoading(false);
            });
        }
    }, [user, createAction, updateAction, deleteAction]);

    useEffect(() => {
        const handleAlert = (action: typeof Alert, closeModal: () => void) => {
            if (action.type) {
                window.showAlert?.(action.title, action.message, action.type as AlertType);
                if (action.type === 'success' || action.type === 'warning') {
                    closeModal();
                }
            }
        };
        handleAlert(createAction, () => setIsCreateModalOpen(false));
        handleAlert(updateAction, () => setIsUpdateModalOpen(false));
        handleAlert(deleteAction, () => setIsDeleteModalOpen(false));
    }, [createAction, updateAction, deleteAction]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && !(event.target as Element).closest(`.menu-container-${openMenuId}`)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const handleEditClick = (item: MediaItem) => {
        setEditingMediaItem(item);
        setIsUpdateModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDeleteClick = (item: MediaItem) => {
        setDeletingMediaItem(item);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const handleConfirmDelete = () => {
        if (deleteFormRef.current) {
            deleteFormRef.current.requestSubmit();
        }
    };

    const renderMediaCards = () => {
        if (isLoading) {
            return (
                <div className="absolute inset-0 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
            );
        }

        if (mediaData.length === 0) {
            return (
                <div className="absolute inset-0 flex justify-center items-center">
                    <div className="text-center p-4">
                        <PhotoIcon className="mx-auto h-16 w-16 text-white/30" />
                        <h3 className="mt-2 text-lg font-semibold text-white">ยังไม่มีสื่อการเรียนรู้</h3>
                        <p className="mt-1 text-sm text-white/60">คลิกที่ปุ่ม '+ เพิ่มสื่อการเรียนรู้' เพื่อเริ่มต้น</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                {mediaData.map((item) => (
                    <div
                        key={item.m_id}
                        className="group relative rounded-2xl p-4 flex flex-col justify-between transition-colors duration-300 overflow-hidden border-4 border-[#203D4F] text-white bg-cover bg-center"
                        style={{
                            backgroundImage: item.fileType === 'image' && item.signedUrl ? `url(${item.signedUrl})` : 'none',
                            backgroundColor: item.fileType !== 'image' ? '#203D4F' : 'transparent',
                        }}
                    >
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors duration-300"></div>
                        {item.fileType === 'video' && (
                            <FilmIcon className="absolute z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 text-white/10" />
                        )}
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold line-clamp-2 pr-2">{item.m_name}</h2>
                                <div className={`relative menu-container-${item.m_id}`}>
                                    <button
                                        className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === item.m_id ? null : item.m_id);
                                        }}
                                    >
                                        <EllipsisVerticalIcon className="h-6 w-6" />
                                    </button>
                                    {openMenuId === item.m_id && (
                                        <div className="absolute top-full right-0 mt-2 w-36 bg-[#2D4A5B] border border-[#4A6B8A] rounded-lg shadow-xl z-20 animate-[zoomIn_150ms_ease-out]">
                                            <ul className="py-1">
                                                <li>
                                                    <button
                                                        onClick={() => handleEditClick(item)}
                                                        className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-white/10"
                                                    >
                                                        <PencilIcon className="h-4 w-4 mr-3" />
                                                        แก้ไข
                                                    </button>
                                                </li>
                                                <li>
                                                    <button 
                                                        onClick={() => handleDeleteClick(item)}
                                                        className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                                                    >
                                                        <TrashIcon className="h-4 w-4 mr-3" />
                                                        ลบ
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-auto pt-4">
                                <p className="text-sm text-white/80 line-clamp-2 mb-3">{item.m_media.description}</p>
                                <div className="flex items-center space-x-2 text-xs text-[#80ED99]">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{item.m_period !== 'N/A' ? item.m_period : 'ไม่มีระยะเวลา'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {user && (
                <div className="flex flex-col h-full w-11/12 mx-auto">
                    <Navbar />
                    <Alert1 />

                    <div className="flex flex-grow flex-col lg:flex-row overflow-hidden relative">
                        <Sidebar />
                        <div className="flex-grow lg:w-4/5 bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 lg:ml-4 rounded-xl border-4 border-[#203D4F] p-3 md:p-5 overflow-y-auto relative">
                             <div className="w-full flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-2">
                                <h1 className="text-2xl font-bold text-white shrink-0">คลังสื่อการเรียนรู้</h1>
                                <button
                                    className="w-full sm:w-auto text-white bg-[#203D4F] px-5 py-2 rounded-md cursor-pointer hover:bg-[#002D4A] hover:text-[#80ED99] ml-auto block shrink-0 transition-colors duration-300"
                                    onClick={() => setIsCreateModalOpen(true)}>
                                    + เพิ่มสื่อการเรียนรู้
                                </button>
                            </div>
                            {renderMediaCards()}
                        </div>
                    </div>

                    <Footer />

                    <CreateMediaModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        formAction={createFormAction}
                    />
                    
                    <UpdateMediaModal
                        isOpen={isUpdateModalOpen}
                        onClose={() => setIsUpdateModalOpen(false)}
                        formAction={updateFormAction}
                        mediaItem={editingMediaItem}
                    />

                    {deletingMediaItem && (
                        <ConfirmationModal
                            open={isDeleteModalOpen}
                            setOpen={setIsDeleteModalOpen}
                            onConfirm={handleConfirmDelete}
                            title="ยืนยันการลบสื่อ"
                            message={
                                <span>คุณแน่ใจหรือไม่ว่าต้องการลบสื่อการสอน: <strong className="text-white">{deletingMediaItem.m_name}</strong>? การกระทำนี้ไม่สามารถย้อนกลับได้</span>
                            }
                            confirmButtonText="ยืนยันการลบ"
                            cancelButtonText="ยกเลิก"
                        />
                    )}

                    <form ref={deleteFormRef} action={deleteFormAction} className="hidden">
                        <input type="hidden" name="m_id" value={deletingMediaItem?.m_id || ''} />
                    </form>
                </div>
            )}
        </div>
    );
}