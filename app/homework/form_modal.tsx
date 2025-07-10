'use client';
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import QuestionsPreviewModal from './questions_preview_modal';

// Define the prop types for CreateHomeworkModal component
interface CreateHomeworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    formAction: any;
}

// Submit button with loading state
function SubmitButton({ isGenerating, homeworkName, onValidationFailed, selectedBloomTaxonomies }: { 
    isGenerating: boolean;
    homeworkName: string;
    onValidationFailed: () => void;
    selectedBloomTaxonomies: string[];
}) {
    return (
        <button
            type="submit"
            disabled={isGenerating}
            className={`rounded-md bg-[#203D4F] px-6 md:px-10 py-1.5 text-sm/6 text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#203D4F] border-2 hover:border-[#80ED99] transition-all duration-300 ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
        >
            {isGenerating ? 'กำลังสร้างโจทย์...' : 'สร้างชุดฝึก'}
        </button>
    );
}

export default function CreateHomeworkModal({ isOpen, onClose, formAction }: CreateHomeworkModalProps) {
    // State for form inputs
    const [homeworkName, setHomeworkName] = useState('');
    const [subject, setSubject] = useState('คณิตศาสตร์');
    const [level, setLevel] = useState('มัธยมศึกษาปีที่ 4');
    const [bloomtax, setBloomtax] = useState('จดจำ');
    const [selectedBloomTaxonomies, setSelectedBloomTaxonomies] = useState<string[]>(['จดจำ']);
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
    const [showGeneratingBackdrop, setShowGeneratingBackdrop] = useState(false);

    // Available Bloom's Taxonomy options
    const allBloomTaxonomies = ['จดจำ', 'เข้าใจ', 'ประยุกต์', 'วิเคราะห์', 'ประเมิน', 'สร้างสรรค์'];
    
    // Get available options (not yet selected)
    const availableBloomTaxonomies = allBloomTaxonomies.filter(
        taxonomy => !selectedBloomTaxonomies.includes(taxonomy)
    );

    // Handle adding Bloom's Taxonomy
    const handleAddBloomTaxonomy = () => {
        if (bloomtax && !selectedBloomTaxonomies.includes(bloomtax)) {
            setSelectedBloomTaxonomies([...selectedBloomTaxonomies, bloomtax]);
            // Set to first available option or empty
            const nextAvailable = availableBloomTaxonomies.find(t => t !== bloomtax);
            setBloomtax(nextAvailable || '');
        }
    };

    // Handle removing Bloom's Taxonomy
    const handleRemoveBloomTaxonomy = (taxonomyToRemove: string) => {
        const updated = selectedBloomTaxonomies.filter(t => t !== taxonomyToRemove);
        setSelectedBloomTaxonomies(updated);
        // If no taxonomy is selected in dropdown, set it to the removed one
        if (!bloomtax) {
            setBloomtax(taxonomyToRemove);
        }
    };

    // Handle cancel generation
    const handleCancelGeneration = () => {
        setIsGenerating(false);
        setShowGeneratingBackdrop(false);
        // You might want to add logic to actually cancel the API request here
    };

    // Handle start generating
    const handleStartGenerating = () => {
        console.log('Starting generation...'); // Debug log
        setIsGenerating(true);
        setShowGeneratingBackdrop(true);
    };

    // Handle form submission
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!homeworkName.trim()) {
            alert('กรุณากรอกชื่อชุดฝึก');
            return;
        }
        
        if (selectedBloomTaxonomies.length === 0) {
            alert('กรุณาเลือกระดับขั้นของโจทย์อย่างน้อย 1 ตัว');
            return;
        }

        setIsGenerating(true);
        setShowGeneratingBackdrop(true);

        try {
            const formData = new FormData(formRef.current!);
            
            // Call the form action
            const result = await formAction(null, formData);
            
            setIsGenerating(false);
            setShowGeneratingBackdrop(false);
            
            if (result && (result as any).type === 'success') {
                if ((result as any).questionsData) {
                    setGeneratedQuestions((result as any).questionsData);
                    setShowQuestionsPreview(true);
                } else {
                    alert('สร้างและบันทึกชุดฝึกเรียบร้อยแล้ว');
                    handleClose();
                }
            } else if (result && (result as any).type === 'error') {
                alert((result as any).message);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setIsGenerating(false);
            setShowGeneratingBackdrop(false);
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
        }
    };

    // Handle modal close with animation
    const handleClose = () => {
        // Prevent closing if generating
        if (isGenerating) {
            return;
        }
        
        setIsExiting(true);

        // Wait for exit animation to complete
        setTimeout(() => {
            onClose();
            resetForm();
            setIsExiting(false);
        }, 300);
    };

    // If close modal, reset the form
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Handle questions save
    const handleQuestionsSave = async (questionsData: any) => {
        try {
            // Call the actual form action to save to database
            const formData = new FormData(formRef.current!);
            formData.set('h_content', JSON.stringify(questionsData));
            
            const result = await formAction(null, formData);
            
            if (result && (result as any).type === 'success') {
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
        setSelectedBloomTaxonomies(['จดจำ']);
        setExerciseType('ปรนัย');
        setTotalQuestions('10');
        setContent('');
        setGeneratedQuestions(null);
        setShowQuestionsPreview(false);
        setIsGenerating(false);
        setShowGeneratingBackdrop(false);
        if (formRef.current) {
            formRef.current.reset();
        }
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
                onClick={isGenerating ? undefined : handleClose}
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
                        disabled={isGenerating}
                        className={`rounded-md bg-[#2D4A5B] text-white hover:text-gray-300 focus:outline-hidden transition-all duration-300 outline-none ${
                            isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                    >
                        <span className="sr-only">ปิด</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                    </button>
                </div>

                <h2 className="text-2xl font-bold text-white mb-4">สร้างชุดฝึก</h2>

                <form
                    ref={formRef}
                    onSubmit={handleFormSubmit}
                >
                    {/* Hidden input for generate questions flag */}
                    <input type="hidden" name="generate_questions" value="true" />
                    
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
                    <div className="mb-4 opacity-70">
                        <label htmlFor="subject" className="block text-white mb-1">เนื้อหา (ปัจจุบันมีแค่ พีชคณิต)</label>
                        {/* <select
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
                        </select> */}

                        <input
                            id="subject"
                            name="h_subject"
                            type="text"
                            required
                            autoComplete="off"
                            className="w-full px-4 py-2 rounded-md bg-[#002c4a5b] text-[#9f9f9f] border-2 border-[#002c4a5b] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                            value="พีชคณิต"
                            disabled
                        />
                    </div>

                    {/* Form row for level, exercise type, and total questions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

                        {/* Exercise Type */}
                        <div className='opacity-70'>
                            <label htmlFor="exerciseType" className="block text-white mb-1">รูปแบบ (ปัจจุบันมีแค่ ปรนัย)</label>
                            <input
                                id="exerciseType"
                                name="h_type"
                                type="text"
                                required
                                autoComplete="off"
                                className="w-full px-4 py-2 rounded-md bg-[#002c4a5b] text-[#9f9f9f] border-2 border-[#002c4a5b] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                                value="ปรนัย"
                                disabled
                            />
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

                    {/* Bloom Taxonomy - Full Width */}
                    <div className="mb-4">
                        <label htmlFor="subjectDetail" className="block text-white mb-1">ระดับขั้นของโจทย์</label>
                        
                        {/* Selection Area */}
                        <div className="flex gap-2 mb-2">
                            <select
                                id="subjectDetail"
                                value={bloomtax}
                                onChange={(e) => setBloomtax(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                                disabled={availableBloomTaxonomies.length === 0}
                            >
                                <option value="">เลือกระดับขั้น</option>
                                {availableBloomTaxonomies.map(taxonomy => (
                                    <option key={taxonomy} value={taxonomy}>{taxonomy}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleAddBloomTaxonomy}
                                disabled={!bloomtax || selectedBloomTaxonomies.includes(bloomtax)}
                                className="px-4 py-2 bg-[#80ED99] text-[#002D4A] rounded-md hover:bg-[#6dd087] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
                            >
                                เพิ่ม
                            </button>
                        </div>

                        {/* Selected Taxonomies */}
                        {selectedBloomTaxonomies.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedBloomTaxonomies.map(taxonomy => (
                                    <div
                                        key={taxonomy}
                                        className="flex items-center gap-2 px-3 py-1 bg-[#80ED99] text-[#002D4A] rounded-full text-sm font-medium"
                                    >
                                        <span>{taxonomy}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveBloomTaxonomy(taxonomy)}
                                            className="text-[#002D4A] hover:text-red-600 transition-colors duration-200 cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Hidden input for form submission */}
                        <input
                            type="hidden"
                            name="h_bloomtax"
                            value={selectedBloomTaxonomies.join(',')}
                        />
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
                            disabled={isGenerating}
                            className={`px-4 py-2 bg-[#203D4F] text-white rounded-md hover:bg-[#152b3a] transition-all duration-300 ${
                                isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                        >
                            ยกเลิก
                        </button>
                        <SubmitButton 
                            isGenerating={isGenerating} 
                            homeworkName={homeworkName}
                            selectedBloomTaxonomies={selectedBloomTaxonomies}
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

            {/* Generating Backdrop */}
            {showGeneratingBackdrop && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/70 animate-[fadeIn_300ms_ease-in-out_forwards]"></div>
                    
                    {/* Warning Modal */}
                    <div className="relative bg-[#2D4A5B] rounded-xl p-8 max-w-md w-11/12 animate-[zoomIn_300ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] transform-gpu">
                        <div className="text-center">
                            {/* Warning Icon */}
                            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2">⚠️ ระบบกำลังสร้างชุดฝึก</h3>
                            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                                กรุณาอย่าปิดหน้าต่างหรือรีเฟรชหน้าเว็บ<br />
                                ระบบกำลังสร้างโจทย์ด้วย AI<br />
                                กระบวนการนี้อาจใช้เวลา 30-60 วินาที
                            </p>
                            
                            {/* Loading Animation */}
                            <div className="mb-6">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#80ED99]"></div>
                            </div>
                            
                            {/* Cancel Button */}
                            <button
                                type="button"
                                onClick={handleCancelGeneration}
                                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 font-medium"
                            >
                                ยกเลิกการสร้าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}