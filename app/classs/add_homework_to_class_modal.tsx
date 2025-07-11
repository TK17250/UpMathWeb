"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addHomeworkToClass } from '@/app/action/actives';
import { getHomework } from '@/app/action/homework';

interface HomeworkData {
    h_id: number;
    h_name: string;
    h_subject: string;
    h_bloom_taxonomy: string;
    h_type: string;
    h_score: number;
    h_content: any;
}

interface AddHomeworkToClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: number;
    onSuccess?: () => void;
}

export default function AddHomeworkToClassModal({ 
    isOpen, 
    onClose, 
    classId,
    onSuccess 
}: AddHomeworkToClassModalProps) {
    const [homeworkList, setHomeworkList] = useState<HomeworkData[]>([]);
    const [selectedHomeworkId, setSelectedHomeworkId] = useState<string>("");
    const [aiCheck, setAiCheck] = useState<boolean>(true);
    const [loading, setLoading] = useState(false);
    const [loadingHomework, setLoadingHomework] = useState(true);

    // Fetch homework list when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchHomeworkList();
        }
    }, [isOpen]);

    const fetchHomeworkList = async () => {
        setLoadingHomework(true);
        try {
            const result = await getHomework();
            if (Array.isArray(result)) {
                setHomeworkList(result);
            } else if (result?.type === 'error') {
                if (window.showAlert) {
                    window.showAlert('เกิดข้อผิดพลาด', result.message, 'error');
                }
            }
        } catch (error) {
            console.error('Error fetching homework:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดรายการชุดฝึกได้', 'error');
            }
        } finally {
            setLoadingHomework(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedHomeworkId) {
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'กรุณาเลือกชุดฝึก', 'warning');
            }
            return;
        }

        setLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('homeworkId', selectedHomeworkId);
            formData.append('classId', classId.toString());
            formData.append('aiCheck', aiCheck.toString());

            const result = await addHomeworkToClass(null, formData);
            
            if (result.type === 'success') {
                if (window.showAlert) {
                    window.showAlert(result.title, result.message, 'success');
                }
                onSuccess?.();
                handleClose();
            } else {
                if (window.showAlert) {
                    window.showAlert(result.title, result.message, result.type);
                }
            }
        } catch (error) {
            console.error('Error adding homework to class:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถเพิ่มชุดฝึกได้', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedHomeworkId("");
        setAiCheck(true);
        onClose();
    };

    if (!isOpen) return null;

    const selectedHomework = homeworkList.find(hw => hw.h_id.toString() === selectedHomeworkId);

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#203D4F] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">เพิ่มชุดฝึกให้กับนักเรียน</h2>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-[#80ED99] transition-colors duration-300 text-2xl cursor-pointer"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Homework Selection */}
                    <div>
                        <label className="block text-white font-semibold mb-2">
                            เลือกชุดฝึก <span className="text-red-400">*</span>
                        </label>
                        {loadingHomework ? (
                            <div className="text-white p-4 text-center">กำลังโหลดรายการชุดฝึก...</div>
                        ) : homeworkList.length > 0 ? (
                            <select
                                value={selectedHomeworkId}
                                onChange={(e) => setSelectedHomeworkId(e.target.value)}
                                className="w-full p-3 border border-[#002D4A] rounded-lg bg-[#2D4A5B] text-white focus:outline-none focus:border-[#80ED99] cursor-pointer"
                                required
                            >
                                <option value="">-- เลือกชุดฝึก --</option>
                                {homeworkList.map((homework) => (
                                    <option key={homework.h_id} value={homework.h_id.toString()}>
                                        {homework.h_name} ({homework.h_subject})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-white/60 p-4 text-center border border-[#002D4A] rounded-lg bg-[#2D4A5B]">
                                ยังไม่มีชุดฝึก กรุณาสร้างชุดฝึกก่อน
                            </div>
                        )}
                    </div>

                    {/* Selected Homework Details */}
                    {selectedHomework && (
                        <div className="bg-[#2D4A5B] p-4 rounded-lg border border-[#002D4A]">
                            <h3 className="text-white font-semibold mb-2">รายละเอียดชุดฝึก</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex">
                                    <span className="text-[#80ED99] w-24">ชื่อ:</span>
                                    <span className="text-white">{selectedHomework.h_name}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-[#80ED99] w-24">วิชา:</span>
                                    <span className="text-white">{selectedHomework.h_subject}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-[#80ED99] w-24">ประเภท:</span>
                                    <span className="text-white">{selectedHomework.h_type}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-[#80ED99] w-24">คะแนน:</span>
                                    <span className="text-white">{selectedHomework.h_score} คะแนน</span>
                                </div>
                                {selectedHomework.h_content?.metadata && (
                                    <div className="flex">
                                        <span className="text-[#80ED99] w-24">จำนวนข้อ:</span>
                                        <span className="text-white">{selectedHomework.h_content.metadata.total_questions} ข้อ</span>
                                    </div>
                                )}
                                <div className="flex">
                                    <span className="text-[#80ED99] w-24">Bloom's:</span>
                                    <span className="text-white">{selectedHomework.h_bloom_taxonomy}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Check Option */}
                    <div>
                        <label className="block text-white font-semibold mb-2">
                            วิธีการตรวจ
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="checkType"
                                    checked={aiCheck}
                                    onChange={() => setAiCheck(true)}
                                    className="w-4 h-4 text-[#80ED99] bg-[#2D4A5B] border-[#002D4A] focus:ring-[#80ED99] cursor-pointer"
                                />
                                <div className="text-white">
                                    <div className="font-medium">ให้ AI ตรวจ</div>
                                    <div className="text-sm text-white/60">ระบบ AI จะตรวจและให้คะแนนอัตโนมัติ</div>
                                </div>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="checkType"
                                    checked={!aiCheck}
                                    onChange={() => setAiCheck(false)}
                                    className="w-4 h-4 text-[#80ED99] bg-[#2D4A5B] border-[#002D4A] focus:ring-[#80ED99] cursor-pointer"
                                />
                                <div className="text-white">
                                    <div className="font-medium">ครูตรวจเอง</div>
                                    <div className="text-sm text-white/60">ครูจะเป็นผู้ตรวจและให้คะแนนเอง</div>
                                </div>
                            </label>
                        </div>
                    </div>

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
                            disabled={loading || !selectedHomeworkId || loadingHomework}
                            className="flex-1 py-3 px-6 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? 'กำลังเพิ่ม...' : 'เพิ่มชุดฝึกให้นักเรียน'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
