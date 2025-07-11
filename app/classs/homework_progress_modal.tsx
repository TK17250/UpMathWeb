"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getHomeworkProgress } from '@/app/action/actives';
import { getStudentID } from '../action/students';

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
    const [studentsData, setStudentsData] = useState<Record<string, StudentData>>({});
    const [loading, setLoading] = useState(true);

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
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-[#80ED99] transition-colors duration-300 text-2xl cursor-pointer"
                    >
                        ×
                    </button>
                </div>

                {loading ? (
                    <div className="text-white p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#80ED99] mx-auto mb-4"></div>
                        กำลังโหลดข้อมูล...
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
                                                            <div>การตรวจ: {item.a_type === 'AI' ? 'AI ตรวจ' : 'ครูตรวจ'}</div>
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
                        className="py-3 px-6 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 cursor-pointer"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
