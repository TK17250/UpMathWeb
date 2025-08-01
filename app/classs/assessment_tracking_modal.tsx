'use client';
import { useState, useEffect } from 'react';
import { getStudentAssessmentData, exportAssessmentData, getClassPerformanceAnalysis, processAllHomeworkForQualityAssessment } from '@/app/action/assessment';

interface AssessmentTrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: number;
    className: string;
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
    formative_scores: Array<{
        homework_id: number;
        homework_name: string;
        score: number;
        max_score: number;
        completion_date: string;
        type: 'homework' | 'quiz' | 'activity';
        question_details?: QuestionDetail[];
        content_analysis?: ContentAnalysis;
    }>;
    summative_scores: Array<{
        exam_id: number;
        exam_name: string;
        score: number;
        max_score: number;
        completion_date: string;
        type: 'midterm' | 'final' | 'major_test';
        question_details?: QuestionDetail[];
        content_analysis?: ContentAnalysis;
    }>;
    overall_performance: {
        formative_average: number;
        summative_average: number;
        total_assignments: number;
        completed_assignments: number;
        completion_rate: number;
    };
}

export default function AssessmentTrackingModal({ isOpen, onClose, classId, className }: AssessmentTrackingModalProps) {
    const [studentsData, setStudentsData] = useState<StudentAssessment[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedView, setSelectedView] = useState<'overview' | 'formative' | 'summative' | 'detailed'>('overview');
    const [selectedStudent, setSelectedStudent] = useState<StudentAssessment | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [classAnalysis, setClassAnalysis] = useState<any>(null);
    const [isProcessingQuality, setIsProcessingQuality] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<string>('');

    useEffect(() => {
        if (isOpen && classId) {
            fetchAssessmentData();
        }
    }, [isOpen, classId]);

    const fetchAssessmentData = async () => {
        setLoading(true);
        setProcessingStatus('กำลังโหลดข้อมูลการประเมิน...');
        
        try {
            // First, process all homework for quality assessment
            setIsProcessingQuality(true);
            setProcessingStatus('กำลังประมวลผลรายละเอียดคะแนน...');
            
            const processingResult = await processAllHomeworkForQualityAssessment(classId);
            
            if (processingResult.type === 'success') {
                setProcessingStatus(`ประมวลผลเสร็จสิ้น: ${processingResult.message}`);
                console.log('Quality processing completed:', processingResult.data);
            } else {
                setProcessingStatus('เกิดข้อผิดพลาดในการประมวลผล');
                console.error('Quality processing failed:', processingResult.message);
            }
            
            setIsProcessingQuality(false);
            
            // Then fetch assessment data and analysis
            setProcessingStatus('กำลังโหลดข้อมูลการวิเคราะห์...');
            
            const [assessmentResult, analysisResult] = await Promise.all([
                getStudentAssessmentData(classId),
                getClassPerformanceAnalysis(classId)
            ]);
            
            if (assessmentResult.type === 'success') {
                setStudentsData(assessmentResult.data);
                setProcessingStatus('โหลดข้อมูลนักเรียนเรียบร้อยแล้ว');
            } else {
                console.error('Error fetching assessment data:', assessmentResult.message);
                setProcessingStatus('เกิดข้อผิดพลาดในการโหลดข้อมูลนักเรียน');
            }
            
            if (analysisResult.type === 'success') {
                setClassAnalysis(analysisResult.data);
                setProcessingStatus('โหลดข้อมูลการวิเคราะห์เรียบร้อยแล้ว');
            } else {
                console.error('Error fetching class analysis:', analysisResult.message);
                setProcessingStatus('เกิดข้อผิดพลาดในการโหลดข้อมูลการวิเคราะห์');
            }
            
            // Clear status after successful load
            setTimeout(() => setProcessingStatus(''), 2000);
            
        } catch (error) {
            console.error('Error fetching assessment data:', error);
            setProcessingStatus('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
            setIsProcessingQuality(false);
        }
    };

    const getPerformanceColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-400';
        if (percentage >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getPerformanceBadge = (percentage: number) => {
        if (percentage >= 80) return { text: 'ดีเยี่ยม', bg: 'bg-green-500/20', text_color: 'text-green-400' };
        if (percentage >= 60) return { text: 'ปานกลาง', bg: 'bg-yellow-500/20', text_color: 'text-yellow-400' };
        return { text: 'ต้องปรับปรุง', bg: 'bg-red-500/20', text_color: 'text-red-400' };
    };

    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const result = await exportAssessmentData(classId, 'csv');
            if (result.type === 'success') {
                // Create download link
                const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', result.filename || `assessment_report_${classId}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error('Export failed:', result.message);
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#203D4F] rounded-lg w-11/12 max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[#2D4A5B]">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">ติดตามผลประเมินนักเรียน</h2>
                            <p className="text-white/70 mt-1">ห้องเรียน: {className}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleExportCSV}
                                disabled={isExporting || studentsData.length === 0}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {isExporting ? 'กำลังส่งออก...' : 'ส่งออก CSV'}
                            </button>
                            <button
                                onClick={() => fetchAssessmentData()}
                                disabled={loading || isProcessingQuality}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {isProcessingQuality ? 'กำลังประมวลผล...' : 'ประมวลผลใหม่'}
                            </button>
                            <button
                                onClick={onClose}
                                className="text-white/60 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    
                    {/* View Selector */}
                    <div className="flex mt-4 bg-[#2D4A5B] rounded-lg p-1">
                        <button
                            onClick={() => setSelectedView('overview')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedView === 'overview' 
                                    ? 'bg-[#80ED99] text-black' 
                                    : 'text-white hover:text-[#80ED99]'
                            }`}
                        >
                            ภาพรวม
                        </button>
                        <button
                            onClick={() => setSelectedView('formative')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedView === 'formative' 
                                    ? 'bg-[#80ED99] text-black' 
                                    : 'text-white hover:text-[#80ED99]'
                            }`}
                        >
                            การประเมินระหว่างเรียน (Formative)
                        </button>
                        <button
                            onClick={() => setSelectedView('summative')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedView === 'summative' 
                                    ? 'bg-[#80ED99] text-black' 
                                    : 'text-white hover:text-[#80ED99]'
                            }`}
                        >
                            การประเมินผลรวม (Summative)
                        </button>
                        <button
                            onClick={() => setSelectedView('detailed')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedView === 'detailed' 
                                    ? 'bg-[#80ED99] text-black' 
                                    : 'text-white hover:text-[#80ED99]'
                            }`}
                        >
                            การวิเคราะห์รายละเอียด
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#80ED99]"></div>
                            {processingStatus && (
                                <div className="text-center">
                                    <p className="text-white text-sm">{processingStatus}</p>
                                    {isProcessingQuality && (
                                        <div className="mt-2">
                                            <div className="text-[#80ED99] text-xs">
                                                กำลังอัพเดตรายละเอียดคะแนนในฐานข้อมูล...
                                            </div>
                                            <div className="w-48 bg-gray-700 rounded-full h-1 mt-2">
                                                <div className="bg-[#80ED99] h-1 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {selectedView === 'overview' && (
                                <div className="space-y-6">
                                    {/* Class Summary Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-[#2D4A5B] p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-[#80ED99]">{studentsData.length}</div>
                                            <div className="text-sm text-white/80">นักเรียนทั้งหมด</div>
                                        </div>
                                        <div className="bg-[#2D4A5B] p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-400">
                                                {studentsData.reduce((sum, student) => sum + student.formative_scores.length, 0)}
                                            </div>
                                            <div className="text-sm text-white/80">การประเมินระหว่างเรียน</div>
                                        </div>
                                        <div className="bg-[#2D4A5B] p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-400">
                                                {studentsData.reduce((sum, student) => sum + student.summative_scores.length, 0)}
                                            </div>
                                            <div className="text-sm text-white/80">การประเมินผลรวม</div>
                                        </div>
                                        <div className="bg-[#2D4A5B] p-4 rounded-lg">
                                            <div className="text-2xl font-bold text-yellow-400">
                                                {studentsData.length > 0 
                                                    ? Math.round(studentsData.reduce((sum, student) => sum + student.overall_performance.completion_rate, 0) / studentsData.length) 
                                                    : 0}%
                                            </div>
                                            <div className="text-sm text-white/80">อัตราการส่งงานเฉลี่ย</div>
                                        </div>
                                    </div>

                                    {/* Students Overview Table */}
                                    <div className="bg-[#2D4A5B] rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-[#1a3240]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-white font-semibold">นักเรียน</th>
                                                    <th className="px-4 py-3 text-center text-white font-semibold">Formative เฉลี่ย</th>
                                                    <th className="px-4 py-3 text-center text-white font-semibold">Summative เฉลี่ย</th>
                                                    <th className="px-4 py-3 text-center text-white font-semibold">อัตราการส่งงาน</th>
                                                    <th className="px-4 py-3 text-center text-white font-semibold">สถานะ</th>
                                                    <th className="px-4 py-3 text-center text-white font-semibold">การดำเนินการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentsData.map((student, index) => {
                                                    const performance = getPerformanceBadge(
                                                        (student.overall_performance.formative_average + student.overall_performance.summative_average) / 2
                                                    );
                                                    return (
                                                        <tr key={student.s_id} className={`border-b border-[#203D4F] ${index % 2 === 0 ? 'bg-[#2D4A5B]' : 'bg-[#203D4F]'}`}>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-8 h-8 bg-[#80ED99] rounded-full flex items-center justify-center text-black font-bold text-sm">
                                                                        {student.s_fullname?.charAt(0)?.toUpperCase() || student.s_username?.charAt(0)?.toUpperCase() || 'N'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-white font-medium">
                                                                            {student.s_fullname || student.s_username || 'ไม่มีชื่อ'}
                                                                        </div>
                                                                        <div className="text-white/60 text-xs">
                                                                            {student.s_email}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`font-bold ${getPerformanceColor(student.overall_performance.formative_average)}`}>
                                                                    {student.overall_performance.formative_average.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`font-bold ${getPerformanceColor(student.overall_performance.summative_average)}`}>
                                                                    {student.overall_performance.summative_average.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className="text-white">
                                                                    {student.overall_performance.completed_assignments}/{student.overall_performance.total_assignments}
                                                                </span>
                                                                <div className="text-xs text-white/60">
                                                                    ({student.overall_performance.completion_rate.toFixed(0)}%)
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${performance.bg} ${performance.text_color}`}>
                                                                    {performance.text}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    onClick={() => setSelectedStudent(student)}
                                                                    className="px-3 py-1 bg-[#80ED99] text-black rounded-md text-xs font-medium hover:bg-[#80ED99]/80 transition-colors"
                                                                >
                                                                    ดูรายละเอียด
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {selectedView === 'formative' && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white">การประเมินระหว่างเรียน (Formative Assessment)</h3>
                                    <p className="text-white/70 text-sm">ติดตามการส่งงาน แบบฝึกหัด และกิจกรรมระหว่างเรียนของนักเรียน</p>
                                    
                                    {studentsData.map(student => (
                                        <div key={student.s_id} className="bg-[#2D4A5B] rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-white font-bold">
                                                    {student.s_fullname || student.s_username}
                                                </h4>
                                                <span className={`font-bold ${getPerformanceColor(student.overall_performance.formative_average)}`}>
                                                    เฉลี่ย: {student.overall_performance.formative_average.toFixed(1)}%
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {student.formative_scores.map(score => (
                                                    <div key={`${score.homework_id}-${student.s_id}`} className="bg-[#1a3240] p-3 rounded-lg">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h5 className="text-white font-medium text-sm line-clamp-2">
                                                                {score.homework_name}
                                                            </h5>
                                                            <span className={`text-xs px-2 py-1 rounded ${
                                                                score.type === 'homework' ? 'bg-blue-500/20 text-blue-400' :
                                                                score.type === 'quiz' ? 'bg-green-500/20 text-green-400' :
                                                                'bg-purple-500/20 text-purple-400'
                                                            }`}>
                                                                {score.type === 'homework' ? 'การบ้าน' :
                                                                 score.type === 'quiz' ? 'แบบทดสอบ' : 'กิจกรรม'}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center">
                                                            <span className={`font-bold ${getPerformanceColor((score.score / score.max_score) * 100)}`}>
                                                                {score.score}/{score.max_score}
                                                            </span>
                                                            <span className="text-white/60 text-xs">
                                                                {new Date(score.completion_date).toLocaleDateString('th-TH')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {student.formative_scores.length === 0 && (
                                                <p className="text-white/60 text-center py-4">ยังไม่มีการประเมินระหว่างเรียน</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedView === 'summative' && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white">การประเมินผลรวม (Summative Assessment)</h3>
                                    <p className="text-white/70 text-sm">ติดตามผลการสอบและการประเมินผลสิ้นสุดของนักเรียน</p>
                                    
                                    {studentsData.map(student => (
                                        <div key={student.s_id} className="bg-[#2D4A5B] rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-white font-bold">
                                                    {student.s_fullname || student.s_username}
                                                </h4>
                                                <span className={`font-bold ${getPerformanceColor(student.overall_performance.summative_average)}`}>
                                                    เฉลี่ย: {student.overall_performance.summative_average.toFixed(1)}%
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {student.summative_scores.map(score => (
                                                    <div key={`${score.exam_id}-${student.s_id}`} className="bg-[#1a3240] p-3 rounded-lg">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h5 className="text-white font-medium text-sm line-clamp-2">
                                                                {score.exam_name}
                                                            </h5>
                                                            <span className={`text-xs px-2 py-1 rounded ${
                                                                score.type === 'midterm' ? 'bg-orange-500/20 text-orange-400' :
                                                                score.type === 'final' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-yellow-500/20 text-yellow-400'
                                                            }`}>
                                                                {score.type === 'midterm' ? 'กลางภาค' :
                                                                 score.type === 'final' ? 'ปลายภาค' : 'สอบใหญ่'}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center">
                                                            <span className={`font-bold ${getPerformanceColor((score.score / score.max_score) * 100)}`}>
                                                                {score.score}/{score.max_score}
                                                            </span>
                                                            <span className="text-white/60 text-xs">
                                                                {new Date(score.completion_date).toLocaleDateString('th-TH')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {student.summative_scores.length === 0 && (
                                                <p className="text-white/60 text-center py-4">ยังไม่มีการประเมินผลรวม</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedView === 'detailed' && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-white">การวิเคราะห์รายละเอียด</h3>
                                    <p className="text-white/70 text-sm">การวิเคราะห์เชิงลึกของการเรียนรู้และทักษะของนักเรียน</p>
                                    
                                    {/* Class Performance Overview */}
                                    {classAnalysis && (
                                        <div className="bg-[#2D4A5B] rounded-lg p-6">
                                            <h4 className="text-white font-bold text-lg mb-4">ภาพรวมการประเมินผลห้องเรียน</h4>
                                            
                                            {/* Bloom Taxonomy Performance */}
                                            <div className="mb-6">
                                                <h5 className="text-[#80ED99] font-semibold mb-3">การประเมินตาม Bloom's Taxonomy</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {Object.entries(classAnalysis.class_bloom_performance || {}).map(([skill, stats]: [string, any]) => (
                                                        <div key={skill} className="bg-[#1a3240] p-4 rounded-lg">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-white font-medium text-sm">ทักษะ{skill}</span>
                                                                <span className={`font-bold text-sm ${getPerformanceColor(stats.percentage)}`}>
                                                                    {stats.percentage.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <div className="text-white/60 text-xs">
                                                                ถูกต้อง: {stats.correct}/{stats.total} ข้อ
                                                            </div>
                                                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                                                <div 
                                                                    className={`h-2 rounded-full ${
                                                                        stats.percentage >= 80 ? 'bg-green-500' :
                                                                        stats.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Difficulty Level Performance */}
                                            <div className="mb-6">
                                                <h5 className="text-[#80ED99] font-semibold mb-3">การประเมินตามระดับความยาก</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {Object.entries(classAnalysis.class_difficulty_performance || {}).map(([level, stats]: [string, any]) => (
                                                        <div key={level} className="bg-[#1a3240] p-4 rounded-lg">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-white font-medium">
                                                                    {level === 'easy' ? 'ง่าย' : level === 'medium' ? 'ปานกลาง' : 'ยาก'}
                                                                </span>
                                                                <span className={`font-bold ${getPerformanceColor(stats.percentage)}`}>
                                                                    {stats.percentage.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <div className="text-white/60 text-xs">
                                                                ถูกต้อง: {stats.correct}/{stats.total} ข้อ
                                                            </div>
                                                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                                                <div 
                                                                    className={`h-2 rounded-full ${
                                                                        stats.percentage >= 80 ? 'bg-green-500' :
                                                                        stats.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Subject Mastery Overview */}
                                            <div>
                                                <h5 className="text-[#80ED99] font-semibold mb-3">การเรียนรู้ตามหัวข้อ</h5>
                                                <div className="space-y-3">
                                                    {classAnalysis.subject_mastery_overview?.map((subject: any, index: number) => (
                                                        <div key={index} className="bg-[#1a3240] p-4 rounded-lg">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-white font-medium">{subject.subject}</span>
                                                                <span className={`font-bold ${getPerformanceColor(subject.average_mastery)}`}>
                                                                    เฉลี่ย: {subject.average_mastery.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-4 text-xs text-white/60">
                                                                <div className="text-center">
                                                                    <div className="text-green-400 font-bold">{subject.mastery_distribution.excellent}</div>
                                                                    <div>ดีเยี่ยม (≥80%)</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="text-yellow-400 font-bold">{subject.mastery_distribution.good}</div>
                                                                    <div>ดี (60-79%)</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="text-red-400 font-bold">{subject.mastery_distribution.needs_improvement}</div>
                                                                    <div>ต้องปรับปรุง (&lt;60%)</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Individual Student Detailed Analysis */}
                                    <div className="space-y-4">
                                        <h4 className="text-white font-bold text-lg">การวิเคราะห์รายบุคคล</h4>
                                        {studentsData.map(student => (
                                            <div key={student.s_id} className="bg-[#2D4A5B] rounded-lg p-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h5 className="text-white font-bold">
                                                        {student.s_fullname || student.s_username}
                                                    </h5>
                                                    <button
                                                        onClick={() => setSelectedStudent(student)}
                                                        className="px-3 py-1 bg-[#80ED99] text-black rounded-md text-xs font-medium hover:bg-[#80ED99]/80 transition-colors"
                                                    >
                                                        ดูรายละเอียดเต็ม
                                                    </button>
                                                </div>
                                                
                                                {/* Student's assignment details with content analysis */}
                                                <div className="space-y-3">
                                                    {student.formative_scores.filter(score => score.content_analysis).map(score => (
                                                        <div key={score.homework_id} className="bg-[#1a3240] p-3 rounded-lg">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-white font-medium text-sm">{score.homework_name}</span>
                                                                <button
                                                                    onClick={() => setSelectedAssignment({...score, student})}
                                                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                                                >
                                                                    วิเคราะห์
                                                                </button>
                                                            </div>
                                                            {score.content_analysis && (
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                                    <div className="text-center">
                                                                        <div className="text-[#80ED99] font-bold">{score.content_analysis.accuracy_percentage.toFixed(1)}%</div>
                                                                        <div className="text-white/60">ความถูกต้อง</div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-blue-400 font-bold">{score.content_analysis.correct_answers}</div>
                                                                        <div className="text-white/60">ตอบถูก</div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-red-400 font-bold">{score.content_analysis.incorrect_answers}</div>
                                                                        <div className="text-white/60">ตอบผิด</div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="text-yellow-400 font-bold">{score.content_analysis.subject_mastery.mastery_score.toFixed(1)}%</div>
                                                                        <div className="text-white/60">การเรียนรู้</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Student Detail Modal */}
                {selectedStudent && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
                        <div className="bg-[#203D4F] rounded-lg w-11/12 max-w-4xl max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-[#2D4A5B]">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">
                                        รายละเอียดการประเมิน - {selectedStudent.s_fullname || selectedStudent.s_username}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        className="text-white/60 hover:text-white text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Formative Assessments */}
                                    <div className="bg-[#2D4A5B] rounded-lg p-4">
                                        <h4 className="text-white font-bold mb-3">การประเมินระหว่างเรียน</h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedStudent.formative_scores.map(score => (
                                                <div key={score.homework_id} className="bg-[#1a3240] p-3 rounded">
                                                    <div className="flex justify-between">
                                                        <span className="text-white text-sm">{score.homework_name}</span>
                                                        <span className={`font-bold ${getPerformanceColor((score.score / score.max_score) * 100)}`}>
                                                            {score.score}/{score.max_score}
                                                        </span>
                                                    </div>
                                                    <div className="text-white/60 text-xs mt-1">
                                                        {new Date(score.completion_date).toLocaleDateString('th-TH')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summative Assessments */}
                                    <div className="bg-[#2D4A5B] rounded-lg p-4">
                                        <h4 className="text-white font-bold mb-3">การประเมินผลรวม</h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedStudent.summative_scores.map(score => (
                                                <div key={score.exam_id} className="bg-[#1a3240] p-3 rounded">
                                                    <div className="flex justify-between">
                                                        <span className="text-white text-sm">{score.exam_name}</span>
                                                        <span className={`font-bold ${getPerformanceColor((score.score / score.max_score) * 100)}`}>
                                                            {score.score}/{score.max_score}
                                                        </span>
                                                    </div>
                                                    <div className="text-white/60 text-xs mt-1">
                                                        {new Date(score.completion_date).toLocaleDateString('th-TH')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assignment Detail Analysis Modal */}
                {selectedAssignment && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
                        <div className="bg-[#203D4F] rounded-lg w-11/12 max-w-5xl max-h-[90vh] overflow-hidden">
                            <div className="p-6 border-b border-[#2D4A5B]">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">
                                        การวิเคราะห์งาน: {selectedAssignment.homework_name}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedAssignment(null)}
                                        className="text-white/60 hover:text-white text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                                <p className="text-white/70 text-sm mt-1">
                                    นักเรียน: {selectedAssignment.student.s_fullname || selectedAssignment.student.s_username}
                                </p>
                            </div>
                            
                            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                                {selectedAssignment.content_analysis && (
                                    <div className="space-y-6">
                                        {/* Overall Performance */}
                                        <div className="bg-[#2D4A5B] rounded-lg p-4">
                                            <h4 className="text-white font-bold mb-3">ผลการประเมินโดยรวม</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-[#80ED99]">
                                                        {selectedAssignment.content_analysis.accuracy_percentage.toFixed(1)}%
                                                    </div>
                                                    <div className="text-white/70 text-sm">ความถูกต้อง</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-400">
                                                        {selectedAssignment.content_analysis.correct_answers}
                                                    </div>
                                                    <div className="text-white/70 text-sm">ตอบถูก</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-red-400">
                                                        {selectedAssignment.content_analysis.incorrect_answers}
                                                    </div>
                                                    <div className="text-white/70 text-sm">ตอบผิด</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-yellow-400">
                                                        {selectedAssignment.content_analysis.subject_mastery.mastery_score.toFixed(1)}%
                                                    </div>
                                                    <div className="text-white/70 text-sm">การเรียนรู้</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Strengths and Areas for Improvement */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[#2D4A5B] rounded-lg p-4">
                                                <h4 className="text-green-400 font-bold mb-3">จุดแข็ง</h4>
                                                <div className="space-y-2">
                                                    {selectedAssignment.content_analysis.subject_mastery.strengths.map((strength: string, index: number) => (
                                                        <div key={index} className="flex items-center text-white text-sm">
                                                            <span className="text-green-400 mr-2">✓</span>
                                                            {strength}
                                                        </div>
                                                    ))}
                                                    {selectedAssignment.content_analysis.subject_mastery.strengths.length === 0 && (
                                                        <div className="text-white/60 text-sm">ยังไม่พบจุดแข็งที่เด่นชัด</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="bg-[#2D4A5B] rounded-lg p-4">
                                                <h4 className="text-orange-400 font-bold mb-3">ควรปรับปรุง</h4>
                                                <div className="space-y-2">
                                                    {selectedAssignment.content_analysis.subject_mastery.areas_of_improvement.map((area: string, index: number) => (
                                                        <div key={index} className="flex items-center text-white text-sm">
                                                            <span className="text-orange-400 mr-2">!</span>
                                                            {area}
                                                        </div>
                                                    ))}
                                                    {selectedAssignment.content_analysis.subject_mastery.areas_of_improvement.length === 0 && (
                                                        <div className="text-white/60 text-sm">ไม่พบจุดที่ต้องปรับปรุงอย่างเร่งด่วน</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Question Details Table */}
                                        {selectedAssignment.question_details && selectedAssignment.question_details.length > 0 && (
                                            <div className="bg-[#2D4A5B] rounded-lg p-4">
                                                <h4 className="text-white font-bold mb-3">รายละเอียดแต่ละข้อ</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-[#1a3240]">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-white font-semibold">ข้อที่</th>
                                                                <th className="px-3 py-2 text-left text-white font-semibold">คำตอบนักเรียน</th>
                                                                <th className="px-3 py-2 text-left text-white font-semibold">คำตอบที่ถูก</th>
                                                                <th className="px-3 py-2 text-center text-white font-semibold">ผล</th>
                                                                <th className="px-3 py-2 text-center text-white font-semibold">คะแนน</th>
                                                                <th className="px-3 py-2 text-center text-white font-semibold">ความยาก</th>
                                                                <th className="px-3 py-2 text-center text-white font-semibold">Bloom</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedAssignment.question_details.map((question: QuestionDetail, index: number) => (
                                                                <tr key={question.question_id} className={`border-b border-[#203D4F] ${index % 2 === 0 ? 'bg-[#2D4A5B]' : 'bg-[#203D4F]'}`}>
                                                                    <td className="px-3 py-2 text-white">{question.question_id}</td>
                                                                    <td className="px-3 py-2 text-white max-w-32 truncate" title={question.student_answer}>
                                                                        {question.student_answer}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-white max-w-32 truncate" title={question.correct_answer}>
                                                                        {question.correct_answer}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        {question.is_correct ? (
                                                                            <span className="text-green-400 font-bold">✓</span>
                                                                        ) : (
                                                                            <span className="text-red-400 font-bold">✗</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-white">
                                                                        {question.question_score}/{question.max_question_score}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center">
                                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                                            question.difficulty_level === 'easy' ? 'bg-green-500/20 text-green-400' :
                                                                            question.difficulty_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                            'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                            {question.difficulty_level === 'easy' ? 'ง่าย' :
                                                                             question.difficulty_level === 'medium' ? 'ปานกลาง' : 'ยาก'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-white text-xs">
                                                                        {question.bloom_level}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}