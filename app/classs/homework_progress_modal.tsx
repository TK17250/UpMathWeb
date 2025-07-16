"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getHomeworkProgress, removeHomeworkFromClass } from '@/app/action/history';
import { getStudentID } from '../action/students';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface StudentData {
    s_id: string;
    s_fullname: string;
    s_email: string;
    s_username: string;
    s_gender: string;
    s_age: number;
}

interface ProgressData {
    a_status: string;
    a_id: number;
    a_sid: string;
    a_homework: any;
    a_type: string;
    students: StudentData;
}

interface HomeworkProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: number;
    homeworkId: number;
    homeworkName: string;
}

export default function HomeworkProgressModal({ 
    isOpen, 
    onClose, 
    classId, 
    homeworkId, 
    homeworkName 
}: HomeworkProgressModalProps) {
    const [progressData, setProgressData] = useState<ProgressData[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen && classId && homeworkId) {
            fetchProgress();
        }
    }, [isOpen, classId, homeworkId]);

    const fetchProgress = async () => {
        setLoading(true);
        try {
            const result = await getHomeworkProgress(classId, homeworkId);
            if (Array.isArray(result)) {
                setProgressData(result);
            } else if (result?.type === 'error') {
                if (window.showAlert) {
                    console.log("Error fetching progress:", result.message);
                    console.log(result)
                    window.showAlert('เกิดข้อผิดพลาด', result.message, 'error');
                }
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลความคืบหน้าได้', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setProgressData([]);
        onClose();
    };

    const handleDelete = async () => {
        setShowDeleteModal(false);
        setIsDeleting(true);
        
        try {
            const result = await removeHomeworkFromClass(classId, homeworkId);
            if (result.type === 'success') {
                if (window.showAlert) {
                    window.showAlert('สำเร็จ', `ลบชุดฝึก "${homeworkName}" ออกจากชั้นเรียนเรียบร้อยแล้ว`, 'success');
                }
                // Close modal after successful deletion
                setTimeout(() => {
                    handleClose();
                    // Trigger parent component refresh if needed
                    if (typeof window !== 'undefined' && window.location) {
                        window.location.reload();
                    }
                }, 1500);
            } else {
                if (window.showAlert) {
                    window.showAlert('เกิดข้อผิดพลาด', result.message || 'ไม่สามารถลบชุดฝึกได้', 'error');
                }
                setIsDeleting(false);
            }
        } catch (error) {
            console.error('Error deleting homework:', error);
            if (window.showAlert) {
                window.showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', 'error');
            }
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    const completedCount = progressData.filter(item => item.a_status === 'completed').length;
    const totalCount = progressData.length;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#203D4F] rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">ความคืบหน้าชุดฝึก</h2>
                        <p className="text-[#80ED99] mt-1">{homeworkName}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Delete Button - Improved styling */}
                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            disabled={isDeleting}
                            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all duration-300 text-sm font-medium group ${
                                isDeleting 
                                    ? 'bg-gray-600/20 border-gray-500/30 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600/10 border-red-500/30 hover:bg-red-600/20 hover:border-red-500/50 text-red-400 hover:text-red-300 cursor-pointer'
                            }`}
                            title={isDeleting ? 'กำลังลบชุดฝึก...' : 'ลบชุดฝึกออกจากชั้นเรียน'}
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
                                {isDeleting ? 'กำลังลบ...' : 'ลบออกจากชั้นเรียน'}
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

                {loading ? (
                    <div className="text-white p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#80ED99] mx-auto mb-4"></div>
                        กำลังโหลดข้อมูล...
                    </div>
                ) : isDeleting ? (
                    <div className="text-white p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
                        <p className="text-red-400 mb-2">กำลังลบชุดฝึกออกจากชั้นเรียน...</p>
                        <p className="text-sm text-gray-400">กรุณารอสักครู่</p>
                    </div>
                ) : (
                    <>
                        {/* Summary */}
                        <div className="bg-[#2D4A5B] p-4 rounded-lg mb-6 border border-[#002D4A]">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-[#80ED99]">{totalCount}</div>
                                    <div className="text-white text-sm">นักเรียนทั้งหมด</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-400">{completedCount}</div>
                                    <div className="text-white text-sm">ทำเสร็จแล้ว</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-orange-400">{totalCount - completedCount}</div>
                                    <div className="text-white text-sm">ยังไม่ทำ</div>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-sm text-white mb-1">
                                    <span>ความคืบหน้า</span>
                                    <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-[#203D4F] rounded-full h-2">
                                    <div 
                                        className="bg-[#80ED99] h-2 rounded-full transition-all duration-300"
                                        style={{ 
                                            width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Student List */}
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">รายชื่อนักเรียน</h3>
                            {progressData.length > 0 ? (
                                <div className="space-y-3">
                                    {progressData.map((item, index) => {
                                        const isCompleted = item.a_status === 'completed';
                                        return (
                                            <div
                                                key={item.a_id}
                                                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                                                    isCompleted 
                                                        ? 'bg-green-900/20 border-green-500/50' 
                                                        : 'bg-[#2D4A5B] border-[#002D4A]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        {/* Student Avatar */}
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                                            isCompleted ? 'bg-green-500' : 'bg-[#203D4F]'
                                                        }`}>
                                                            {item.students?.s_fullname ? item.students.s_fullname.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        
                                                        {/* Student Info */}
                                                        <div>
                                                            <div className="text-white font-semibold">
                                                                {item.students?.s_fullname || 'ไม่มีข้อมูล'}
                                                            </div>
                                                            <div className="text-white/60 text-sm">
                                                                {item.students?.s_email || `ID: ${item.a_sid}`}
                                                            </div>
                                                            {item.students?.s_username && (
                                                                <div className="text-white/40 text-xs">
                                                                    @{item.students.s_username}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Status and Info */}
                                                    <div className="text-right">
                                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                            isCompleted 
                                                                ? 'bg-green-500/20 text-green-400' 
                                                                : 'bg-orange-500/20 text-orange-400'
                                                        }`}>
                                                            {isCompleted ? '✓ เสร็จแล้ว' : '○ ยังไม่ทำ'}
                                                        </div>
                                                        
                                                        {/* Additional Info */}
                                                        <div className="mt-2 text-xs text-white/60">
                                                            <div>การตรวจ: {item.a_homework?.check_type === 'AI' ? 'AI ตรวจ' : 'ครูตรวจ'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-white/60 text-center p-8">
                                    ไม่มีข้อมูลนักเรียน
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

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[#203D4F] rounded-lg p-6 w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="text-2xl">⚠️</div>
                            <h3 className="text-lg font-semibold text-white">ยืนยันการลบชุดฝึกออกจากชั้นเรียน</h3>
                        </div>

                        {/* Content */}
                        <div className="space-y-4 mb-6">
                            <p className="text-white">
                                คุณต้องการลบชุดฝึก <span className="font-semibold text-yellow-400">"{homeworkName}"</span> ออกจากชั้นเรียนนี้หรือไม่?
                            </p>
                            
                            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                                <p className="text-sm text-yellow-300 mb-2">
                                    <strong>หมายเหตุ:</strong> การลบจะทำให้:
                                </p>
                                <ul className="text-sm text-yellow-200 ml-4 list-disc space-y-1">
                                    <li>นักเรียนไม่สามารถเข้าถึงชุดฝึกนี้ได้อีก</li>
                                    <li>ข้อมูลความคืบหน้าของนักเรียนจะถูกลบ</li>
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
                                ยืนยัน<br />ลบออกจากชั้นเรียน
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
