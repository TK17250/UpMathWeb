"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { getMedia, getMediaID } from '@/app/action/media';
import { removeMediaFromClass } from '@/app/action/class';
interface MediaData {
    m_id: number;
    m_name: string;
    m_media: any;
    signedUrl?: string;
    fileType?: string;
    error?: string;
}

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: number;
    mediaId: string;
    mediaName: string;
}

export default function MediaPreviewModal({ 
    isOpen, 
    onClose, 
    mediaId,
    mediaName,
    classId
}: MediaPreviewModalProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [mediaData, setMediaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMediaData = async () => {
            try {
                const data = await getMediaID(`${mediaId}`);

                // Check if it's an error response from your function
                if (data?.type === "error") {
                    console.error("Error from getMediaID:", data.message);
                    setMediaData({ error: data.message });
                } else {
                    setMediaData(data);
                }
            } catch (error) {
                console.error("Error fetching media:", error);
                setMediaData({ error: "Failed to load media" });
            } finally {
                setLoading(false);
            }
        };

        fetchMediaData();
    }, [mediaId]);

    const handleClose = () => {
        setMediaData(null);
        setShowDeleteModal(false);
        setIsDeleting(false);
        onClose();
    };

    const handleDelete = async () => {
        setShowDeleteModal(false);
        setIsDeleting(true);
        
        try {
                const response = await removeMediaFromClass(classId, mediaId);
                if (response?.type === "error") {
                    console.error("Error from removeMediaFromClass:", response.message);
                } else {
                    if (window.showAlert) {
                        window.showAlert('สำเร็จ', `ลบสื่อ "${mediaName}" เรียบร้อยแล้ว`, 'success');
                    }
                    setTimeout(() => {
                        handleClose();
                    if (typeof window !== 'undefined' && window.location) {
                        window.location.reload();
                    }
                }, 1500);
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', 'error');
            }
            setIsDeleting(false);
        }

        
    };

    const renderMediaContent = () => {
        if (!mediaData?.signedUrl) {
            return (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    Loading media...
                </div>
            );
        }

        const fileType = mediaData.fileType || 'unknown';
        const signedUrl = mediaData.signedUrl;

        switch (fileType) {
            case 'image':
                return (
                    <img
                        src={signedUrl}
                        alt={mediaData.m_name || mediaName}
                        className="absolute inset-0 w-full h-full object-contain"
                        onError={(e) => {
                            console.error('Failed to load image:', mediaData.m_media?.file_name);
                            e.currentTarget.src = '/file.svg';
                            e.currentTarget.className = 'absolute inset-0 w-full h-full object-contain opacity-50 p-8';
                        }}
                    />
                );

            case 'video':
                return (
                    <video
                        src={signedUrl}
                        controls
                        className="absolute inset-0 w-full h-full object-contain"
                        preload="metadata"
                        onError={(e) => {
                            console.error('Failed to load video:', mediaData.m_media?.file_name);
                        }}
                    >
                        Your browser does not support the video tag.
                    </video>
                );

            case 'unknown':
            default:
                const fileName = mediaData.m_media?.file_name || '';
                const extension = fileName.split('.').pop()?.toLowerCase() || '';
                
                if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(extension)) {
                    return (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                            <div className="mb-4 text-4xl">🎵</div>
                            <audio
                                src={signedUrl}
                                controls
                                className="w-full max-w-sm"
                                preload="metadata"
                            >
                                Your browser does not support the audio tag.
                            </audio>
                        </div>
                    );
                }
                
                return (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <div className="mb-4 text-4xl">📄</div>
                        <p className="text-sm text-white/70 mb-2 text-center">
                            {extension.toUpperCase()} File
                        </p>
                        <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#80ED99] text-black px-4 py-2 rounded hover:bg-[#6bc47f] transition-colors"
                        >
                            Open File
                        </a>
                    </div>
                );
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#203D4F] rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {mediaData && mediaData.m_media ? (
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{mediaData.m_name || mediaName || 'ไม่ระบุชื่อ'}</h2>
                            <p className="text-xs bg-[#80ED99] text-black px-2 py-1 rounded uppercase text-center w-auto">{mediaData.fileType}</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Delete Button */}
                            <button 
                                onClick={() => setShowDeleteModal(true)}
                                disabled={isDeleting}
                                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all duration-300 text-sm font-medium group ${
                                    isDeleting 
                                        ? 'bg-gray-600/20 border-gray-500/30 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600/10 border-red-500/30 hover:bg-red-600/20 hover:border-red-500/50 text-red-400 hover:text-red-300 cursor-pointer'
                                }`}
                                title={isDeleting ? 'กำลังลบสื่อ...' : 'ลบสื่อ'}
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <FontAwesomeIcon
                                        icon={faTrash}
                                        className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
                                    />
                                )}
                                <span className="hidden sm:inline">
                                    {isDeleting ? 'กำลังลบ...' : 'ลบสื่อ'}
                                </span>
                                <span className="sm:hidden">
                                    {isDeleting ? 'กำลังลบ...' : 'ลบ'}
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="border-l border-gray-600 h-6"></div>

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300 group cursor-pointer"
                                title="ปิดหน้าต่าง"
                            >
                                <XMarkIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">กำลังโหลดข้อมูล...</h2>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300 group cursor-pointer"
                        >
                            <XMarkIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-white p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#80ED99] mx-auto mb-4"></div>
                        กำลังโหลดข้อมูล...
                    </div>
                ) : isDeleting ? (
                    <div className="text-white p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
                        <p className="text-red-400 mb-2">กำลังลบสื่อ...</p>
                        <p className="text-sm text-gray-400">กรุณารอสักครู่</p>
                    </div>
                ) : (
                    <>
                        {/* Media Preview */}
                        <div className="aspect-video relative overflow-hidden rounded-lg bg-black/20 mb-4">
                            {renderMediaContent()}
                        </div>

                        {/* Media Content */}
                        <div className="bg-[#2D4A5B] rounded-lg p-4 border border-[#002D4A]">
                            {mediaData && mediaData.m_media ? (
                                <>

                                    

                                    {/* Media Details */}
                                    {mediaData.m_media.file_name && (
                                        <div className="text-sm text-white/70">
                                            <p><span className="text-[#80ED99]">รายละเอียดข้อมูล:</span> {mediaData.m_media.description}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-white/60 text-center p-8">
                                    {mediaData?.error || 'ไม่มีข้อมูลสื่อ'}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Close Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        className={`py-3 px-6 font-semibold rounded-lg transition-colors duration-300 ${
                            isDeleting 
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] cursor-pointer'
                        }`}
                    >
                        {isDeleting ? 'กำลังดำเนินการ...' : 'ปิด'}
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[#203D4F] rounded-lg p-6 w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="text-2xl">⚠️</div>
                            <h3 className="text-lg font-semibold text-white">ยืนยันการลบสื่อ</h3>
                        </div>

                        {/* Content */}
                        <div className="space-y-4 mb-6">
                            <p className="text-white">
                                คุณต้องการลบสื่อ <span className="font-semibold text-yellow-400">"{mediaData.m_name}"</span> หรือไม่?
                            </p>
                            
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                                <p className="text-sm text-yellow-300 mb-2">
                                    <strong>หมายเหตุ:</strong> การลบจะทำให้:
                                </p>
                                <ul className="text-sm text-yellow-200 ml-4 list-disc space-y-1">
                                    <li>สื่อนี้จะถูกลบออกจากระบบอย่างถาวร</li>
                                    <li>การกระทำนี้ไม่สามารถย้อนกลับได้</li>
                                </ul>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium cursor-pointer"
                            >
                                ยืนยันลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}