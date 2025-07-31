'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { getUser } from "../../action/getuser";
import { getHistoryDetail } from "../../action/history";
import Navbar from "../../component/navbar";
import Sidebar from "../../component/sidebar";
import Footer from "../../component/footer";
import ChartBar from "../../component/chart-bar";
import { MathText } from "../../../utils/katexRenderer";

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

interface QuestionStatistic {
    questionNumber: number;
    question: string;
    totalAttempts: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    commonWrongAnswers: { answer: string; count: number }[];
}

export default function StudentStatisticsDashboard({ params }: { params: Promise<{ historyId: string }> }) {
    const [user, setUser] = useState<any>(null);
    const [historyDetail, setHistoryDetail] = useState<StudentHomeworkDetail | null>(null);
    const [questionStats, setQuestionStats] = useState<QuestionStatistic[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const resolvedParams = use(params);

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

    // Generate question statistics
    const generateQuestionStatistics = (homeworkData: StudentHomeworkDetail): QuestionStatistic[] => {
        const studentQuestions = homeworkData.a_homework?.content?.questions || [];
        const homeworkQuestions = homeworkData.homework_content?.questions || [];

        return studentQuestions.map((studentQuestion: any, index: number) => {
            // Find matching homework question by ID only (strict matching)
            const homeworkQuestion = homeworkQuestions.find((hq: any) => hq.id === studentQuestion.id);
            
            let isCorrect = false;
            let wrongAnswer = '';

            if (homeworkQuestion && studentQuestion.id === homeworkQuestion.id) {
                if (studentQuestion.question_type === 'multiple_choice') {
                    const studentSelectedIndex = studentQuestion.selected_option_index;
                    const correctIndex = homeworkQuestion.correct_option_index;
                    isCorrect = studentSelectedIndex === correctIndex;
                    
                    if (!isCorrect) {
                        wrongAnswer = studentQuestion.selected_answer || 'ไม่ได้ตอบ';
                    }
                } else if (studentQuestion.question_type === 'fill_in_blank') {
                    // Cannot check fill_in_blank without correct_answer
                    isCorrect = false;
                    wrongAnswer = 'ไม่รองรับการตรวจอัตนัย';
                }
            } else {
                // No matching question found
                wrongAnswer = 'ไม่พบคำถามที่ตรงกัน';
            }

            return {
                questionNumber: index + 1,
                question: studentQuestion.question || `ข้อที่ ${index + 1}`,
                totalAttempts: 1,
                correctAnswers: isCorrect ? 1 : 0,
                incorrectAnswers: isCorrect ? 0 : 1,
                accuracy: isCorrect ? 100 : 0,
                commonWrongAnswers: isCorrect ? [] : [{ 
                    answer: wrongAnswer,
                    count: 1
                }]
            };
        });
    };

    // No need to fix data since we only use correct_option_index now

    // Get history detail and generate statistics
    useEffect(() => {
        const fetchHistoryDetail = async () => {
            try {
                setLoading(true);
                const result = await getHistoryDetail(resolvedParams.historyId);
                
                if (result.type === 'success') {
                    setHistoryDetail(result.data);
                    const stats = generateQuestionStatistics(result.data);
                    setQuestionStats(stats);
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
    }, [user, resolvedParams.historyId]);

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

    const calculateOverallStats = () => {
        if (!questionStats.length) return { accuracy: 0, totalQuestions: 0, correctAnswers: 0 };
        
        const totalQuestions = questionStats.length;
        const correctAnswers = questionStats.reduce((sum, stat) => sum + stat.correctAnswers, 0);
        const accuracy = (correctAnswers / totalQuestions) * 100;
        
        return { accuracy, totalQuestions, correctAnswers };
    };

    const overallStats = calculateOverallStats();

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'ไม่ระบุ';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'ไม่ระบุ';
        }
    };

    const getStatusColor = (accuracy: number) => {
        if (accuracy >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
        if (accuracy >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    };

    const getStatusText = (accuracy: number) => {
        if (accuracy === 100) return '✓ เก่งมาก';
        if (accuracy >= 80) return '✓ ดี';
        if (accuracy >= 60) return '△ พอใช้';
        return '✗ ต้องปรับปรุง';
    };

    const getStatusBorderColor = (accuracy: number) => {
        if (accuracy >= 80) return 'border-green-400';
        if (accuracy >= 60) return 'border-yellow-400';
        return 'border-red-400';
    };

    const getStatusTextColor = (accuracy: number) => {
        if (accuracy >= 80) return 'text-green-400';
        if (accuracy >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen">
            <div className="w-11/12 justify-center m-auto flex flex-col min-h-screen">
                {/* Navbar */}
                <Navbar />

                <div className="flex flex-1 flex-col lg:flex-row gap-4 lg:py-0 xl:py-4 items-center">
                    {/* Sidebar */}
                    <Sidebar />

                    {/* Content */}
                    <div className="bg-[#2D4A5B] xl:mt-5 mb-5 lg:mb-0 rounded-xl w-full h-[calc(100vh-220px)] lg:h-[calc(100vh-140px)] xl:h-[700px] border-4 border-[#203D4F] p-5 overflow-y-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">สถิติการทำข้อสอบ</h1>
                                <div className="text-[#80ED99] space-y-2">
                                    <div className="break-words font-medium text-lg">{historyDetail?.homework_name || 'กำลังโหลด...'}</div>
                                    <div className="text-[#80ED99]/80 text-base">{historyDetail?.student_name || 'นักเรียน'}</div>
                                    {historyDetail?.class_name && (
                                        <div className="text-[#80ED99]/60 text-sm">ห้องเรียน: {historyDetail.class_name}</div>
                                    )}
                                    {historyDetail?.a_submission_time && (
                                        <div className="text-[#80ED99]/60 text-sm">ส่งงานเมื่อ: {formatDateTime(historyDetail.a_submission_time)}</div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/history')}
                                className="px-6 py-3 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 cursor-pointer whitespace-nowrap flex-shrink-0"
                            >
                                กลับไปประวัติ
                            </button>
                        </div>

                        {/* Overall Statistics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-[#203D4F] p-6 rounded-xl border border-[#4A5F6B] text-center hover:bg-[#1a3342] transition-colors duration-300">
                                <div className="text-3xl font-bold text-[#80ED99] mb-2">{overallStats.totalQuestions}</div>
                                <div className="text-white text-sm font-medium">จำนวนข้อทั้งหมด</div>
                            </div>
                            <div className="bg-[#203D4F] p-6 rounded-xl border border-[#4A5F6B] text-center hover:bg-[#1a3342] transition-colors duration-300">
                                <div className="text-3xl font-bold text-green-400 mb-2">{overallStats.correctAnswers}</div>
                                <div className="text-white text-sm font-medium">ตอบถูก</div>
                            </div>
                            <div className="bg-[#203D4F] p-6 rounded-xl border border-[#4A5F6B] text-center hover:bg-[#1a3342] transition-colors duration-300">
                                <div className="text-3xl font-bold text-red-400 mb-2">{overallStats.totalQuestions - overallStats.correctAnswers}</div>
                                <div className="text-white text-sm font-medium">ตอบผิด</div>
                            </div>
                            <div className={`p-6 rounded-xl border text-center col-span-2 lg:col-span-1 transition-all duration-300 ${getStatusColor(overallStats.accuracy)}`}>
                                <div className="text-3xl font-bold mb-2">{overallStats.accuracy.toFixed(1)}%</div>
                                <div className="text-sm font-medium">{getStatusText(overallStats.accuracy)}</div>
                                <div className="text-xs opacity-70 mt-1">ความแม่นยำโดยรวม</div>
                            </div>
                        </div>

                        {/* Performance Chart */}
                        {questionStats.length > 0 ? (
                            <div className="bg-[#203D4F] p-6 rounded-xl border border-[#4A5F6B] mb-6">
                                <h2 className="text-xl font-semibold text-white mb-4">ความแม่นยำในแต่ละข้อ</h2>
                                <div className="bg-[#1a3342] p-4 rounded-lg">
                                    <div className="h-64 w-full">
                                        <ChartBar 
                                            data={questionStats.map(stat => ({
                                                name: `ข้อ ${stat.questionNumber}`,
                                                count: stat.accuracy
                                            }))} 
                                            maxItems={questionStats.length}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#203D4F] p-6 rounded-xl border border-[#4A5F6B] mb-6 text-center">
                                <div className="text-white/60">
                                    ไม่พบข้อมูลคำถามในการส่งงานนี้
                                </div>
                            </div>
                        )}

                        {/* Detailed Question Analysis */}
                        {questionStats.length > 0 && (
                            <div className="bg-[#203D4F] p-6 rounded-xl border border-[#4A5F6B]">
                                <h2 className="text-xl font-semibold text-white mb-4">วิเคราะห์รายข้อ</h2>
                                <div className="space-y-4">
                                    {questionStats.map((stat, index) => (
                                        <div key={index} className={`bg-[#2D4A5B] p-4 rounded-xl border ${getStatusBorderColor(stat.accuracy)}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                                <h3 className={`${getStatusTextColor(stat.accuracy)} font-medium text-lg`}>ข้อที่ {stat.questionNumber}</h3>
                                                <div className={`px-4 py-2 rounded-lg text-sm font-medium self-start sm:self-auto border ${getStatusColor(stat.accuracy)}`}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{getStatusText(stat.accuracy)}</span>
                                                        <span className="text-xs opacity-80">({stat.accuracy.toFixed(1)}%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Question Text with KaTeX */}
                                            <div className="mb-4">
                                                <div className="text-white font-medium mb-2">คำถาม:</div>
                                                <div className="text-white bg-[#203D4F] p-4 rounded-lg border border-[#4A5F6B]">
                                                    <MathText className="text-white">{stat.question}</MathText>
                                                </div>
                                            </div>

                                            {/* Statistics */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                <div className="text-center bg-[#203D4F] p-3 rounded-lg border border-[#4A5F6B]">
                                                    <div className="text-lg font-bold text-white">{stat.totalAttempts}</div>
                                                    <div className="text-xs text-white/60">ครั้งที่พยายาม</div>
                                                </div>
                                                <div className="text-center bg-[#203D4F] p-3 rounded-lg border border-[#4A5F6B]">
                                                    <div className="text-lg font-bold text-green-400">{stat.correctAnswers}</div>
                                                    <div className="text-xs text-white/60">ตอบถูก</div>
                                                </div>
                                                <div className="text-center bg-[#203D4F] p-3 rounded-lg border border-[#4A5F6B]">
                                                    <div className="text-lg font-bold text-red-400">{stat.incorrectAnswers}</div>
                                                    <div className="text-xs text-white/60">ตอบผิด</div>
                                                </div>
                                                <div className="text-center bg-[#203D4F] p-3 rounded-lg border border-[#4A5F6B] col-span-2 sm:col-span-1">
                                                    <div className="text-lg font-bold text-blue-400">{stat.accuracy.toFixed(1)}%</div>
                                                    <div className="text-xs text-white/60">ความแม่นยำ</div>
                                                </div>
                                            </div>

                                            {/* Common Wrong Answers */}
                                            {stat.commonWrongAnswers.length > 0 && (
                                                <div>
                                                    <div className="text-white font-medium mb-2">คำตอบที่ผิดบ่อย:</div>
                                                    <div className="space-y-2">
                                                        {stat.commonWrongAnswers.map((wrongAnswer, idx) => (
                                                            <div key={idx} className="bg-[#203D4F] p-3 rounded-lg border border-[#4A5F6B]">
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                                    <span className="text-red-400 flex-1">
                                                                        <MathText>{wrongAnswer.answer}</MathText>
                                                                    </span>
                                                                    <span className="text-white/60 text-xs">({wrongAnswer.count} ครั้ง)</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
