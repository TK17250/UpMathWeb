'use client';
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useFormStatus } from 'react-dom';

// Define the prop types for CreateClassModal component
interface CreateClassModalProps {
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
            className={`rounded-md bg-[#203D4F] px-6 md:px-10 py-1.5 text-sm/6 text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300 ${pending ? 'opacity-70 cursor-not-allowed' : ''
                }`}
        >
            {pending ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
    );
}

export default function CreateClassModal({ isOpen, onClose, formAction }: CreateClassModalProps) {
    // State for form inputs
    const [className, setClassName] = useState('');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

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

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (isValidFileType(file)) {
                setBannerFile(file);
            } else {
                alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (jpg, jpeg, png)');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    // Check if file type is valid (images only)
    const isValidFileType = (file: File) => {
        const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        return acceptedTypes.includes(file.type);
    };

    // Trigger file input click
    const openFileDialog = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Handle drag events
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (isValidFileType(file)) {
                setBannerFile(file);

                // Manually set the file in the file input for FormData
                if (fileInputRef.current) {
                    // Create a DataTransfer object to set files
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInputRef.current.files = dataTransfer.files;
                }
            } else {
                alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (jpg, jpeg, png)');
            }
        }
    };

    // Remove selected file
    const removeFile = () => {
        setBannerFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle form submission client-side validation
    const handleClientValidation = (e: React.FormEvent) => {
        if (!className.trim()) {
            e.preventDefault();
            alert('กรุณากรอกชื่อชั้นเรียน');
            return false;
        }

        if (!bannerFile) {
            e.preventDefault();
            alert('กรุณาอัปโหลดพื้นหลัง');
            return false;
        }

        return true;
    };

    // Handle submit with animation
    const handleSubmitWithAnimation = (e: React.FormEvent) => {
        if (!handleClientValidation(e)) {
            return;
        }

        // The form will submit normally via the action attribute
    };

    // Reset form fields
    const resetForm = () => {
        setClassName('');
        setBannerFile(null);
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
                className={`fixed inset-0 bg-black/50 ${isExiting
                    ? 'animate-[fadeOut_300ms_ease-in-out_forwards]'
                    : 'animate-[fadeIn_300ms_ease-in-out_forwards]'
                    }`}
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div
                className={`relative bg-[#2D4A5B] rounded-xl p-6 w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto ${isExiting
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

                <h2 className="text-2xl font-bold text-white mb-4">เพิ่มชั้นเรียนใหม่</h2>

                <form
                    ref={formRef}
                    action={formAction}
                    onSubmit={handleSubmitWithAnimation}
                >
                    {/* Class Name */}
                    <div className="mb-4">
                        <label htmlFor="className" className="block text-white mb-1">ชื่อของชั้นเรียน</label>
                        <input
                            type="text"
                            id="className"
                            name="className"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                            required
                            autoComplete="off"
                        />
                    </div>

                    {/* Banner - File Upload and Drop Zone */}
                    <div className="mb-4">
                        <label className="block text-white mb-1">พื้นหลัง</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/jpg,image/png"
                            className="hidden"
                            name="classBG"
                            required
                        />

                        <div
                            className={`relative border-2 border-dashed rounded-lg p-6 cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${isDragging
                                ? 'border-[#80ED99] bg-[#203D4F]/70'
                                : bannerFile
                                    ? 'border-[#80ED99] bg-[#203D4F]/50'
                                    : 'border-[#4A6B8A] bg-[#203D4F]/30 hover:bg-[#203D4F]/50 hover:border-[#6ebc80]'
                                }`}
                            onClick={openFileDialog}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {bannerFile ? (
                                <div className="flex flex-col items-center">
                                    {/* Preview the image if it's an image file */}
                                    <div className="relative mb-2 w-full max-w-xs">
                                        <img
                                            src={URL.createObjectURL(bannerFile)}
                                            alt="Banner preview"
                                            className="w-full h-32 object-cover rounded-lg border border-[#4A6B8A]"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile();
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 transition-colors"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-white text-sm mt-1">{bannerFile.name}</p>
                                    <p className="text-gray-400 text-xs">
                                        {(bannerFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <CloudArrowUpIcon className="w-12 h-12 text-[#4A6B8A] mb-2" />
                                    <p className="text-white text-center">
                                        ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์
                                    </p>
                                    <p className="text-gray-400 text-sm text-center mt-2">
                                        รองรับไฟล์รูปภาพ: JPG, JPEG, PNG
                                    </p>
                                </>
                            )}
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