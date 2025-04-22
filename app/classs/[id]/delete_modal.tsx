'use client';
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFormStatus } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

// Define the prop types for DeleteClassModal component  
interface DeleteClassModalProps {
    isOpen: boolean;
    onClose: () => void;  
    formAction: any;
}

// Submit button with loading state
function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit" 
            disabled={pending}
            className={`rounded-md px-6 md:px-10 py-1.5 text-sm/6 bg-red-400 text-white font-bold shadow-xs cursor-pointer hover:bg-red-500 transition-all duration-300 ${
                pending ? 'opacity-70 cursor-not-allowed' : ''
            }`}
        >
            {pending ? 'กำลังลบชั้นเรียน...' : 'ยืนยันการลบ'}
        </button>
    );
}

export default function DeleteClassModal({ isOpen, onClose, formAction }: DeleteClassModalProps) {
    // State for form inputs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false)

    // Animation states 
    const [isExiting, setIsExiting] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(false);

    // Set visible after component mounts (for entry animation)
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        }
    }, [isOpen]);

    // If close modal, reset the form 
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Handle submit with animation  
    const handleSubmitWithAnimation = (e: React.FormEvent) => {
        return true
    };

    // Reset form fields
    const resetForm = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';  
        }
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
                className={`fixed inset-0 bg-black/50 ${
                    isExiting
                        ? 'animate-[fadeOut_300ms_ease-in-out_forwards]'
                        : 'animate-[fadeIn_300ms_ease-in-out_forwards]'
                }`}
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`relative bg-[#2D4A5B] rounded-xl p-6 w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto ${
                    isExiting
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

                <h2 className="text-2xl font-bold text-white mb-4">ยืนยันการลบชั้นเรียน</h2>

                <form
                    ref={formRef}
                    action={formAction}
                    onSubmit={handleSubmitWithAnimation}
                >
                    {/* Class ID */}
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-white mb-1">รหัสชั้นเรียน</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                placeholder='กรุณากรอกรหัสชั้นเรียน'
                                className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                                required
                                autoComplete="off"
                            />

                            <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                        </div>
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
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}