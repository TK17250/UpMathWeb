'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon, DocumentTextIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface Question {
    id: number;
    question: string;
    question_type: string;
    options?: string[];
    correct_answer: string;
    correct_option_index?: number;
    explanation: string;
    score: number;
    difficulty: string;
}

interface QuestionsData {
    metadata: {
        total_questions: number;
        total_score: number;
        level: string;
        subject: string;
        type: string;
        bloom_taxonomy: string;
        created_at: string;
    };
    questions: Question[];
}

interface QuestionsPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    questionsData: QuestionsData | null;
    onSave: (data: QuestionsData) => void;
}

export default function QuestionsPreviewModal({ 
    isOpen, 
    onClose, 
    questionsData, 
    onSave 
}: QuestionsPreviewModalProps) {
    const [editableData, setEditableData] = useState<QuestionsData | null>(null);
    const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (questionsData) {
            setEditableData(JSON.parse(JSON.stringify(questionsData)));
        }
    }, [questionsData]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
            setActiveTab('preview');
        }, 300);
    };

    const handleSave = () => {
        if (editableData) {
            onSave(editableData);
            handleClose();
        }
    };

    const updateQuestionScore = (questionId: number, newScore: number) => {
        if (!editableData) return;

        const updatedData = {
            ...editableData,
            questions: editableData.questions.map(q => 
                q.id === questionId ? { ...q, score: newScore } : q
            )
        };

        // Update total score
        const totalScore = updatedData.questions.reduce((sum, q) => sum + q.score, 0);
        updatedData.metadata.total_score = totalScore;

        setEditableData(updatedData);
    };

    const updateQuestionContent = (questionId: number, field: keyof Question, value: any) => {
        if (!editableData) return;

        const updatedData = {
            ...editableData,
            questions: editableData.questions.map(q => 
                q.id === questionId ? { ...q, [field]: value } : q
            )
        };

        setEditableData(updatedData);
    };

    const exportQuestions = (includeAnswers: boolean = false) => {
        if (!editableData) return;

        const exportData = {
            metadata: editableData.metadata,
            questions: editableData.questions.map(q => ({
                id: q.id,
                question: q.question,
                question_type: q.question_type,
                options: q.options,
                ...(includeAnswers && {
                    correct_answer: q.correct_answer,
                    correct_option_index: q.correct_option_index,
                    explanation: q.explanation
                }),
                score: q.score,
                difficulty: q.difficulty
            }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `questions_${includeAnswers ? 'with_answers' : 'only'}_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const downloadPDF = (includeAnswers: boolean = false) => {
        if (!editableData) return;

        // Create a confirmation dialog
        const confirmed = window.confirm(
            includeAnswers 
                ? 'ดาวน์โหลดโจทย์พร้อมคำตอบและวิธีทำเป็นไฟล์ PDF?' 
                : 'ดาวน์โหลดเฉพาะโจทย์เป็นไฟล์ PDF?'
        );

        if (confirmed) {
            // Here you would typically call an API to generate PDF
            // For now, we'll show an alert
            alert(`กำลังเตรียมไฟล์ PDF ${includeAnswers ? 'พร้อมคำตอบ' : 'เฉพาะโจทย์'}...`);
            
            // TODO: Implement PDF generation
            // This could be done with libraries like jsPDF or by sending data to a server endpoint
        }
    };

    if (!isOpen || !editableData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                @keyframes slideOut {
                    from {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: scale(0.95) translateY(20px);
                    }
                }
            `}</style>

            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 ${isExiting
                    ? 'animate-[fadeOut_300ms_ease-in-out_forwards]'
                    : 'animate-[fadeIn_300ms_ease-in-out_forwards]'
                    }`}
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                className={`relative bg-[#2D4A5B] rounded-xl w-11/12 max-w-6xl max-h-[90vh] overflow-hidden ${isExiting
                    ? 'animate-[slideOut_300ms_cubic-bezier(0.4,0,0.2,1)_forwards]'
                    : 'animate-[slideIn_300ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]'
                    } transform-gpu`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#203D4F]">
                    <div>
                        <h2 className="text-2xl font-bold text-white">โจทย์ที่สร้างแล้ว</h2>
                        <p className="text-gray-300 mt-1">
                            {editableData.metadata.subject} - &nbsp;
                            {editableData.metadata.level} | &nbsp;
                            {editableData.metadata.total_questions} ข้อ | &nbsp;
                            {editableData.metadata.total_score} คะแนน
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#203D4F]">
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'preview' 
                                ? 'text-[#80ED99] border-b-2 border-[#80ED99]' 
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        <DocumentTextIcon className="w-5 h-5 inline mr-2" />
                        ดูโจทย์
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'edit' 
                                ? 'text-[#80ED99] border-b-2 border-[#80ED99]' 
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        <AcademicCapIcon className="w-5 h-5 inline mr-2" />
                        แก้ไข
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
                    {activeTab === 'preview' ? (
                        <div className="space-y-6">
                            {editableData.questions.map((question, index) => (
                                <div key={question.id} className="bg-[#203D4F] rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-semibold text-white">
                                            ข้อที่ {index + 1}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-300">
                                                {question.score} คะแนน
                                            </span>
                                            <span className="text-xs bg-[#80ED99] text-[#002D4A] px-2 py-1 rounded">
                                                {question.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-white mb-4">
                                        <p className="mb-3">{question.question}</p>
                                        
                                        {question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((option, optIndex) => (
                                                    <div 
                                                        key={optIndex} 
                                                        className={`p-2 rounded ${
                                                            optIndex === question.correct_option_index 
                                                                ? 'bg-green-600/20 border border-green-400' 
                                                                : 'bg-[#2D4A5B] border border-[#002D4A]'
                                                        }`}
                                                    >
                                                        {optIndex + 1}. {option}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-[#002D4A] pt-3">
                                        <h4 className="text-sm font-medium text-[#80ED99] mb-2">คำตอบ:</h4>
                                        <p className="text-green-300 text-sm mb-2">{question.correct_answer}</p>
                                        <h4 className="text-sm font-medium text-[#80ED99] mb-2">วิธีทำ:</h4>
                                        <p className="text-gray-300 text-sm">{question.explanation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {editableData.questions.map((question, index) => (
                                <div key={question.id} className="bg-[#203D4F] rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-semibold text-white">
                                            ข้อที่ {index + 1}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={question.score}
                                                onChange={(e) => updateQuestionScore(question.id, parseFloat(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 text-sm bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99]"
                                            />
                                            <span className="text-sm text-gray-300">คะแนน</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-[#80ED99] mb-1">
                                                โจทย์
                                            </label>
                                            <textarea
                                                value={question.question}
                                                onChange={(e) => updateQuestionContent(question.id, 'question', e.target.value)}
                                                className="w-full px-3 py-2 bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99] resize-none"
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[#80ED99] mb-1">
                                                คำตอบ
                                            </label>
                                            <input
                                                type="text"
                                                value={question.correct_answer}
                                                onChange={(e) => updateQuestionContent(question.id, 'correct_answer', e.target.value)}
                                                className="w-full px-3 py-2 bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[#80ED99] mb-1">
                                                วิธีทำ
                                            </label>
                                            <textarea
                                                value={question.explanation}
                                                onChange={(e) => updateQuestionContent(question.id, 'explanation', e.target.value)}
                                                className="w-full px-3 py-2 bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99] resize-none"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="lg:flex items-center justify-between p-6 border-t border-[#203D4F] overflow-y-scroll md:overflow-y-auto">
                    <div className="text-sm text-gray-300 lg:mb-0 mb-4">
                        คะแนนรวม: {editableData.metadata.total_score} คะแนน
                    </div>
                    <div className="md:flex space-x-3">
                        <button
                            onClick={() => downloadPDF(false)}
                            className="px-4 py-2 bg-[#203D4F] text-white rounded-md hover:bg-[#152b3a] transition-colors cursor-pointer mb-3 md:mb-0"
                        >
                            ดาวน์โหลดโจทย์ PDF
                        </button>
                        <button
                            onClick={() => downloadPDF(true)}
                            className="px-4 py-2 bg-[#203D4F] text-white rounded-md hover:bg-[#152b3a] transition-colors cursor-pointer mb-3 md:mb-0"
                        >
                            ดาวน์โหลดพร้อมเฉลย PDF
                        </button>
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-[#203D4F] text-white rounded-md hover:bg-[#152b3a] transition-colors cursor-pointer mb-3 md:mb-0"
                        >
                            ปิด
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-[#80ED99] text-[#002D4A] rounded-md hover:bg-[#6ee085] transition-colors font-medium cursor-pointer"
                        >
                            บันทึกการแก้ไข
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
