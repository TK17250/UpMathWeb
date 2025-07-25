'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "../../action/getuser";
import { getHistoryDetail } from "../../action/history";
import Navbar from "../../component/navbar";
import Sidebar from "../../component/sidebar";
import Footer from "../../component/footer";

interface StudentHomeworkDetail {
    a_id: number;
    a_sid: string;
    a_homework: any;
    a_status: string;
    a_answers?: any;
    a_score?: number;
    a_submission_time?: string;
    student_name?: string;
    student_username?: string;
    student_email?: string;
    homework_name?: string;
    homework_subject?: string;
    homework_content?: any;
    class_name?: string;
    history_time?: string;
}

export default function HistoryDetail({ params }: { params: { historyId: string } }) {
    const [user, setUser] = useState<any>(null);
    const [historyDetail, setHistoryDetail] = useState<StudentHomeworkDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check login
    useEffect(() => {
        getUser().then((res: any) => {
            if (!res) {
                router.push("/login");
            } else {
                setUser(res);
            }
        });
    }, [router]);

    // Get history detail
    useEffect(() => {
        const fetchHistoryDetail = async () => {
            try {
                setLoading(true);
                const result = await getHistoryDetail(params.historyId);
                
                if (result.type === 'success') {
                    setHistoryDetail(result.data);
                } else {
                    console.error("History detail fetch error:", result);
                }
            } catch (error) {
                console.error('Error fetching history detail:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchHistoryDetail();
        }
    }, [user, params.historyId]);

    if (!user || loading) {
        return (
            <div className="overflow-hidden h-screen">
                <div className="h-full w-11/12 justify-center m-auto flex flex-col">
                    <Navbar />
                    <div className="flex flex-col lg:flex-row h-full lg:h-auto">
                        <Sidebar />
                        <div className="bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 rounded-xl w-full h-full lg:h-auto border-4 border-[#203D4F] p-5 overflow-y-auto">
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#80ED99]"></div>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden h-screen">
            <div className="h-full w-11/12 justify-center m-auto flex flex-col">
                {/* Navbar */}
                <Navbar />

                <div className="flex flex-col lg:flex-row h-full lg:h-auto">
                    {/* Sidebar */}
                    <Sidebar />

                    {/* Content */}
                    <div className="bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 rounded-xl w-full h-full lg:h-auto border-4 border-[#203D4F] p-5 overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white">รายละเอียดการส่งงาน</h1>
                                <p className="text-[#80ED99] mt-1">
                                    {historyDetail?.homework_name || 'ไม่มีข้อมูล'}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/history')}
                                className="px-4 py-2 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 cursor-pointer"
                            >
                                กลับไปประวัติ
                            </button>
                        </div>

                        {historyDetail && (
                            <div className="space-y-6">
                                {/* Student Info */}
                                <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B]">
                                    <h2 className="text-xl font-semibold text-white mb-4">ข้อมูลนักเรียน</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[#80ED99] text-sm">ชื่อ-นามสกุล:</span>
                                            <p className="text-white font-medium">{historyDetail.student_name || 'ไม่มีข้อมูล'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[#80ED99] text-sm">อีเมล:</span>
                                            <p className="text-white">{historyDetail.student_email || `ID: ${historyDetail.a_sid}`}</p>
                                        </div>
                                        <div>
                                            <span className="text-[#80ED99] text-sm">ชื่อผู้ใช้:</span>
                                            <p className="text-white">{historyDetail.student_username || 'ไม่มีข้อมูล'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[#80ED99] text-sm">ห้องเรียน:</span>
                                            <p className="text-white">{historyDetail.class_name || 'ไม่มีข้อมูล'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Homework Info */}
                                <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B]">
                                    <h2 className="text-xl font-semibold text-white mb-4">ข้อมูลชุดฝึก</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[#80ED99] text-sm">ชื่อชุดฝึก:</span>
                                            <p className="text-white font-medium">{historyDetail.homework_name || 'ไม่มีข้อมูล'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[#80ED99] text-sm">วิชา:</span>
                                            <p className="text-white">{historyDetail.homework_subject || 'ไม่มีข้อมูล'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[#80ED99] text-sm">ประเภทการตรวจ:</span>
                                            <p className="text-white">{historyDetail.a_homework?.check_type === 'AI' ? 'AI ตรวจ' : 'ครูตรวจ'}</p>
                                        </div>
                                        <div>
                                            <span className="text-[#80ED99] text-sm">จำนวนข้อ:</span>
                                            <p className="text-white">
                                                {historyDetail.homework_content?.questions?.length || 
                                                 historyDetail.a_homework?.content?.questions?.length || 
                                                 'ไม่มีข้อมูล'} ข้อ
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submission Info */}
                                <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B]">
                                    <h2 className="text-xl font-semibold text-white mb-4">ข้อมูลการส่งงาน</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[#80ED99] text-sm">สถานะ:</span>
                                            <p className="font-bold text-lg text-green-400">ส่งงานเรียบร้อยแล้ว</p>
                                        </div>
                                        <div>
                                            <span className="text-[#80ED99] text-sm">วันที่ส่งงาน:</span>
                                            <p className="text-white">
                                                {historyDetail.a_submission_time ? 
                                                    new Date(historyDetail.a_submission_time).toLocaleDateString('th-TH') : 
                                                    'ไม่มีข้อมูล'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Questions List */}
                                {(historyDetail.homework_content?.questions || historyDetail.a_homework?.content?.questions) && (
                                    <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B]">
                                        <h2 className="text-xl font-semibold text-white mb-4">รายละเอียดคำถาม</h2>
                                        <div className="space-y-6">
                                            {(historyDetail.homework_content?.questions || historyDetail.a_homework?.content?.questions)?.map((question: any, index: number) => (
                                                <div key={index} className="bg-[#2D4A5B] p-4 rounded-lg">
                                                    <div className="flex items-center mb-3">
                                                        <h3 className="text-[#80ED99] font-medium text-lg">ข้อที่ {index + 1}</h3>
                                                    </div>
                                                    <div className="text-white mb-4 text-base" dangerouslySetInnerHTML={{ __html: question.question }}></div>
                                                    
                                                    {question.options && (
                                                        <div className="space-y-2">
                                                            <p className="text-[#80ED99] text-sm font-medium">ตัวเลือก:</p>
                                                            {question.options.map((option: any, optIndex: number) => (
                                                                <div key={optIndex} className="p-3 rounded-lg text-sm bg-gray-700/50 text-gray-300 border border-gray-600/50">
                                                                    <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option.text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="mt-4 text-sm">
                                                        <span className="text-[#80ED99]">ประเภทคำถาม: </span>
                                                        <span className="text-white">{question.type || 'ปรนัย'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
}
