'use client';
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useFormStatus } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

// Define the prop types for DeleteHomeworkModal component  
interface DeleteHomeworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    homeworkId: number;
    homeworkName: string;
    formAction: any;
}

// Submit button with loading state
function SubmitButton({ isActive }: { isActive: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit" 
            disabled={pending || isActive}
            className={`rounded-md px-6 md:px-10 py-1.5 text-sm/6 font-bold shadow-xs transition-all duration-300 ${
                isActive
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : pending 
                    ? 'bg-red-300 text-white cursor-not-allowed opacity-70'
                    : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
            }`}
        >
            {pending ? (
                <span className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    <span>กำลังลบ...</span>
                </span>
            ) : isActive ? (
                'ไม่สามารถลบได้'
            ) : (
                'ยืนยันการลบ'
            )}
        </button>
    );
}

export default function DeleteHomeworkModal({ 
    isOpen, 
    onClose, 
    homeworkId, 
    homeworkName, 
    formAction 
}: DeleteHomeworkModalProps) {
    // State variables
    const formRef = useRef<HTMLFormElement>(null);
    const [isExiting, setIsExiting] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [isCheckingActive, setIsCheckingActive] = useState<boolean>(false);
    const [isHomeworkActive, setIsHomeworkActive] = useState<boolean>(false);
    const [activeClassNames, setActiveClassNames] = useState<string[]>([]);

    // Set visible after component mounts (for entry animation)
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            checkHomeworkUsage();
        }
    }, [isOpen, homeworkId]); // Add homeworkId to dependencies

    // Check if homework is being used in any active assignments using server action
    const checkHomeworkUsage = async () => {
        setIsCheckingActive(true);
        try {
            // Import the check function and call it
            const { checkHomeworkActive } = await import('@/app/action/homework');
            const result = await checkHomeworkActive(homeworkId);
            
            if (result.isActive) {
                setIsHomeworkActive(true);
                setActiveClassNames(result.classNames || []);
            } else {
                setIsHomeworkActive(false);
                setActiveClassNames([]);
            }
        } catch (error) {
            console.error('Error checking homework usage:', error);
            setIsHomeworkActive(false);
        } finally {
            setIsCheckingActive(false);
        }
    };

    // Handle close with animation
    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
            setIsVisible(false);
            setIsHomeworkActive(false);
            setActiveClassNames([]);
        }, 300);
    };

    // If modal is not open, don't render
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
                className={`fixed inset-0 bg-black/50 ${
                    isExiting
                        ? 'animate-[fadeOut_300ms_ease-in-out_forwards]'
                        : 'animate-[fadeIn_300ms_ease-in-out_forwards]'
                }`}
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                className={`relative bg-[#2D4A5B] rounded-xl w-11/12 max-w-md mx-auto ${
                    isExiting
                        ? 'animate-[slideOut_300ms_cubic-bezier(0.4,0,0.2,1)_forwards]'
                        : 'animate-[slideIn_300ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]'
                } transform-gpu`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#203D4F]">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isHomeworkActive ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
                            <ExclamationTriangleIcon className={`w-6 h-6 ${isHomeworkActive ? 'text-red-400' : 'text-orange-400'}`} />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {isHomeworkActive ? 'ไม่สามารถลบได้' : 'ยืนยันการลบชุดฝึก'}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isCheckingActive ? (
                        <div className="flex items-center justify-center space-x-3 py-8">
                            <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 text-[#80ED99] animate-spin" />
                            <span className="text-white">กำลังตรวจสอบสถานะการใช้งาน...</span>
                        </div>
                    ) : isHomeworkActive ? (
                        <div className="space-y-4">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-red-400 font-semibold mb-2">
                                            ไม่สามารถลบชุดฝึกได้
                                        </h3>
                                        <p className="text-gray-300 text-sm mb-3">
                                            ชุดฝึก "<span className="font-medium text-white">{homeworkName}</span>" 
                                            กำลังถูกใช้งานในห้องเรียนต่อไปนี้:
                                        </p>
                                        <ul className="space-y-1">
                                            {activeClassNames.map((className, index) => (
                                                <li key={index} className="text-sm text-gray-300 flex items-center space-x-2">
                                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                                    <span>{className}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-gray-400 text-xs mt-3">
                                            กรุณาเอาชุดฝึกนี้ออกจากห้องเรียนทั้งหมดก่อนลบ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-orange-400 font-semibold mb-2">
                                            คำเตือน
                                        </h3>
                                        <p className="text-gray-300 text-sm">
                                            คุณกำลังจะลบชุดฝึก "<span className="font-medium text-white">{homeworkName}</span>"
                                        </p>
                                        <p className="text-gray-400 text-xs mt-2">
                                            การดำเนินการนี้ไม่สามารถยกเลิกได้ และข้อมูลทั้งหมดจะถูกลบอย่างถาวร
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form ref={formRef} action={formAction} className="space-y-4">
                                <input type="hidden" name="homeworkId" value={homeworkId} />
                                
                                <div className="text-center text-gray-300 text-sm">
                                    ยืนยันการลบชุดฝึกนี้หรือไม่?
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-[#203D4F]">
                    <button
                        onClick={handleClose}
                        className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                        ยกเลิก
                    </button>
                    
                    {!isCheckingActive && !isHomeworkActive && (
                        <form action={formAction}>
                            <input type="hidden" name="homeworkId" value={homeworkId} />
                            <SubmitButton isActive={isHomeworkActive} />
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
