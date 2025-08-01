"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addMediaToClass } from '@/app/action/media';
import { getMedia } from '@/app/action/media';

interface MediaData {
    m_id: number;
    m_name: string;
    m_media: any;
}

interface AddMediaToClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: number;
    onSuccess?: () => void;
}

export default function AddMediaToClassModal({ 
    isOpen, 
    onClose, 
    classId,
    onSuccess 
}: AddMediaToClassModalProps) {
    const [mediaList, setMediaList] = useState<MediaData[]>([]);
    const [selectedMediaId, setSelectedMediaId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [loadingMedia, setLoadingMedia] = useState(true);

    // Fetch media list when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchMediaList();
        }
    }, [isOpen]);

    const fetchMediaList = async () => {
        setLoadingMedia(true);
        try {
            const result = await getMedia();
            if (Array.isArray(result)) {
                setMediaList(result);
            } else if (result?.type === 'error') {
                if (window.showAlert) {
                    window.showAlert('เกิดข้อผิดพลาด', result.message, 'error');
                }
            }
        } catch (error) {
            console.error('Error fetching media:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายการสื่อได้', 'error');
            }
        } finally {
            setLoadingMedia(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedMediaId) {
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'กรุณาเลือกสื่อ', 'warning');
            }
            return;
        }

        setLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('mediaId', selectedMediaId);
            formData.append('classId', classId.toString());

            const result = await addMediaToClass(null, formData);
            
            if (result.type === 'success') {
                if (window.showAlert) {
                    window.showAlert(result.title, result.message, 'success');
                }
                onSuccess?.();
                handleClose();
                window.location.reload();
            } else {
                if (window.showAlert) {
                    window.showAlert(result.title, result.message, result.type);
                }
            }
        } catch (error) {
            console.error('Error adding media to class:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มสื่อได้', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedMediaId("");
        onClose();
    };

    if (!isOpen) return null;

    const selectedMedia = mediaList.find(m => m.m_id.toString() === selectedMediaId);

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#203D4F] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">เพิ่มสื่อการสอนให้กับนักเรียน</h2>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-[#80ED99] transition-colors duration-300 text-2xl cursor-pointer"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Media Selection */}
                    <div>
                        <label className="block text-white font-semibold mb-2">
                            เลือกสื่อการสอน <span className="text-red-400">*</span>
                        </label>
                        {loadingMedia ? (
                            <div className="text-white p-4 text-center">กำลังโหลดรายการสื่อการสอน...</div>
                        ) : mediaList.length > 0 ? (
                            <select
                                value={selectedMediaId}
                                onChange={(e) => setSelectedMediaId(e.target.value)}
                                className="w-full p-3 border border-[#002D4A] rounded-lg bg-[#2D4A5B] text-white focus:outline-none focus:border-[#80ED99] cursor-pointer"
                                required
                            >
                                <option value="">-- เลือกสื่อการสอน --</option>
                                {mediaList.map((media) => (
                                    <option key={media.m_id} value={media.m_id.toString()}>
                                        {media.m_name} ({media.m_media?.type})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-white/60 p-4 text-center border border-[#002D4A] rounded-lg bg-[#2D4A5B]">
                                ยังไม่มีสื่อ กรุณาเพิ่มสื่อก่อน
                            </div>
                        )}
                    </div>

                    {/* Selected Media Details */}
                    {selectedMedia && (
                        <div className="bg-[#2D4A5B] p-4 rounded-lg border border-[#002D4A]">
                            <h3 className="text-white font-semibold mb-2">รายละเอียดสื่อ</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex">
                                    <span className="text-[#80ED99] w-24">ชื่อ:</span>
                                    <span className="text-white">{selectedMedia.m_name}</span>
                                </div>
                                {selectedMedia.m_media?.description && (
                                    <div className="flex">
                                        <span className="text-[#80ED99] w-24">รายละเอียด:</span>
                                        <span className="text-white">{selectedMedia.m_media?.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 px-6 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-300 cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedMediaId || loadingMedia}
                            className="flex-1 py-3 px-6 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? 'กำลังเพิ่ม...' : 'เพิ่มสื่อให้นักเรียน'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
