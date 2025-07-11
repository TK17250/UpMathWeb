'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon, DocumentTextIcon, AcademicCapIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import KaTeXRenderer, { MathText, MathDisplay } from '@/utils/katexRenderer';
import { downloadPDF as generatePDF } from '@/utils/pdfGenerator';
import 'katex/dist/katex.min.css';

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
    const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (questionsData) {
            const processedData = JSON.parse(JSON.stringify(questionsData));
            
            // Fix any inconsistencies between correct_answer and correct_option_index
            processedData.questions = processedData.questions.map((question: Question) => {
                if (question.options && question.correct_answer) {
                    const correctIndex = question.options.findIndex(option => option === question.correct_answer);
                    if (correctIndex !== -1 && correctIndex !== question.correct_option_index) {
                        question.correct_option_index = correctIndex;
                    }
                }
                return question;
            });
            
            setEditableData(processedData);
            // เปิดข้อแรกโดยอัตโนมัติ
            const firstQuestionId = processedData.questions[0]?.id;
            if (firstQuestionId) {
                setExpandedQuestions({ [firstQuestionId]: true });
            }
        }
    }, [questionsData]);

    // Toggle question expansion
    const toggleQuestion = (questionId: number) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    // Expand all questions
    const expandAll = () => {
        if (!editableData) return;
        const allExpanded = editableData.questions.reduce((acc, q) => {
            acc[q.id] = true;
            return acc;
        }, {} as Record<number, boolean>);
        setExpandedQuestions(allExpanded);
    };

    // Collapse all questions
    const collapseAll = () => {
        setExpandedQuestions({});
    };

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
            questions: editableData.questions.map(q => {
                if (q.id === questionId) {
                    const updatedQuestion = { ...q, [field]: value };
                    
                    // If options are updated, ensure correct_option_index matches correct_answer
                    if (field === 'options' && updatedQuestion.options && updatedQuestion.correct_answer) {
                        const correctIndex = updatedQuestion.options.findIndex(option => option === updatedQuestion.correct_answer);
                        if (correctIndex !== -1) {
                            updatedQuestion.correct_option_index = correctIndex;
                        }
                    }
                    
                    return updatedQuestion;
                }
                return q;
            })
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

    const downloadPDF = async (includeAnswers: boolean = false) => {
        try {
            if (!editableData) return;
            await generatePDF(editableData, includeAnswers);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองอีกครั้ง');
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
                        <div className="mt-2 px-3 py-1 bg-green-600/20 border border-green-500/30 rounded-md">
                            <p className="text-green-400 text-sm flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                ข้อมูลได้ถูกบันทึกลงฐานข้อมูลเรียบร้อยแล้ว
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* PDF Download Buttons */}
                        <button
                            onClick={() => downloadPDF(false)}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                            title="ดาวน์โหลดโจทย์ PDF"
                        >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                            <span>โจทย์ PDF</span>
                        </button>
                        <button
                            onClick={() => downloadPDF(true)}
                            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                            title="ดาวน์โหลดโจทย์พร้อมเฉลย PDF"
                        >
                            <DocumentArrowDownIcon className="w-4 h-4" />
                            <span>พร้อมเฉลย PDF</span>
                        </button>
                        <button
                            onClick={handleClose}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-between items-center border-b border-[#203D4F]">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'preview' 
                                    ? 'text-[#80ED99] border-b-2 border-[#80ED99]' 
                                    : 'text-gray-300 hover:text-white cursor-pointer'
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
                                    : 'text-gray-300 hover:text-white cursor-pointer'
                            }`}
                        >
                            <AcademicCapIcon className="w-5 h-5 inline mr-2" />
                            แก้ไข
                        </button>
                    </div>
                    
                    {/* Expand/Collapse Controls */}
                    <div className="flex space-x-2 px-4">
                        <button
                            onClick={expandAll}
                            className="px-3 py-1 text-xs bg-[#80ED99] text-[#002D4A] rounded hover:bg-[#6ee085] transition-colors cursor-pointer"
                        >
                            เปิดทั้งหมด
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-3 py-1 text-xs bg-[#203D4F] text-white rounded hover:bg-[#152b3a] transition-colors cursor-pointer"
                        >
                            ปิดทั้งหมด
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
                    {activeTab === 'preview' ? (
                        <div className="space-y-4">
                            {editableData.questions.map((question, index) => {
                                const isExpanded = expandedQuestions[question.id];
                                return (
                                    <div key={question.id} className="bg-[#203D4F] rounded-lg overflow-hidden">
                                        {/* Question Header - Always Visible */}
                                        <div 
                                            className="flex justify-between items-center p-4 cursor-pointer hover:bg-[#2a4f63] transition-colors"
                                            onClick={() => toggleQuestion(question.id)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center space-x-2">
                                                    <svg 
                                                        className={`w-5 h-5 text-[#80ED99] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <h3 className="text-lg font-semibold text-white">
                                                        ข้อที่ {index + 1}
                                                    </h3>
                                                </div>
                                                <span className="text-sm text-gray-300 bg-[#2D4A5B] px-2 py-1 rounded">
                                                    {question.score} คะแนน
                                                </span>
                                                <span className="text-xs bg-[#80ED99] text-[#002D4A] px-2 py-1 rounded">
                                                    {question.difficulty}
                                                </span>
                                            </div>
                                            
                                            <span className="text-sm text-gray-400">
                                                {isExpanded ? 'คลิกเพื่อปิด' : 'คลิกเพื่อดูรายละเอียด'}
                                            </span>
                                        </div>
                                        
                                        {/* Question Content - Expandable */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 border-t border-[#2D4A5B]">
                                                <div className="pt-4">
                                                    <div className="text-white mb-4">
                                                        <h4 className="text-sm font-medium text-[#80ED99] mb-2">โจทย์:</h4>
                                                        <div className="mb-3 bg-[#2D4A5B] p-3 rounded">
                                                            <MathText>{question.question}</MathText>
                                                        </div>
                                                        
                                                        {question.options && (
                                                            <div className="space-y-2 mb-4">
                                                                <h4 className="text-sm font-medium text-[#80ED99] mb-2">ตัวเลือก:</h4>
                                                                {question.options.map((option, optIndex) => (
                                                                    <div 
                                                                        key={optIndex} 
                                                                        className={`p-2 rounded ${
                                                                            optIndex === question.correct_option_index 
                                                                                ? 'bg-green-600/20 border border-green-400' 
                                                                                : 'bg-[#2D4A5B] border border-[#002D4A]'
                                                                        }`}
                                                                    >
                                                                        <span className="mr-2">{optIndex + 1}.</span>
                                                                        <MathText>{option}</MathText>
                                                                        {optIndex === question.correct_option_index && (
                                                                            <span className="ml-2 text-xs text-green-400">✓ คำตอบที่ถูก</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="border-t border-[#002D4A] pt-3">
                                                        <h4 className="text-sm font-medium text-[#80ED99] mb-2">คำตอบ:</h4>
                                                        <div className="text-green-300 text-sm mb-3 bg-[#2D4A5B] p-2 rounded">
                                                            <MathText>{question.correct_answer}</MathText>
                                                        </div>
                                                        <h4 className="text-sm font-medium text-[#80ED99] mb-2">วิธีทำ:</h4>
                                                        <div className="text-gray-300 text-sm bg-[#2D4A5B] p-3 rounded leading-relaxed">
                                                            <MathText>{question.explanation}</MathText>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {editableData.questions.map((question, index) => {
                                const isExpanded = expandedQuestions[question.id];
                                return (
                                    <div key={question.id} className="bg-[#203D4F] rounded-lg overflow-hidden">
                                        {/* Question Header - Always Visible */}
                                        <div 
                                            className="flex justify-between items-center p-4 cursor-pointer hover:bg-[#2a4f63] transition-colors"
                                            onClick={() => toggleQuestion(question.id)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center space-x-2">
                                                    <svg 
                                                        className={`w-5 h-5 text-[#80ED99] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <h3 className="text-lg font-semibold text-white">
                                                        ข้อที่ {index + 1}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        value={question.score}
                                                        onChange={(e) => updateQuestionScore(question.id, parseFloat(e.target.value) || 0)}
                                                        className="w-16 px-2 py-1 text-sm bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99]"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <span className="text-sm text-gray-300">คะแนน</span>
                                                </div>
                                            </div>
                                            
                                            <span className="text-sm text-gray-400">
                                                {isExpanded ? 'คลิกเพื่อปิด' : 'คลิกเพื่อแก้ไข'}
                                            </span>
                                        </div>
                                        
                                        {/* Edit Form - Expandable */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 border-t border-[#2D4A5B]">
                                                <div className="pt-4 space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-[#80ED99] mb-2">
                                                            โจทย์
                                                        </label>
                                                        <textarea
                                                            value={question.question}
                                                            onChange={(e) => updateQuestionContent(question.id, 'question', e.target.value)}
                                                            className="w-full px-3 py-2 bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99] resize-none"
                                                            rows={4}
                                                        />
                                                    </div>

                                                    {question.options && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-[#80ED99] mb-2">
                                                                ตัวเลือก
                                                            </label>
                                                            <div className="space-y-2">
                                                                {question.options.map((option, optIndex) => (
                                                                    <div key={optIndex} className="flex items-center space-x-2">
                                                                        <span className="text-white text-sm w-6">{optIndex + 1}.</span>
                                                                        <input
                                                                            type="text"
                                                                            value={option}
                                                                            onChange={(e) => {
                                                                                const newOptions = [...question.options!];
                                                                                newOptions[optIndex] = e.target.value;
                                                                                updateQuestionContent(question.id, 'options', newOptions);
                                                                                
                                                                                // Update correct_answer if this is the selected option
                                                                                if (optIndex === question.correct_option_index) {
                                                                                    updateQuestionContent(question.id, 'correct_answer', e.target.value);
                                                                                }
                                                                            }}
                                                                            className={`flex-1 px-3 py-2 text-white rounded border focus:border-[#80ED99] ${
                                                                                optIndex === question.correct_option_index 
                                                                                    ? 'bg-green-600/20 border-green-400' 
                                                                                    : 'bg-[#2D4A5B] border-[#002D4A]'
                                                                            }`}
                                                                        />
                                                                        {optIndex === question.correct_option_index && (
                                                                            <span className="text-green-400 text-sm">✓</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="block text-sm font-medium text-[#80ED99] mb-2">
                                                            คำตอบ
                                                        </label>
                                                        
                                                        {/* Multiple choice - show dropdown */}
                                                        {question.options && question.options.length > 0 ? (
                                                            <div className="space-y-2">
                                                                <select
                                                                    value={question.correct_answer || question.options[0]}
                                                                    onChange={(e) => {
                                                                        const selectedValue = e.target.value;
                                                                        const selectedIndex = question.options!.findIndex(option => option === selectedValue);
                                                                        updateQuestionContent(question.id, 'correct_option_index', selectedIndex);
                                                                        updateQuestionContent(question.id, 'correct_answer', selectedValue);
                                                                    }}
                                                                    className="w-full px-3 py-2 bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99]"
                                                                >
                                                                    {question.options.map((option, index) => (
                                                                        <option key={index} value={option}>
                                                                            {option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : (
                                                            // Open-ended question - show text input
                                                            <textarea
                                                                value={question.correct_answer}
                                                                onChange={(e) => updateQuestionContent(question.id, 'correct_answer', e.target.value)}
                                                                className="w-full px-3 py-2 bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99] resize-none"
                                                                rows={3}
                                                                placeholder="คำตอบสำหรับโจทย์อัตนัย"
                                                            />
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-[#80ED99] mb-2">
                                                            วิธีทำ
                                                        </label>
                                                        <textarea
                                                            value={question.explanation}
                                                            onChange={(e) => updateQuestionContent(question.id, 'explanation', e.target.value)}
                                                            className="w-full px-3 py-2 bg-[#2D4A5B] text-white rounded border border-[#002D4A] focus:border-[#80ED99] resize-none"
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="lg:flex items-center justify-between p-6 border-t border-[#203D4F] overflow-y-scroll md:overflow-y-auto">
                    <div className="text-sm text-gray-300 lg:mb-0 mb-4">
                        <div className="flex items-center space-x-4">
                            <span>คะแนนรวม: {editableData.metadata.total_score} คะแนน</span>
                            <span className="text-[#80ED99]">
                                เปิดแล้ว: {Object.values(expandedQuestions).filter(Boolean).length}/{editableData.questions.length} ข้อ
                            </span>
                        </div>
                    </div>
                    <div className="md:flex space-x-3">
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
                            ยืนยันและปิด
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
