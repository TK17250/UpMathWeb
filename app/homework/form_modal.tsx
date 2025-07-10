'use client';
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFormStatus } from 'react-dom';
import QuestionsPreviewModal from './questions_preview_modal';

// Define the prop types for CreateHomeworkModal component
interface CreateHomeworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    formAction: any;
}

// Submit button with loading state
function SubmitButton({ isGenerating, homeworkName, onValidationFailed }: { 
    isGenerating: boolean;
    homeworkName: string;
    onValidationFailed: () => void;
}) {
    const { pending } = useFormStatus();

    const handleClick = (e: React.MouseEvent) => {
        if (!homeworkName.trim()) {
            e.preventDefault();
            onValidationFailed();
            alert('กรุณากรอกชื่อชุดฝึก');
            return;
        }
    };

    return (
        <button
            type="submit"
            disabled={pending || isGenerating}
            onClick={handleClick}
            className={`rounded-md bg-[#203D4F] px-6 md:px-10 py-1.5 text-sm/6 text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300 ${(pending || isGenerating) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
        >
            {pending ? 'กำลังสร้างโจทย์...' : 'สร้างชุดฝึก'}
        </button>
    );
}

export default function CreateHomeworkModal({ isOpen, onClose, formAction }: CreateHomeworkModalProps) {
    // State for form inputs
    const [homeworkName, setHomeworkName] = useState('');
    const [subject, setSubject] = useState('คณิตศาสตร์');
    const [level, setLevel] = useState('มัธยมศึกษาปีที่ 4');
    const [bloomtax, setBloomtax] = useState('จดจำ');
    const [exerciseType, setExerciseType] = useState('ปรนัย');
    const [totalQuestions, setTotalQuestions] = useState('10');
    const [content, setContent] = useState('');
    const formRef = useRef<HTMLFormElement>(null);

    // Animation states
    const [isExiting, setIsExiting] = useState<boolean>(false);
    
    // Questions preview modal state
    const [showQuestionsPreview, setShowQuestionsPreview] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // If close modal, reset the form
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Handle action response
    useEffect(() => {
        // Check if we have an action result and we're currently generating
        if (isGenerating && formAction && typeof formAction === 'function') {
            // Reset generating state
            setIsGenerating(false);
        }
    }, [formAction, isGenerating]);

    // Handle questions save
    const handleQuestionsSave = async (questionsData: any) => {
        try {
            // Call the actual form action to save to database
            const formData = new FormData(formRef.current!);
            formData.set('h_content', JSON.stringify(questionsData));
            
            const result = await formAction(null, formData);
            
            if (result && result.type === 'success') {
                alert('บันทึกชุดฝึกเรียบร้อยแล้ว');
                handleClose();
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (error) {
            console.error('Error saving homework:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Reset form fields
    const resetForm = () => {
        setHomeworkName('');
        setSubject('คณิตศาสตร์');
        setLevel('มัธยมศึกษาปีที่ 4');
        setBloomtax('จดจำ');
        setExerciseType('ปรนัย');
        setTotalQuestions('10');
        setContent('');
        setGeneratedQuestions(null);
        setShowQuestionsPreview(false);
        setIsGenerating(false);
        if (formRef.current) {
            formRef.current.reset();
        }
    };

    // Handle modal close with animation
    const handleClose = () => {
        setIsExiting(true);

        // Wait for exit animation to complete
        setTimeout(() => {
            onClose();
            resetForm();
            setIsExiting(false);
        }, 300);
    };

    // If modal is not open, don't render anything
    if (!isOpen) return null;
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
                
                @keyframes zoomIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                
                @keyframes zoomOut {
                    from {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
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
            ></div>

            {/* Modal Content */}
            <div
                className={`modal-content relative bg-[#2D4A5B] rounded-xl p-8 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto ${isExiting
                    ? 'animate-[zoomOut_300ms_cubic-bezier(0.4,0,0.2,1)_forwards]'
                    : 'animate-[zoomIn_300ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]'
                    } transform-gpu`}
            >
                {/* Close button */}
                <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-md bg-[#2D4A5B] text-white hover:text-gray-300 focus:outline-hidden cursor-pointer transition-all duration-300 outline-none"
                    >
                        <span className="sr-only">ปิด</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                    </button>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">สร้างชุดฝึก</h2>

                <form
                    ref={formRef}
                    action={formAction}
                >
                    {/* Hidden input for generate questions flag */}
                    <input 
                        type="hidden" 
                        name="generate_questions" 
                        value="true" 
                    />
                    
                    {/* Homework Name */}
                    <div className="mb-4">
                        <label htmlFor="homeworkName" className="block text-white mb-1">ชื่อชุดฝึก</label>
                        <input
                            type="text"
                            id="homeworkName"
                            name="h_name"
                            value={homeworkName}
                            onChange={(e) => setHomeworkName(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                            required
                            autoComplete="off"
                        />
                    </div>

                    {/* Subject */}
                    <div className="mb-4">
                        <label htmlFor="subject" className="block text-white mb-1">วิชา</label>
                        <select
                            id="subject"
                            name="h_subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                            required
                        >
                            <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                            <option value="คณิตศาสตร์เพิ่มเติม">คณิตศาสตร์เพิ่มเติม</option>
                            <option value="เลขคณิต">เลขคณิต</option>
                            <option value="พีชคณิต">พีชคณิต</option>
                            <option value="เรขาคณิต">เรขาคณิต</option>
                            <option value="ตรีโกณมิติ">ตรีโกณมิติ</option>
                            <option value="แคลคูลัส">แคลคูลัส</option>
                        </select>
                    </div>

                    {/* Form row for level, bloom taxonomy, exercise type, total questions, and score */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {/* Level */}
                        <div>
                            <label htmlFor="level" className="block text-white mb-1">ระดับ</label>
                            <select
                                id="level"
                                name="h_level"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                            >
                                <option value="มัธยมศึกษาปีที่ 4">ม.4</option>
                                <option value="มัธยมศึกษาปีที่ 5">ม.5</option>
                                <option value="มัธยมศึกษาปีที่ 6">ม.6</option>
                            </select>
                        </div>

                        {/* Bloom Taxonomy */}
                        <div>
                            <label htmlFor="subjectDetail" className="block text-white mb-1">ระดับขั้นของโจทย์</label>
                            <select
                                id="subjectDetail"
                                name="h_bloomtax"
                                value={bloomtax}
                                onChange={(e) => setBloomtax(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                            >
                                <option value="จดจำ">จดจำ</option>
                                <option value="เข้าใจ">เข้าใจ</option>
                                <option value="ประยุกต์">ประยุกต์</option>
                                <option value="วิเคราะห์">วิเคราะห์</option>
                                <option value="สังเคราะห์">สังเคราะห์</option>
                                <option value="ประเมิน">ประเมิน</option>
                            </select>
                        </div>

                        {/* Exercise Type */}
                        <div>
                            <label htmlFor="exerciseType" className="block text-white mb-1">รูปแบบ</label>
                            <select
                                id="exerciseType"
                                name="h_type"
                                value={exerciseType}
                                onChange={(e) => setExerciseType(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                                required
                            >
                                <option value="ปรนัย">ปรนัย</option>
                                <option value="อัตนัย">อัตนัย</option>
                                <option value="ทั้งคู่">ทั้งคู่</option>
                            </select>
                        </div>

                        {/* Total Questions */}
                        <div>
                            <label htmlFor="totalQuestions" className="block text-white mb-1">จำนวนข้อ</label>
                            <input
                                type="number"
                                id="totalQuestions"
                                name="h_total_questions"
                                value={totalQuestions}
                                onChange={(e) => setTotalQuestions(e.target.value)}
                                min="1"
                                className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                                required
                            />
                        </div>
                    </div>

                    {/* Content Description */}
                    <div className="mb-4">
                        <label htmlFor="content" className="block text-white mb-1">
                            คำอธิบาย (ไม่บังคับ)
                        </label>
                        <textarea
                            id="content"
                            name="h_content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200 resize-none"
                            placeholder="อธิบายรายละเอียดของชุดฝึกนี้..."
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end mt-6 space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-[#203D4F] text-white rounded-md hover:bg-[#152b3a] transition-all duration-300 cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <SubmitButton 
                            isGenerating={isGenerating} 
                            homeworkName={homeworkName}
                            onValidationFailed={() => setIsGenerating(false)}
                        />
                    </div>
                </form>
            </div>
            
            {/* Questions Preview Modal */}
            <QuestionsPreviewModal
                isOpen={showQuestionsPreview}
                onClose={() => setShowQuestionsPreview(false)}
                questionsData={generatedQuestions}
                onSave={handleQuestionsSave}
            />
        </div>
    );
}