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
                                <h1 className="text-2xl font-bold text-white">สถิติการทำข้อสอบ</h1>
                                <p className="text-[#80ED99] mt-1">
                                    {historyDetail?.homework_name || 'กำลังโหลด...'} - {historyDetail?.student_name || 'นักเรียน'}
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/history')}
                                className="px-4 py-2 bg-[#80ED99] hover:bg-[#80ED99]/80 text-[#203D4F] font-semibold rounded-lg transition-colors duration-300 cursor-pointer"
                            >
                                กลับไปประวัติ
                            </button>
                        </div>

                        {/* Overall Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B] text-center">
                                <div className="text-3xl font-bold text-[#80ED99] mb-2">{overallStats.totalQuestions}</div>
                                <div className="text-white text-sm">จำนวนข้อทั้งหมด</div>
                            </div>
                            <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B] text-center">
                                <div className="text-3xl font-bold text-green-400 mb-2">{overallStats.correctAnswers}</div>
                                <div className="text-white text-sm">ตอบถูก</div>
                            </div>
                            <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B] text-center">
                                <div className="text-3xl font-bold text-red-400 mb-2">{overallStats.totalQuestions - overallStats.correctAnswers}</div>
                                <div className="text-white text-sm">ตอบผิด</div>
                            </div>
                            <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B] text-center">
                                <div className="text-3xl font-bold text-blue-400 mb-2">{overallStats.accuracy.toFixed(1)}%</div>
                                <div className="text-white text-sm">ความแม่นยำ</div>
                            </div>
                        </div>

                        {/* Performance Chart */}
                        {questionStats.length > 0 && (
                            <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B] mb-6">
                                <h2 className="text-xl font-semibold text-white mb-4">ความแม่นยำในแต่ละข้อ</h2>
                                <div className="h-64">
                                    <ChartBar 
                                        data={questionStats.map(stat => ({
                                            name: `ข้อ ${stat.questionNumber}`,
                                            count: stat.accuracy
                                        }))} 
                                        maxItems={questionStats.length}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Detailed Question Analysis */}
                        {questionStats.length > 0 && (
                            <div className="bg-[#203D4F] p-6 rounded-lg border-4 border-[#2D4A5B]">
                                <h2 className="text-xl font-semibold text-white mb-4">วิเคราะห์รายข้อ</h2>
                                <div className="space-y-4">
                                    {questionStats.map((stat, index) => (
                                        <div key={index} className="bg-[#2D4A5B] p-4 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-[#80ED99] font-medium text-lg">ข้อที่ {stat.questionNumber}</h3>
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    stat.accuracy === 100 
                                                        ? 'bg-green-500/20 text-green-400' 
                                                        : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    {stat.accuracy}% ความแม่นยำ
                                                </div>
                                            </div>
                                            
                                            {/* Question Text with KaTeX */}
                                            <div className="mb-4">
                                                <div className="text-white font-medium mb-2">คำถาม:</div>
                                                <div className="text-white bg-[#203D4F] p-3 rounded-lg">
                                                    <MathText className="text-white">{stat.question}</MathText>
                                                </div>
                                            </div>

                                            {/* Statistics */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-white">{stat.totalAttempts}</div>
                                                    <div className="text-xs text-white/60">ครั้งที่พยายาม</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-green-400">{stat.correctAnswers}</div>
                                                    <div className="text-xs text-white/60">ตอบถูก</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-red-400">{stat.incorrectAnswers}</div>
                                                    <div className="text-xs text-white/60">ตอบผิด</div>
                                                </div>
                                                <div className="text-center">
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
                                                            <div key={idx} className="bg-[#203D4F] p-2 rounded text-sm">
                                                                <span className="text-red-400">
                                                                    <MathText>{wrongAnswer.answer}</MathText>
                                                                </span>
                                                                <span className="text-white/60 ml-2">({wrongAnswer.count} ครั้ง)</span>
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
