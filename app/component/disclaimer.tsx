/**
 * คอมโพเนนต์ Disclaimer - แสดงข้อตกลงการใช้งานซอฟต์แวร์
 * 
 * การทำงาน:
 * 1. แสดงปุ่มเครื่องหมายคำถาม (?) มุมขวาบนของหน้าล็อกอินและสมัครสมาชิก
 * 2. เมื่อคลิกปุ่ม จะเปิด modal popup แสดงข้อความ disclaimer
 * 3. ผู้ใช้สามารถปิด modal ได้โดยคลิกปุ่ม × หรือปุ่ม "รับทราบ"
 * 4. ใช้ createPortal เพื่อแสดง modal ที่ระดับ document.body
 * 5. มี responsive design รองรับทั้งมือถือและคอมพิวเตอร์
 * 
 * Features:
 * - Hover effects และ smooth animations
 * - Background blur เมื่อเปิด modal
 * - Scrollable content สำหรับข้อความยาว
 * - รองรับ touch gestures บนมือถือ
 */

"use client";
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface DisclaimerProps {
    className?: string;
}

export default function Disclaimer({ className = '' }: DisclaimerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const disclaimerText = `

ซอฟต์แวร์นี้เป็นผลงานที่พัฒนาขึ้นโดย นายเตชินท์ พงษ์มุกดา จาก โรงเรียนยุพราชวิทยาลัย ภายใต้การดูแลของ นายวิรัชชัย จันต๊ะวงศ์ ภายใต้โครงการ เว็บแอปพลิเคชันพัฒนาทักษะและประเมินผลความสามารถทางคณิตศาสตร์ระดับมัธยมศึกษาตอนปลาย ซึ่งสนับสนุนโดย สํานักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ โดยมี วัตถุประสงค์เพื่อส่งเสริมให้นักเรียนและนักศึกษาได้เรียนรู้และฝึกทักษะในการพัฒนา ซอฟต์แวร์ ลิขสิทธิ์ของซอฟต์แวร์นี้จึงเป็นของผู้พัฒนา ซึ่งผู้พัฒนาได้อนุญาตให้สํานักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ เผยแพร่ซอฟต์แวร์นี้ตาม "ต้นฉบับ" โดยไม่มี การแก้ไขดัดแปลงใดๆ ทั้งสิ้น ให้แก่บุคคลทั่วไปได้ใช้เพื่อประโยชน์ส่วนบุคคลหรือประโยชน์ทางการศึกษาที่ไม่มีวัตถุประสงค์ในเชิงพาณิชย์ โดยไม่คิดค่าตอบแทนการใช้ ซอฟต์แวร์ ดังนั้น สํานักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ จึงไม่มีหน้าที่ใน การดูแล บําารุงรักษา จัดการอบรมการใช้งาน หรือพัฒนาประสิทธิภาพซอฟต์แวร์ รวมทั้ง ไม่รับรองความถูกต้องหรือประสิทธิภาพการทํางานของซอฟต์แวร์ตลอดจน ไม่รับประกัน ความเสียหายต่างๆ อันเกิดจากการใช้ซอฟต์แวร์นี้ทั้งสิ้น`;

    return (
        <>
            {/* Question Mark Button */}
            <button
                onClick={handleOpen}
                className={`group relative w-10 h-10 rounded-full bg-[#203D4F]/80 hover:bg-[#203D4F] border border-[#80ED99]/30 hover:border-[#80ED99]/50 transition-all duration-300 flex items-center justify-center ${className} cursor-pointer`}
                title="ข้อตกลงในการใช้งาน"
            >
                <span className="text-lg font-bold text-[#80ED99] group-hover:text-white group-hover:scale-110 transition-all duration-300">?</span>
            </button>

            {/* Disclaimer Modal */}
            {isOpen && createPortal(
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#203D4F] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-[#80ED99]/20">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[#80ED99]/20 bg-[#2D4A5B]">
                            <h2 className="text-xl font-bold text-white">
                                ข้อตกลงในการใช้ซอฟต์แวร์
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-300 group cursor-pointer"
                                title="ปิดหน้าต่าง"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xl font-bold group-hover:scale-110 transition-transform duration-200" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="prose prose-invert max-w-none">
                                <div className="text-white leading-relaxed space-y-4 text-sm sm:text-base">
                                    {disclaimerText.split('\n\n').map((paragraph, index) => (
                                        <p key={index} className="text-justify">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end p-6 border-t border-[#80ED99]/20 bg-[#2D4A5B]">
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 cursor-pointer"
                            >
                                รับทราบ
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
