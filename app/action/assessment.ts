'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";

interface FormativeScore {
    homework_id: number;
    homework_name: string;
    score: number;
    max_score: number;
    completion_date: string;
    type: 'homework' | 'quiz' | 'activity';
    question_details?: QuestionDetail[];
    content_analysis?: ContentAnalysis;
}

interface SummativeScore {
    exam_id: number;
    exam_name: string;
    score: number;
    max_score: number;
    completion_date: string;
    type: 'midterm' | 'final' | 'major_test';
    question_details?: QuestionDetail[];
    content_analysis?: ContentAnalysis;
}

interface QuestionDetail {
    question_id: number;
    question_text: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    question_score: number;
    max_question_score: number;
    question_type: 'multiple_choice' | 'short_answer' | 'essay';
    difficulty_level: string;
    bloom_level: string;
    student_selected_option?: number;
    correct_option_index?: number;
    options?: string[];
}

interface ContentAnalysis {
    total_questions: number;
    correct_answers: number;
    incorrect_answers: number;
    accuracy_percentage: number;
    questions_by_difficulty: {
        easy: { correct: number; total: number; percentage: number };
        medium: { correct: number; total: number; percentage: number };
        hard: { correct: number; total: number; percentage: number };
    };
    questions_by_bloom: {
        [key: string]: { correct: number; total: number; percentage: number };
    };
    subject_mastery: {
        subject: string;
        level: string;
        mastery_score: number;
        areas_of_improvement: string[];
        strengths: string[];
    };
}

interface StudentAssessment {
    s_id: number;
    s_fullname: string;
    s_email: string;
    s_username: string;
    formative_scores: FormativeScore[];
    summative_scores: SummativeScore[];
    overall_performance: {
        formative_average: number;
        summative_average: number;
        total_assignments: number;
        completed_assignments: number;
        completion_rate: number;
    };
}

// Enhanced content matching function to analyze homework content and student answers
function analyzeHomeworkContent(studentHomework: any, originalHomework: any): { questionDetails: QuestionDetail[], contentAnalysis: ContentAnalysis } {
    const questionDetails: QuestionDetail[] = [];
    let correctCount = 0;
    let totalScore = 0;
    let maxScore = 0;
    
    const difficultyStats = { easy: { correct: 0, total: 0, percentage: 0 }, medium: { correct: 0, total: 0, percentage: 0 }, hard: { correct: 0, total: 0, percentage: 0 } };
    const bloomStats: { [key: string]: { correct: number; total: number; percentage: number } } = {};
    
    const studentQuestions = studentHomework?.content?.questions || [];
    const originalQuestions = originalHomework?.h_content?.questions || [];
    
    studentQuestions.forEach((studentQ: any, index: number) => {
        const originalQ = originalQuestions.find((oq: any) => oq.id === studentQ.id) || originalQuestions[index];
        
        if (originalQ) {
            // Use EXACTLY the same logic as history with REAL data structure
            const answerStatus = getAnswerStatus(studentQ, originalQ);
            const isCorrect = answerStatus.isCorrect;
            const questionScore = isCorrect ? (originalQ.score || 1) : 0;
            const maxQuestionScore = originalQ.score || 1;
            
            totalScore += questionScore;
            maxScore += maxQuestionScore;
            
            if (isCorrect) correctCount++;
            
            // Track difficulty stats
            const difficulty = originalQ.difficulty || 'medium';
            if (difficultyStats[difficulty as keyof typeof difficultyStats]) {
                difficultyStats[difficulty as keyof typeof difficultyStats].total++;
                if (isCorrect) difficultyStats[difficulty as keyof typeof difficultyStats].correct++;
            }
            
            // Track Bloom taxonomy stats
            const bloomLevel = originalQ.bloom_level || 'เข้าใจ';
            if (!bloomStats[bloomLevel]) {
                bloomStats[bloomLevel] = { correct: 0, total: 0, percentage: 0 };
            }
            bloomStats[bloomLevel].total++;
            if (isCorrect) bloomStats[bloomLevel].correct++;

            questionDetails.push({
                question_id: studentQ.id || index + 1,
                question_text: originalQ.question || 'ไม่มีข้อมูลคำถาม',
                student_answer: answerStatus.studentAnswer,
                correct_answer: answerStatus.correctAnswer,
                is_correct: isCorrect,
                question_score: questionScore,
                max_question_score: maxQuestionScore,
                question_type: originalQ.question_type || 'multiple_choice',
                difficulty_level: difficulty,
                bloom_level: bloomLevel,
                student_selected_option: answerStatus.studentSelectedIndex,
                correct_option_index: answerStatus.correctIndex,
                options: originalQ.options || []
            });
        }
    });
    
    // Calculate percentages
    Object.keys(difficultyStats).forEach(key => {
        const stat = difficultyStats[key as keyof typeof difficultyStats];
        stat.percentage = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
    });
    
    Object.keys(bloomStats).forEach(key => {
        bloomStats[key].percentage = bloomStats[key].total > 0 ? (bloomStats[key].correct / bloomStats[key].total) * 100 : 0;
    });
    
    const accuracyPercentage = studentQuestions.length > 0 ? (correctCount / studentQuestions.length) * 100 : 0;
    const masteryScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    // Determine areas of improvement and strengths
    const areasOfImprovement: string[] = [];
    const strengths: string[] = [];
    
    Object.entries(difficultyStats).forEach(([level, stats]) => {
        if (stats.percentage < 60 && stats.total > 0) {
            areasOfImprovement.push(`โจทย์ระดับ${level === 'easy' ? 'ง่าย' : level === 'medium' ? 'ปานกลาง' : 'ยาก'}`);
        } else if (stats.percentage >= 80 && stats.total > 0) {
            strengths.push(`โจทย์ระดับ${level === 'easy' ? 'ง่าย' : level === 'medium' ? 'ปานกลาง' : 'ยาก'}`);
        }
    });
    
    Object.entries(bloomStats).forEach(([level, stats]) => {
        if (stats.percentage < 60 && stats.total > 0) {
            areasOfImprovement.push(`ทักษะ${level}`);
        } else if (stats.percentage >= 80 && stats.total > 0) {
            strengths.push(`ทักษะ${level}`);
        }
    });
    
    const contentAnalysis: ContentAnalysis = {
        total_questions: studentQuestions.length,
        correct_answers: correctCount,
        incorrect_answers: studentQuestions.length - correctCount,
        accuracy_percentage: accuracyPercentage,
        questions_by_difficulty: difficultyStats,
        questions_by_bloom: bloomStats,
        subject_mastery: {
            subject: originalHomework?.h_subject || 'คณิตศาสตร์',
            level: studentHomework?.content?.metadata?.level || 'ไม่ระบุ',
            mastery_score: masteryScore,
            areas_of_improvement: areasOfImprovement,
            strengths: strengths
        }
    };
    
    return { questionDetails, contentAnalysis };
}

// Helper function to get answer status - EXACTLY matches history checking logic
function getAnswerStatus(studentQuestion: any, homeworkQuestion: any) {
    // Check if questions match by ID first
    if (studentQuestion.id !== homeworkQuestion?.id) {
        return {
            isCorrect: false,
            correctAnswer: 'คำถามไม่ตรงกัน',
            studentAnswer: studentQuestion.selected_answer || 'ไม่ได้ตอบ',
            error: 'Question ID mismatch'
        };
    }
    
    if (studentQuestion.question_type === 'multiple_choice') {
        const studentSelectedIndex = studentQuestion.selected_option_index;
        const correctIndex = homeworkQuestion.correct_option_index;
        const isCorrect = studentSelectedIndex === correctIndex;

        return {
            isCorrect,
            correctAnswer: homeworkQuestion.options?.[correctIndex] || 'ไม่พบคำตอบที่ถูก',
            studentAnswer: studentQuestion.selected_answer || studentQuestion.options?.[studentSelectedIndex] || 'ไม่ได้ตอบ',
            correctIndex,
            studentSelectedIndex
        };
    } else if (studentQuestion.question_type === 'fill_in_blank') {
        const studentAnswer = studentQuestion.selected_answer || studentQuestion.answer;
        // For fill_in_blank, we cannot determine correctness without correct_answer
        // Since we're removing correct_answer usage, mark as unable to check
        
        return {
            isCorrect: false,
            correctAnswer: 'ไม่รองรับการตรวจอัตนัย',
            studentAnswer: studentAnswer || 'ไม่ได้ตอบ',
            error: 'Cannot check fill_in_blank without correct_answer'
        };
    }
    
    return {
        isCorrect: false,
        correctAnswer: 'ประเภทคำถามไม่รู้จัก',
        studentAnswer: studentQuestion.selected_answer || 'ไม่ได้ตอบ'
    };
}

// Helper function to check answer correctness using the same logic as history
function checkAnswerCorrectness(studentQ: any, originalQ: any): boolean {
    const status = getAnswerStatus(studentQ, originalQ);
    return status.isCorrect;
}

// Helper function to get student's answer using the same logic as history
function getStudentAnswer(studentQ: any): string {
    if (studentQ.question_type === 'multiple_choice') {
        return studentQ.selected_answer || studentQ.options?.[studentQ.selected_option_index] || 'ไม่ได้ตอบ';
    } else if (studentQ.question_type === 'fill_in_blank') {
        return studentQ.selected_answer || studentQ.answer || 'ไม่ได้ตอบ';
    }
    
    return studentQ.selected_answer || 'ไม่ได้ตอบ';
}

// Helper function to get correct answer using the same logic as history
function getCorrectAnswer(originalQ: any): string {
    if (originalQ.question_type === 'multiple_choice') {
        return originalQ.options?.[originalQ.correct_option_index] || 'ไม่พบคำตอบที่ถูก';
    } else if (originalQ.question_type === 'fill_in_blank') {
        return 'ไม่รองรับการตรวจอัตนัย';
    }
    
    return 'ประเภทคำถามไม่รู้จัก';
}

// Get comprehensive assessment data for all students in a class
async function getStudentAssessmentData(classId: number): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();

        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        // Get class data and verify teacher access
        const { data: classData, error: classError } = await supabase
            .from("classs")
            .select("c_students")
            .eq("c_id", classId)
            .eq("c_tid", userData.t_id)
            .single();

        if (classError || !classData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบห้องเรียนหรือไม่มีสิทธิ์เข้าถึง", type: "error" };
        }

        const students = classData.c_students || {};
        const studentList = Object.values(students) as Array<{ s_id: number; [key: string]: any }>;

        if (studentList.length === 0) {
            return { type: "success", data: [] };
        }

        const studentIds = studentList.map(student => student.s_id);

        // Get student details
        const { data: studentDetails, error: studentError } = await supabase
            .from("students")
            .select("s_id, s_fullname, s_email, s_username")
            .in("s_id", studentIds);

        if (studentError) {
            console.error("Student details fetch error:", studentError);
        }

        // Get all homework activities for this class (formative assessments)
        const { data: activesData, error: activesError } = await supabase
            .from("actives")
            .select("a_id, a_sid, a_homework, a_status")
            .eq("a_cid", classId)
            .eq("a_temail", userData.t_email);

        if (activesError) {
            console.error("Actives fetch error:", activesError);
        }

        // Get homework completion history
        const { data: historyData, error: historyError } = await supabase
            .from("history")
            .select("his_aid, his_semail, his_time")
            .eq("his_cid", classId)
            .eq("his_temail", userData.t_email);

        if (historyError) {
            console.error("History fetch error:", historyError);
        }

        // Get homework details
        const homeworkIds = new Set<number>();
        activesData?.forEach(active => {
            let homeworkId;
            if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                homeworkId = active.a_homework.id;
            } else if (typeof active.a_homework === 'number') {
                homeworkId = active.a_homework;
            }
            if (homeworkId) {
                homeworkIds.add(homeworkId);
            }
        });

        const { data: homeworkDetails, error: homeworkError } = await supabase
            .from("homework")
            .select("h_id, h_name, h_subject, h_score, h_type")
            .in("h_id", Array.from(homeworkIds));

        if (homeworkError) {
            console.error("Homework details fetch error:", homeworkError);
        }

        // Create homework map for easy lookup
        const homeworkMap = new Map(homeworkDetails?.map(hw => [hw.h_id, hw]) || []);

        // Create history map for easy lookup (by active ID)
        const historyMap = new Map();
        historyData?.forEach(history => {
            historyMap.set(history.his_aid, history);
        });

        // Process assessment data for each student
        const assessmentData: StudentAssessment[] = [];

        for (const studentInfo of studentList) {
            const studentDetail = studentDetails?.find(sd => sd.s_id === studentInfo.s_id);
            
            if (!studentDetail) continue;

            // Get student's activities
            const studentActives = activesData?.filter(active => active.a_sid === studentInfo.s_id) || [];
            
            const formativeScores: FormativeScore[] = [];
            let totalAssignments = 0;
            let completedAssignments = 0;

            for (const active of studentActives) {
                let homeworkId;
                if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                    homeworkId = active.a_homework.id;
                } else if (typeof active.a_homework === 'number') {
                    homeworkId = active.a_homework;
                }

                if (!homeworkId) continue;

                const homework = homeworkMap.get(homeworkId);
                if (!homework) continue;

                totalAssignments++;
                
                if (active.a_status === 'done') {
                    completedAssignments++;
                    
                    const history = historyMap.get(active.a_id);
                    let score = 0; // Will be calculated from assessment results or homework scoring
                    const maxScore = homework.h_score || 100;

                    // Categorize as formative assessment (homework, quiz, activity)
                    let assessmentType: 'homework' | 'quiz' | 'activity' = 'homework';
                    if (homework.h_type?.toLowerCase().includes('quiz') || homework.h_type?.toLowerCase().includes('แบบทดสอบ')) {
                        assessmentType = 'quiz';
                    } else if (homework.h_type?.toLowerCase().includes('activity') || homework.h_type?.toLowerCase().includes('กิจกรรม')) {
                        assessmentType = 'activity';
                    }

                    // Enhanced content analysis - use saved data if available, otherwise analyze
                    let questionDetails: QuestionDetail[] = [];
                    let contentAnalysis: ContentAnalysis | undefined;
                    
                    try {
                        if (active.a_homework?.assessment_results?.version) {
                            // Use pre-processed assessment results
                            const assessmentResults = active.a_homework.assessment_results;
                            
                            questionDetails = assessmentResults.questions.map((q: any) => ({
                                question_id: q.id,
                                question_text: 'ไม่มีข้อมูลคำถาม', // Not stored in assessment_results
                                student_answer: q.student_selected_answer,
                                correct_answer: q.correct_answer,
                                is_correct: q.is_correct,
                                question_score: q.points_earned,
                                max_question_score: q.max_points,
                                question_type: q.question_type,
                                difficulty_level: q.difficulty,
                                bloom_level: q.bloom_taxonomy,
                                student_selected_option: q.student_option_index,
                                correct_option_index: q.correct_option_index,
                                options: [] // Not stored in assessment_results
                            }));
                            
                            contentAnalysis = {
                                total_questions: assessmentResults.summary.questions_total,
                                correct_answers: assessmentResults.summary.correct_count,
                                incorrect_answers: assessmentResults.summary.incorrect_count,
                                accuracy_percentage: assessmentResults.summary.percentage,
                                questions_by_difficulty: assessmentResults.performance_by_difficulty,
                                questions_by_bloom: assessmentResults.performance_by_bloom,
                                subject_mastery: {
                                    subject: assessmentResults.learning_analytics.subject,
                                    level: assessmentResults.learning_analytics.grade_level,
                                    mastery_score: assessmentResults.learning_analytics.mastery_percentage,
                                    areas_of_improvement: assessmentResults.learning_analytics.improvement_areas,
                                    strengths: assessmentResults.learning_analytics.strengths
                                }
                            };
                            
                            // Update score from assessment results
                            if (assessmentResults.summary.total_score !== undefined) {
                                score = assessmentResults.summary.total_score;
                            }
                        } else if (active.a_homework && homework) {
                            // Fallback to real-time analysis
                            const analysis = analyzeHomeworkContent(active.a_homework, homework);
                            questionDetails = analysis.questionDetails;
                            contentAnalysis = analysis.contentAnalysis;
                        }
                    } catch (error) {
                        console.log("Content analysis error:", error);
                    }

                    formativeScores.push({
                        homework_id: homeworkId,
                        homework_name: homework.h_name,
                        score: score,
                        max_score: maxScore,
                        completion_date: history?.his_time || new Date().toISOString(),
                        type: assessmentType,
                        question_details: questionDetails,
                        content_analysis: contentAnalysis
                    });
                }
            }

            // Calculate formative average
            const formativeAverage = formativeScores.length > 0
                ? formativeScores.reduce((sum, score) => sum + (score.score / score.max_score) * 100, 0) / formativeScores.length
                : 0;

            // For now, summative scores are empty as we don't have dedicated exam system
            // This can be extended when exam/test features are added
            const summativeScores: SummativeScore[] = [];
            const summativeAverage = 0;

            const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

            assessmentData.push({
                s_id: studentDetail.s_id,
                s_fullname: studentDetail.s_fullname,
                s_email: studentDetail.s_email,
                s_username: studentDetail.s_username,
                formative_scores: formativeScores,
                summative_scores: summativeScores,
                overall_performance: {
                    formative_average: formativeAverage,
                    summative_average: summativeAverage,
                    total_assignments: totalAssignments,
                    completed_assignments: completedAssignments,
                    completion_rate: completionRate
                }
            });
        }

        return {
            type: "success",
            data: assessmentData
        };

    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Get detailed assessment data for a specific student
async function getStudentDetailedAssessment(classId: number, studentId: number): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();

        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        // Verify teacher access to class
        const { data: classData, error: classError } = await supabase
            .from("classs")
            .select("c_id")
            .eq("c_id", classId)
            .eq("c_tid", userData.t_id)
            .single();

        if (classError || !classData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบห้องเรียนหรือไม่มีสิทธิ์เข้าถึง", type: "error" };
        }

        // Get student details
        const { data: studentDetail, error: studentError } = await supabase
            .from("students")
            .select("*")
            .eq("s_id", studentId)
            .single();

        if (studentError || !studentDetail) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลนักเรียน", type: "error" };
        }

        // Get student's activities in this class
        const { data: activesData, error: activesError } = await supabase
            .from("actives")
            .select("*")
            .eq("a_cid", classId)
            .eq("a_sid", studentId)
            .eq("a_temail", userData.t_email);

        if (activesError) {
            console.error("Actives fetch error:", activesError);
        }

        // Get student's completion history
        const activeIds = activesData?.map(active => active.a_id) || [];
        let historyData: any[] = [];
        
        if (activeIds.length > 0) {
            const { data: history, error: historyError } = await supabase
                .from("history")
                .select("*")
                .in("his_aid", activeIds);

            if (!historyError && history) {
                historyData = history;
            }
        }

        // Get homework details
        const homeworkIds = new Set<number>();
        activesData?.forEach(active => {
            let homeworkId;
            if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                homeworkId = active.a_homework.id;
            } else if (typeof active.a_homework === 'number') {
                homeworkId = active.a_homework;
            }
            if (homeworkId) {
                homeworkIds.add(homeworkId);
            }
        });

        const { data: homeworkDetails } = await supabase
            .from("homework")
            .select("*")
            .in("h_id", Array.from(homeworkIds));

        // Create detailed assessment data
        const detailedAssessment = {
            student: studentDetail,
            class_id: classId,
            activities: activesData?.map(active => {
                let homeworkId: number | undefined;
                if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                    homeworkId = active.a_homework.id;
                } else if (typeof active.a_homework === 'number') {
                    homeworkId = active.a_homework;
                }

                const homework = homeworkDetails?.find(hw => hw.h_id === homeworkId);
                const history = historyData.find(h => h.his_aid === active.a_id);

                return {
                    ...active,
                    homework: homework,
                    history: history,
                    score_percentage: 0 // Will be calculated from assessment results if available
                };
            }) || []
        };

        return {
            type: "success",
            data: detailedAssessment
        };

    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Export functions for formative and summative assessment data
async function exportAssessmentData(classId: number, format: 'csv' | 'pdf' = 'csv'): Promise<any> {
    try {
        const assessmentResult = await getStudentAssessmentData(classId);
        
        if (assessmentResult.type !== 'success') {
            return assessmentResult;
        }

        const assessmentData = assessmentResult.data;

        if (format === 'csv') {
            // Create CSV data
            const headers = [
                'Student ID',
                'Student Name',
                'Email',
                'Username',
                'Formative Average (%)',
                'Summative Average (%)',
                'Total Assignments',
                'Completed Assignments',
                'Completion Rate (%)',
                'Overall Performance'
            ];

            const rows = assessmentData.map((student: StudentAssessment) => [
                student.s_id,
                student.s_fullname || student.s_username,
                student.s_email,
                student.s_username,
                student.overall_performance.formative_average.toFixed(2),
                student.overall_performance.summative_average.toFixed(2),
                student.overall_performance.total_assignments,
                student.overall_performance.completed_assignments,
                student.overall_performance.completion_rate.toFixed(2),
                student.overall_performance.formative_average >= 80 ? 'ดีเยี่ยม' :
                student.overall_performance.formative_average >= 60 ? 'ปานกลาง' : 'ต้องปรับปรุง'
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.map((field: any) => `"${field}"`).join(','))
                .join('\n');

            return {
                type: "success",
                data: csvContent,
                filename: `assessment_report_class_${classId}_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        // For PDF format, return structured data for client-side PDF generation
        return {
            type: "success",
            data: assessmentData,
            format: 'pdf'
        };

    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Get comprehensive class performance analysis
async function getClassPerformanceAnalysis(classId: number): Promise<any> {
    try {
        const assessmentResult = await getStudentAssessmentData(classId);
        
        if (assessmentResult.type !== 'success') {
            return assessmentResult;
        }

        const studentsData = assessmentResult.data;
        
        // Aggregate class statistics
        let totalFormativeScores = 0;
        let totalSummativeScores = 0;
        let totalStudents = studentsData.length;
        let totalQuestions = 0;
        let totalCorrectAnswers = 0;
        
        const classBloomStats: { [key: string]: { correct: number; total: number; percentage: number } } = {};
        const classDifficultyStats = { easy: { correct: 0, total: 0, percentage: 0 }, medium: { correct: 0, total: 0, percentage: 0 }, hard: { correct: 0, total: 0, percentage: 0 } };
        const subjectMastery: { [key: string]: number[] } = {};

        studentsData.forEach((student: any) => {
            totalFormativeScores += student.overall_performance.formative_average;
            totalSummativeScores += student.overall_performance.summative_average;
            
            // Aggregate question-level data
            student.formative_scores.forEach((score: any) => {
                if (score.content_analysis) {
                    const analysis = score.content_analysis;
                    totalQuestions += analysis.total_questions;
                    totalCorrectAnswers += analysis.correct_answers;
                    
                    // Aggregate Bloom stats
                    Object.entries(analysis.questions_by_bloom).forEach(([level, stats]: [string, any]) => {
                        if (!classBloomStats[level]) {
                            classBloomStats[level] = { correct: 0, total: 0, percentage: 0 };
                        }
                        classBloomStats[level].correct += stats.correct;
                        classBloomStats[level].total += stats.total;
                    });
                    
                    // Aggregate difficulty stats
                    Object.entries(analysis.questions_by_difficulty).forEach(([level, stats]: [string, any]) => {
                        if (classDifficultyStats[level as keyof typeof classDifficultyStats]) {
                            classDifficultyStats[level as keyof typeof classDifficultyStats].correct += stats.correct;
                            classDifficultyStats[level as keyof typeof classDifficultyStats].total += stats.total;
                        }
                    });
                    
                    // Subject mastery tracking
                    const subject = analysis.subject_mastery.subject;
                    if (!subjectMastery[subject]) {
                        subjectMastery[subject] = [];
                    }
                    subjectMastery[subject].push(analysis.subject_mastery.mastery_score);
                }
            });
        });

        // Calculate percentages
        Object.keys(classBloomStats).forEach(key => {
            const stats = classBloomStats[key];
            stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        });

        Object.keys(classDifficultyStats).forEach(key => {
            const stats = classDifficultyStats[key as keyof typeof classDifficultyStats];
            stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        });

        const classAnalysis = {
            class_id: classId,
            total_students: totalStudents,
            overall_performance: {
                formative_average: totalStudents > 0 ? totalFormativeScores / totalStudents : 0,
                summative_average: totalStudents > 0 ? totalSummativeScores / totalStudents : 0,
                class_accuracy: totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0
            },
            class_bloom_performance: classBloomStats,
            class_difficulty_performance: classDifficultyStats,
            subject_mastery_overview: Object.entries(subjectMastery).map(([subject, scores]) => ({
                subject,
                average_mastery: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
                student_count: scores.length,
                mastery_distribution: {
                    excellent: scores.filter(s => s >= 80).length,
                    good: scores.filter(s => s >= 60 && s < 80).length,
                    needs_improvement: scores.filter(s => s < 60).length
                }
            })),
            students_detailed_data: studentsData
        };

        return {
            type: "success",
            data: classAnalysis
        };

    } catch (error: any) {
        console.log("Class analysis error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดในการวิเคราะห์ห้องเรียน", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Get individual student progress tracking
async function getStudentProgressTracking(classId: number, studentId: number): Promise<any> {
    try {
        const detailedResult = await getStudentDetailedAssessment(classId, studentId);
        
        if (detailedResult.type !== 'success') {
            return detailedResult;
        }

        const studentData = detailedResult.data;
        
        // Track progress over time
        const progressTimeline: any[] = [];
        const skillDevelopment: { [key: string]: number[] } = {};
        const subjectProgress: { [key: string]: number[] } = {};

        if (studentData.activities) {
            studentData.activities
                .filter((activity: any) => activity.history && activity.homework)
                .sort((a: any, b: any) => new Date(a.history.his_time).getTime() - new Date(b.history.his_time).getTime())
                .forEach((activity: any) => {
                    const completionDate = activity.history.his_time;
                    const score = activity.score_percentage || 0;
                    const subject = activity.homework.h_subject || 'คณิตศาสตร์';
                    
                    progressTimeline.push({
                        date: completionDate,
                        assignment_name: activity.homework.h_name,
                        score: score,
                        subject: subject,
                        assignment_type: activity.homework.h_type || 'homework'
                    });

                    // Track subject progress
                    if (!subjectProgress[subject]) {
                        subjectProgress[subject] = [];
                    }
                    subjectProgress[subject].push(score);

                    // If we have detailed content analysis, track skill development
                    if (activity.a_homework?.content) {
                        try {
                            const analysis = analyzeHomeworkContent(activity.a_homework, activity.homework);
                            Object.entries(analysis.contentAnalysis.questions_by_bloom).forEach(([skill, stats]: [string, any]) => {
                                if (!skillDevelopment[skill]) {
                                    skillDevelopment[skill] = [];
                                }
                                skillDevelopment[skill].push(stats.percentage);
                            });
                        } catch (error) {
                            console.log("Error analyzing activity content:", error);
                        }
                    }
                });
        }

        const progressAnalysis = {
            student: studentData.student,
            class_id: classId,
            progress_timeline: progressTimeline,
            skill_development_tracking: Object.entries(skillDevelopment).map(([skill, scores]) => ({
                skill,
                progress_scores: scores,
                current_level: scores.length > 0 ? scores[scores.length - 1] : 0,
                improvement_trend: calculateTrend(scores),
                average_performance: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
            })),
            subject_progress_tracking: Object.entries(subjectProgress).map(([subject, scores]) => ({
                subject,
                progress_scores: scores,
                current_level: scores.length > 0 ? scores[scores.length - 1] : 0,
                improvement_trend: calculateTrend(scores),
                average_performance: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
            })),
            recommendations: generateStudentRecommendations(skillDevelopment, subjectProgress)
        };

        return {
            type: "success",
            data: progressAnalysis
        };

    } catch (error: any) {
        console.log("Student progress tracking error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดในการติดตามความก้าวหน้า", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Helper function to calculate trend
function calculateTrend(scores: number[]): 'improving' | 'declining' | 'stable' | 'insufficient_data' {
    if (scores.length < 2) return 'insufficient_data';
    
    const recentScores = scores.slice(-3); // Last 3 scores
    const earlierScores = scores.slice(0, Math.min(3, scores.length - 3)); // Earlier scores
    
    if (earlierScores.length === 0) return 'insufficient_data';
    
    const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const earlierAvg = earlierScores.reduce((sum, score) => sum + score, 0) / earlierScores.length;
    
    const difference = recentAvg - earlierAvg;
    
    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
}

// Helper function to generate student recommendations
function generateStudentRecommendations(skillDevelopment: { [key: string]: number[] }, subjectProgress: { [key: string]: number[] }): string[] {
    const recommendations: string[] = [];
    
    // Skill-based recommendations
    Object.entries(skillDevelopment).forEach(([skill, scores]) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        if (avgScore < 60) {
            recommendations.push(`ต้องเพิ่มการฝึกฝนในทักษะ${skill}`);
        } else if (avgScore > 80) {
            recommendations.push(`มีความแข็งแกร่งในทักษะ${skill} ควรใช้เป็นฐานในการเรียนหัวข้อใหม่`);
        }
    });
    
    // Subject-based recommendations
    Object.entries(subjectProgress).forEach(([subject, scores]) => {
        const trend = calculateTrend(scores);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        if (trend === 'declining' && avgScore < 70) {
            recommendations.push(`ต้องให้ความสนใจเป็นพิเศษในวิชา${subject} เนื่องจากผลการเรียนกำลังลดลง`);
        } else if (trend === 'improving') {
            recommendations.push(`มีความก้าวหน้าที่ดีในวิชา${subject} ควรรักษาการพัฒนาต่อไป`);
        }
    });
    
    if (recommendations.length === 0) {
        recommendations.push('ผลการเรียนอยู่ในระดับที่ดี ควรรักษาการเรียนรู้อย่างต่อเนื่อง');
    }
    
    return recommendations;
}

// Update a_homework with detailed scoring analysis when accessing assessment page
async function updateHomeworkWithDetailedScoring(activeId: number, homeworkId: number): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();

        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        // Get current active record
        const { data: activeData, error: activeError } = await supabase
            .from("actives")
            .select("*")
            .eq("a_id", activeId)
            .eq("a_temail", userData.t_email)
            .single();

        if (activeError || !activeData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลการมอบหมายงาน", type: "error" };
        }

        // Get original homework content
        const { data: homeworkData, error: homeworkError } = await supabase
            .from("homework")
            .select("*")
            .eq("h_id", homeworkId)
            .eq("h_temail", userData.t_email)
            .single();

        if (homeworkError || !homeworkData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลการบ้าน", type: "error" };
        }

        // Check if a_homework already has assessment results
        const currentHomework = activeData.a_homework;
        if (currentHomework?.assessment_results?.version) {
            return { type: "success", message: "รายละเอียดคะแนนได้ถูกประมวลผลแล้ว" };
        }

        // Perform detailed analysis
        const analysis = analyzeHomeworkContent(currentHomework, homeworkData);
        
        // Calculate total score from question details
        const totalCalculatedScore = analysis.questionDetails.reduce((sum, q) => sum + q.question_score, 0);
        const maxPossibleScore = analysis.questionDetails.reduce((sum, q) => sum + q.max_question_score, 0);

        // Prepare updated a_homework object with detailed scoring - maintain original structure
        const updatedHomework = {
            ...currentHomework,
            // Keep original structure intact
            id: currentHomework.id,
            check_type: currentHomework.check_type,
            content: currentHomework.content,
            time_assignment: currentHomework.time_assignment,
            
            // Add comprehensive assessment results
            assessment_results: {
                questions: analysis.questionDetails.map(q => ({
                    id: q.question_id,
                    student_selected_answer: q.student_answer,
                    correct_answer: q.correct_answer,
                    is_correct: q.is_correct,
                    points_earned: q.question_score,
                    max_points: q.max_question_score,
                    difficulty: q.difficulty_level,
                    bloom_taxonomy: q.bloom_level,
                    question_type: q.question_type,
                    student_option_index: q.student_selected_option,
                    correct_option_index: q.correct_option_index
                })),
                summary: {
                    total_score: totalCalculatedScore,
                    maximum_score: maxPossibleScore,
                    percentage: analysis.contentAnalysis.accuracy_percentage,
                    correct_count: analysis.contentAnalysis.correct_answers,
                    incorrect_count: analysis.contentAnalysis.incorrect_answers,
                    questions_total: analysis.contentAnalysis.total_questions
                },
                performance_by_difficulty: {
                    easy: analysis.contentAnalysis.questions_by_difficulty.easy,
                    medium: analysis.contentAnalysis.questions_by_difficulty.medium,
                    hard: analysis.contentAnalysis.questions_by_difficulty.hard
                },
                performance_by_bloom: analysis.contentAnalysis.questions_by_bloom,
                learning_analytics: {
                    subject: analysis.contentAnalysis.subject_mastery.subject,
                    grade_level: analysis.contentAnalysis.subject_mastery.level,
                    mastery_percentage: analysis.contentAnalysis.subject_mastery.mastery_score,
                    strengths: analysis.contentAnalysis.subject_mastery.strengths,
                    improvement_areas: analysis.contentAnalysis.subject_mastery.areas_of_improvement
                },
                processed_at: new Date().toISOString(),
                version: "1.0"
            }
        };

        // Update the actives record with enhanced a_homework
        const { error: updateError } = await supabase
            .from("actives")
            .update({ 
                a_homework: updatedHomework
            })
            .eq("a_id", activeId)
            .eq("a_temail", userData.t_email);

        if (updateError) {
            console.error("Error updating homework with detailed scoring:", updateError);
            return { title: "เกิดข้อผิดพลาดในการอัพเดต", message: updateError.message, type: "error" };
        }

        // Note: History table updates are skipped as it doesn't have score columns
        // All scoring information is now stored in a_homework.assessment_results

        return {
            type: "success",
            message: "อัพเดตรายละเอียดคะแนนเรียบร้อยแล้ว",
            data: {
                total_score: totalCalculatedScore,
                max_score: maxPossibleScore,
                accuracy: analysis.contentAnalysis.accuracy_percentage,
                questions_analyzed: analysis.questionDetails.length
            }
        };

    } catch (error: any) {
        console.log("Error updating homework with detailed scoring:", error.message);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Batch update all homework assignments for quality assessment processing
async function processAllHomeworkForQualityAssessment(classId: number): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();

        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        // Get all completed assignments for this class
        const { data: activesData, error: activesError } = await supabase
            .from("actives")
            .select("*")
            .eq("a_cid", classId)
            .eq("a_temail", userData.t_email)
            .eq("a_status", "done");

        if (activesError) {
            return { title: "เกิดข้อผิดพลาด", message: activesError.message, type: "error" };
        }

        const processResults = {
            total_assignments: activesData?.length || 0,
            processed: 0,
            already_processed: 0,
            errors: 0,
            updated_scores: [] as any[]
        };

        if (!activesData || activesData.length === 0) {
            return {
                type: "success",
                message: "ไม่มีงานที่เสร็จสมบูรณ์ให้ประมวลผล",
                data: processResults
            };
        }

        // Process each assignment
        for (const active of activesData) {
            if (active.a_homework?.assessment_results?.version) {
                processResults.already_processed++;
                continue;
            }

            let homeworkId: number | undefined;
            if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                homeworkId = active.a_homework.id;
            } else if (typeof active.a_homework === 'number') {
                homeworkId = active.a_homework;
            }

            if (!homeworkId) {
                processResults.errors++;
                continue;
            }

            const updateResult = await updateHomeworkWithDetailedScoring(active.a_id, homeworkId);
            
            if (updateResult.type === 'success') {
                processResults.processed++;
                if (updateResult.data) {
                    processResults.updated_scores.push({
                        active_id: active.a_id,
                        student_id: active.a_sid,
                        homework_id: homeworkId,
                        total_score: updateResult.data.total_score,
                        max_score: updateResult.data.max_score,
                        accuracy: updateResult.data.accuracy
                    });
                }
            } else {
                processResults.errors++;
                console.log(`Failed to process active ${active.a_id}:`, updateResult.message);
            }
        }

        return {
            type: "success",
            message: `ประมวลผลเรียบร้อย: ประมวลผลใหม่ ${processResults.processed} งาน, ประมวลผลแล้ว ${processResults.already_processed} งาน, ข้อผิดพลาด ${processResults.errors} งาน`,
            data: processResults
        };

    } catch (error: any) {
        console.log("Error in batch processing:", error.message);
        return { 
            title: "เกิดข้อผิดพลาดในการประมวลผล", 
            message: error.message, 
            type: "error" 
        };
    }
}

export {
    getStudentAssessmentData,
    getStudentDetailedAssessment,
    exportAssessmentData,
    getClassPerformanceAnalysis,
    getStudentProgressTracking,
    analyzeHomeworkContent,
    updateHomeworkWithDetailedScoring,
    processAllHomeworkForQualityAssessment
};