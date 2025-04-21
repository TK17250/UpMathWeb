'use client';
import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useFormStatus } from 'react-dom';

// Define the prop types for CreateMediaModal component
interface CreateMediaModalProps {
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

export default function CreateMediaModal({ isOpen, onClose, formAction }: CreateMediaModalProps) {
    // State for form inputs
    const [mediaName, setMediaName] = useState('');
    const [mediaContent, setMediaContent] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [fileDuration, setFileDuration] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

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
            setMediaFile(file);
            
            // Get file duration if it's audio or video
            getDuration(file);
        }
    };

    // Get duration of audio/video files
    const getDuration = (file: File) => {
        // Reset duration first
        setFileDuration('');

        const fileType = file.type;
        const url = URL.createObjectURL(file);

        if (fileType.includes('audio')) {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.onloadedmetadata = () => {
                    if (audioRef.current) {
                        const duration = Math.round(audioRef.current.duration);
                        setFileDuration(formatDuration(duration));
                    }
                };
            }
        } else if (fileType.includes('video')) {
            if (videoRef.current) {
                videoRef.current.src = url;
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        const duration = Math.round(videoRef.current.duration);
                        setFileDuration(formatDuration(duration));
                    }
                };
            }
        } else {
            // For other file types, we don't have duration
            setFileDuration('N/A');
        }
    };

    // Format seconds to MM:SS or HH:MM:SS
    const formatDuration = (seconds: number) => {
        if (isNaN(seconds)) return 'ไม่สามารถระบุเวลาได้';
    
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
    
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            setMediaFile(file);
            getDuration(file);

            // Manually set the file in the file input for FormData
            if (fileInputRef.current) {
                // Create a DataTransfer object to set files
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInputRef.current.files = dataTransfer.files;
            }
        }
    };

    // Remove selected file
    const removeFile = () => {
        setMediaFile(null);
        setFileDuration('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle form submission client-side validation
    const handleClientValidation = (e: React.FormEvent) => {
        if (!mediaName.trim()) {
            e.preventDefault();
            alert('กรุณากรอกชื่อสื่อการสอน');
            return false;
        }

        if (!mediaFile) {
            e.preventDefault();
            alert('กรุณาอัปโหลดไฟล์สื่อการสอน');
            return false;
        }

        return true;
    };

    // Handle submit with animation
    const handleSubmitWithAnimation = (e: React.FormEvent) => {
        if (!handleClientValidation(e)) {
            return;
        }
    };

    // Reset form fields
    const resetForm = () => {
        setMediaName('');
        setMediaContent('');
        setMediaFile(null);
        setFileDuration('');
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

    // Get file icon/preview based on file type
    const getFilePreview = () => {
        if (!mediaFile) return null;

        const fileType = mediaFile.type;
        
        // For images, show preview
        if (fileType.includes('image')) {
            return (
                <img
                    src={URL.createObjectURL(mediaFile)}
                    alt="Media preview"
                    className="w-full h-32 object-cover rounded-lg border border-[#4A6B8A]"
                />
            );
        }
        
        // For videos, show thumbnail with play icon
        if (fileType.includes('video')) {
            return (
                <div className="relative w-full h-32 bg-[#1a2c38] rounded-lg border border-[#4A6B8A] flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#80ED99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <video ref={videoRef} className="hidden" />
                </div>
            );
        }
        
        // For audio, show audio icon
        if (fileType.includes('audio')) {
            return (
                <div className="relative w-full h-32 bg-[#1a2c38] rounded-lg border border-[#4A6B8A] flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#80ED99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    </div>
                    <audio ref={audioRef} className="hidden" />
                </div>
            );
        }
        
        // For documents and other files
        return (
            <div className="relative w-full h-32 bg-[#1a2c38] rounded-lg border border-[#4A6B8A] flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#80ED99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
            </div>
        );
    };

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

                <h2 className="text-2xl font-bold text-white mb-4">เพิ่มสื่อการสอน</h2>

                <form
                    ref={formRef}
                    action={formAction}
                    onSubmit={handleSubmitWithAnimation}
                >
                    <audio ref={audioRef} className="hidden" />
                    <video ref={videoRef} className="hidden" />

                    {/* Media Name */}
                    <div className="mb-4">
                        <label htmlFor="mediaName" className="block text-white mb-1">ชื่อสื่อการสอน</label>
                        <input
                            type="text"
                            id="mediaName"
                            name="m_name"
                            value={mediaName}
                            onChange={(e) => setMediaName(e.target.value)}
                            className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200"
                            required
                            autoComplete="off"
                        />
                    </div>

                    {/* Media File Upload */}
                    <div className="mb-4">
                        <label className="block text-white mb-1">ไฟล์สื่อการสอน</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            name="m_media"
                            required
                        />

                        <div
                            className={`relative border-2 border-dashed rounded-lg p-6 cursor-pointer flex flex-col items-center justify-center transition-all duration-200 ${isDragging
                                ? 'border-[#80ED99] bg-[#203D4F]/70'
                                : mediaFile
                                    ? 'border-[#80ED99] bg-[#203D4F]/50'
                                    : 'border-[#4A6B8A] bg-[#203D4F]/30 hover:bg-[#203D4F]/50 hover:border-[#6ebc80]'
                                }`}
                            onClick={openFileDialog}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {mediaFile ? (
                                <div className="flex flex-col items-center">
                                    {/* Preview the file */}
                                    <div className="relative mb-2 w-full max-w-xs">
                                        {getFilePreview()}
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
                                    <p className="text-white text-sm mt-1">{mediaFile.name}</p>
                                    <p className="text-gray-400 text-xs">
                                        {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    {fileDuration && (
                                        <p className="text-[#80ED99] text-xs mt-1">
                                            ระยะเวลา: {fileDuration}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <CloudArrowUpIcon className="w-12 h-12 text-[#4A6B8A] mb-2" />
                                    <p className="text-white text-center">
                                        ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์
                                    </p>
                                    <p className="text-gray-400 text-sm text-center mt-2">
                                        รองรับไฟล์สื่อการสอน: วิดีโอ, รูปภาพ
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Hidden input for period (will be set from file) */}
                    <input 
                        type="hidden" 
                        name="m_period" 
                        value={fileDuration} 
                    />

                    {/* Media Content Description */}
                    <div className="mb-4">
                        <label htmlFor="mediaContent" className="block text-white mb-1">เนื้อหาสื่อการสอน</label>
                        <textarea
                            id="mediaContent"
                            name="m_media_content"
                            value={mediaContent}
                            onChange={(e) => setMediaContent(e.target.value)}
                            rows={4}
                            required
                            className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] transition-all duration-200 resize-none"
                            placeholder="อธิบายเนื้อหาของสื่อการสอนนี้..."
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
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}