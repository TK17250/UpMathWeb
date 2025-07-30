'use client';
import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getHistoryDetail } from "../action/history";
import { MathText } from "../../utils/katexRenderer";

interface StudentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    activityId: number;
    studentName: string;
}

interface StudentHomeworkDetail {
    a_id: number;
    a_sid: string;
    a_homework: any;
    a_status: string;
    a_answers?: any;
    a_score?: number;
    a_submission_time?: string;
    student_name?: string;
    student_username?: string;
    student_email?: string;
    homework_name?: string;
    homework_subject?: string;
    homework_content?: any;
    class_name?: string;
    history_time?: string;
}

export default function StudentDetailModal({ isOpen, onClose, activityId, studentName }: StudentDetailModalProps) {
    const [historyDetail, setHistoryDetail] = useState<StudentHomeworkDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && activityId) {
            fetchHistoryDetail();
        }
    }, [isOpen, activityId]);

    // No need to fix data since we only use correct_option_index now

    const fetchHistoryDetail = async () => {
        try {
            setLoading(true);
            const result = await getHistoryDetail(activityId.toString());
            
            if (result.type === 'success') {
                setHistoryDetail(result.data);
            } else {
                console.error("History detail fetch error:", result);
            }
        } catch (error) {
            console.error('Error fetching history detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'ไม่ระบุ';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAnswerStatus = (studentQuestion: any, homeworkQuestion: any) => {
        // Check if questions match by ID first
        if (studentQuestion.id !== homeworkQuestion?.id) {
            return {
                isCorrect: false,
                correctAnswer: 'คำถามไม่ตรงกัน',
                studentAnswer: studentQuestion.selected_answer || 'ไม่ได้ตอบ',
                error: 'Question ID mismatch'
            };
        }
        
        if (studentQuestion.question_type === 'multiple_choice') {
            const studentSelectedIndex = studentQuestion.selected_option_index;
            const correctIndex = homeworkQuestion.correct_option_index;
            const isCorrect = studentSelectedIndex === correctIndex;

            return {
                isCorrect,
                correctAnswer: homeworkQuestion.options?.[correctIndex] || 'ไม่พบคำตอบที่ถูก',
                studentAnswer: studentQuestion.selected_answer || studentQuestion.options?.[studentSelectedIndex] || 'ไม่ได้ตอบ',
                correctIndex,
                studentSelectedIndex
            };
        } else if (studentQuestion.question_type === 'fill_in_blank') {
            const studentAnswer = studentQuestion.selected_answer || studentQuestion.answer;
            // For fill_in_blank, we cannot determine correctness without correct_answer
            // Since we're removing correct_answer usage, mark as unable to check
            
            return {
                isCorrect: false,
                correctAnswer: 'ไม่รองรับการตรวจอัตนัย',
                studentAnswer: studentAnswer || 'ไม่ได้ตอบ',
                error: 'Cannot check fill_in_blank without correct_answer'
            };
        }
        
        return {
            isCorrect: false,
            correctAnswer: 'ประเภทคำถามไม่รู้จัก',
            studentAnswer: studentQuestion.selected_answer || 'ไม่ได้ตอบ'
        };
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-[#203D4F] p-6 text-left align-middle shadow-xl transition-all border-4 border-[#2D4A5B]">
                                <Dialog.Title as="div" className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">
                                            รายละเอียดการส่งงาน - {studentName}
                                        </h3>
                                        <p className="text-[#80ED99] mt-1">
                                            {historyDetail?.homework_name || 'กำลังโหลด...'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="rounded-md p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </Dialog.Title>

                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#80ED99]"></div>
                                    </div>
                                ) : historyDetail ? (
                                    <div className="max-h-[70vh] overflow-y-auto space-y-6">
                                        {/* Student & Homework Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[#2D4A5B] p-4 rounded-lg">
                                                <h4 className="text-white font-semibold mb-3">ข้อมูลนักเรียน</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="text-[#80ED99]">ชื่อ: </span>
                                                        <span className="text-white">{historyDetail.student_name || 'ไม่ระบุ'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#80ED99]">อีเมล: </span>
                                                        <span className="text-white">{historyDetail.student_email || 'ไม่ระบุ'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#80ED99]">ห้องเรียน: </span>
                                                        <span className="text-white">{historyDetail.class_name || 'ไม่ระบุ'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-[#2D4A5B] p-4 rounded-lg">
                                                <h4 className="text-white font-semibold mb-3">ข้อมูลการส่ง</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="text-[#80ED99]">วันที่ส่ง: </span>
                                                        <span className="text-white">{formatDateTime(historyDetail.a_submission_time || '')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#80ED99]">คะแนน: </span>
                                                        <span className="text-white">{historyDetail.a_score || 0} คะแนน</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#80ED99]">สถานะ: </span>
                                                        <span className="text-green-400 font-medium">เสร็จสิ้น</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Questions and Answers */}
                                        {historyDetail.a_homework?.content?.questions && historyDetail.homework_content?.questions && (
                                            <div className="bg-[#2D4A5B] p-4 rounded-lg">
                                                <h4 className="text-white font-semibold mb-4">รายละเอียดคำถามและคำตอบ</h4>
                                                <div className="space-y-6">
                                                    {historyDetail.a_homework.content.questions.map((studentQuestion: any, index: number) => {
                                                        const homeworkQuestion = historyDetail.homework_content.questions.find((hq: any) => hq.id === studentQuestion.id);
                                                        const answerStatus = getAnswerStatus(studentQuestion, homeworkQuestion);
                                                        
                                                        return (
                                                            <div key={index} className={`bg-[#203D4F] p-4 rounded-lg border-l-4 ${
                                                                answerStatus.error
                                                                    ? 'border-yellow-500'
                                                                    : answerStatus.isCorrect 
                                                                        ? 'border-green-400' 
                                                                        : 'border-red-400'
                                                            }`}>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h5 className="text-[#80ED99] font-medium text-lg">ข้อที่ {index + 1}</h5>
                                                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                                        answerStatus.error
                                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                                            : answerStatus.isCorrect 
                                                                                ? 'bg-green-500/20 text-green-400' 
                                                                                : 'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                        {answerStatus.error ? '⚠ ข้อมูลไม่ตรง' : answerStatus.isCorrect ? '✓ ถูก' : '✗ ผิด'}
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Question with KaTeX */}
                                                                <div className="mb-4">
                                                                    <div className="text-white font-medium mb-2">คำถาม:</div>
                                                                    <div className="text-white bg-[#2D4A5B] p-3 rounded-lg">
                                                                        <MathText className="text-white">{studentQuestion.question}</MathText>
                                                                    </div>
                                                                </div>

                                                                {/* Show error if questions don't match */}
                                                                {answerStatus.error && (
                                                                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                                                        <div className="text-yellow-400 text-sm">
                                                                            ⚠ ไม่พบคำถามที่ตรงกันในชุดข้อสอบ (ID: {studentQuestion.id})
                                                                        </div>
                                                                        {homeworkQuestion && (
                                                                            <div className="text-white/60 text-xs mt-2">
                                                                                คำถามที่ใกล้เคียง: <MathText>{homeworkQuestion.question}</MathText>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Options for multiple choice - only show if questions match */}
                                                                {!answerStatus.error && studentQuestion.question_type === 'multiple_choice' && studentQuestion.options && (
                                                                    <div className="mb-4">
                                                                        <div className="text-white font-medium mb-2">ตัวเลือก:</div>
                                                                        <div className="space-y-2">
                                                                            {studentQuestion.options.map((option: any, optIndex: number) => (
                                                                                <div 
                                                                                    key={optIndex} 
                                                                                    className={`p-3 rounded-lg text-sm border ${
                                                                                        optIndex === homeworkQuestion?.correct_option_index
                                                                                            ? 'border-green-500 bg-green-500/10 text-green-400'
                                                                                            : optIndex === studentQuestion.selected_option_index
                                                                                                ? 'border-red-500 bg-red-500/10 text-red-400'
                                                                                                : 'border-gray-600 bg-gray-700/50 text-gray-300'
                                                                                    }`}
                                                                                >
                                                                                    <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                                                                                    <span className="ml-2">
                                                                                        <MathText>{typeof option === 'string' ? option : option}</MathText>
                                                                                    </span>
                                                                                    {optIndex === homeworkQuestion?.correct_option_index && (
                                                                                        <span className="ml-2 text-green-400 font-bold">(คำตอบที่ถูก)</span>
                                                                                    )}
                                                                                    {optIndex === studentQuestion.selected_option_index && optIndex !== homeworkQuestion?.correct_option_index && (
                                                                                        <span className="ml-2 text-red-400 font-bold">(คำตอบของนักเรียน)</span>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Answer comparison */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-[#2D4A5B] p-3 rounded-lg">
                                                                        <div className="text-green-400 font-medium mb-1">คำตอบที่ถูก:</div>
                                                                        <div className="text-white text-sm">
                                                                            <MathText>{answerStatus.correctAnswer}</MathText>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-[#2D4A5B] p-3 rounded-lg">
                                                                        <div className={`font-medium mb-1 ${
                                                                            answerStatus.isCorrect ? 'text-green-400' : 'text-red-400'
                                                                        }`}>
                                                                            คำตอบของนักเรียน:
                                                                        </div>
                                                                        <div className="text-white text-sm">
                                                                            <MathText>{answerStatus.studentAnswer}</MathText>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="text-white/60 text-center">
                                            <p>ไม่สามารถโหลดข้อมูลได้</p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        className="px-6 py-2 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 cursor-pointer"
                                        onClick={onClose}
                                    >
                                        ปิด
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}