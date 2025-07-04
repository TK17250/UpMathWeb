// Create new file: app/medias/update_form_modal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CloudArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useFormStatus } from 'react-dom';
import { FilmIcon, PhotoIcon } from '@heroicons/react/24/solid';

// Define structure for MediaItem prop
interface MediaItem {
    m_id: number;
    m_name: string;
    m_period: string;
    m_media: {
        file_name: string;
        description: string;
    };
    signedUrl: string | null;
    fileType: 'image' | 'video' | 'unknown';
}

interface UpdateMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    formAction: any;
    mediaItem: MediaItem | null;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={`rounded-md bg-[#203D4F] px-6 md:px-10 py-1.5 text-sm/6 text-[#80ED99] font-bold shadow-xs cursor-pointer border-[#002D4A] border-2 hover:border-[#80ED99] transition-all duration-300 ${pending ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {pending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
        </button>
    );
}

export default function UpdateMediaModal({ isOpen, onClose, formAction, mediaItem }: UpdateMediaModalProps) {
    // Form States
    const [mediaName, setMediaName] = useState('');
    const [mediaContent, setMediaContent] = useState('');
    const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
    const [fileDuration, setFileDuration] = useState('');
    
    // UI/Ref States
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExiting, setIsExiting] = useState(false);
    
    // Pre-fill form when modal opens or mediaItem changes
    useEffect(() => {
        if (isOpen && mediaItem) {
            setMediaName(mediaItem.m_name);
            setMediaContent(mediaItem.m_media.description);
            setFileDuration(mediaItem.m_period); // Set initial duration
        }
    }, [isOpen, mediaItem]);

    const resetForm = () => {
        setNewMediaFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        // Re-populate with original data on close/reset
        if (mediaItem) {
            setMediaName(mediaItem.m_name);
            setMediaContent(mediaItem.m_media.description);
            setFileDuration(mediaItem.m_period);
        }
    };

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            resetForm();
            setIsExiting(false);
        }, 300);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewMediaFile(file);
            getDuration(file); // Calculate duration for the new file
        }
    };

    const getDuration = (file: File) => {
        const url = URL.createObjectURL(file);
        const videoElement = document.createElement('video');
        videoElement.src = url;
        videoElement.onloadedmetadata = () => {
            const duration = Math.round(videoElement.duration);
            setFileDuration(formatDuration(duration));
            URL.revokeObjectURL(url);
        };
    };

    const formatDuration = (seconds: number) => {
        if (isNaN(seconds)) return 'N/A';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.round(seconds % 60);
        return hrs > 0
            ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            : `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen || !mediaItem) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Styles and Backdrop */}
            <style jsx global>{`@keyframes fadeIn{from{opacity:0}}@keyframes fadeOut{from{opacity:1}}@keyframes zoomIn{from{opacity:0;transform:scale(.95) translateY(10px)}}@keyframes zoomOut{from{opacity:1;transform:scale(1) translateY(0)}}`}</style>
            <div className={`fixed inset-0 bg-black/50 ${isExiting ? 'animate-[fadeOut_300ms_ease-in-out_forwards]' : 'animate-[fadeIn_300ms_ease-in-out_forwards]'}`} onClick={handleClose}></div>

            <div className={`relative bg-[#2D4A5B] rounded-xl p-6 w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto ${isExiting ? 'animate-[zoomOut_300ms_cubic-bezier(0.4,0,0.2,1)_forwards]' : 'animate-[zoomIn_300ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]'} transform-gpu`}>
                <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button type="button" onClick={handleClose} className="rounded-md bg-[#2D4A5B] text-white hover:text-gray-300 focus:outline-hidden cursor-pointer"><XMarkIcon aria-hidden="true" className="size-6" /></button>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">แก้ไขสื่อการสอน</h2>

                <form ref={formRef} action={formAction}>
                    <input type="hidden" name="m_id" value={mediaItem.m_id} />
                    
                    <div className="mb-4">
                        <label htmlFor="mediaName" className="block text-white mb-1">ชื่อสื่อการสอน</label>
                        <input type="text" id="mediaName" name="m_name" value={mediaName} onChange={(e) => setMediaName(e.target.value)} className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99]" required autoComplete="off" />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-white mb-1">ไฟล์สื่อการสอน (เลือกไฟล์ใหม่เพื่อแทนที่)</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" name="m_media" accept="image/*,video/*" />
                        <div className="flex items-center gap-4 rounded-lg p-3 bg-[#203D4F] border-2 border-dashed border-[#4A6B8A]">
                            <div className="flex-shrink-0 w-24 h-16 bg-[#1a2c38] rounded-md flex items-center justify-center">
                                {mediaItem.fileType === 'image' && <PhotoIcon className="h-8 w-8 text-[#80ED99]" />}
                                {mediaItem.fileType === 'video' && <FilmIcon className="h-8 w-8 text-[#80ED99]" />}
                            </div>
                            <div className="flex-grow text-sm">
                                <p className="text-white font-semibold line-clamp-1">{newMediaFile ? newMediaFile.name : 'ไฟล์ปัจจุบัน: ' + mediaItem.m_media.file_name.split('/').pop()}</p>
                                <p className="text-white/60">{newMediaFile ? `ขนาด: ${(newMediaFile.size / 1024 / 1024).toFixed(2)} MB` : `ระยะเวลา: ${mediaItem.m_period}`}</p>
                            </div>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#2D4A5B] text-white hover:bg-white/10 text-xs font-semibold transition-all">
                                <ArrowPathIcon className="h-4 w-4" />
                                <span>เปลี่ยนไฟล์</span>
                            </button>
                        </div>
                    </div>

                    <input type="hidden" name="m_period" value={fileDuration} />
                    
                    <div className="mb-4">
                        <label htmlFor="mediaContent" className="block text-white mb-1">เนื้อหาสื่อการสอน</label>
                        <textarea id="mediaContent" name="m_media_content" value={mediaContent} onChange={(e) => setMediaContent(e.target.value)} rows={4} required className="w-full px-4 py-2 rounded-md bg-[#203D4F] text-white border-2 border-[#002D4A] focus:outline-none focus:border-[#80ED99] resize-none" placeholder="อธิบายเนื้อหา..."></textarea>
                    </div>

                    <div className="flex justify-end mt-6 space-x-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-[#203D4F] text-white rounded-md hover:bg-[#152b3a]">ยกเลิก</button>
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}