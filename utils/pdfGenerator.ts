'use client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { renderMathForPDF } from './katexRenderer';
import { getCachedFont } from './fontUtils';

interface Question {
    id: number;
    question: string;
    question_type: string;
    options?: string[];
    correct_answer: string;
    correct_option_index?: number;
    explanation: string;
    score: number;
    difficulty: string;
}

interface QuestionsData {
    metadata: {
        total_questions: number;
        total_score: number;
        level: string;
        subject: string;
        type: string;
        bloom_taxonomy: string;
        created_at: string;
    };
    questions: Question[];
}

// Load Thai font for jsPDF
const loadThaiFont = async (doc: jsPDF) => {
    try {
        // Load THSarabunNew fonts
        const regularFont = await getCachedFont('regular');
        const boldFont = await getCachedFont('bold');
        
        // Add fonts to jsPDF
        doc.addFileToVFS('THSarabunNew.ttf', regularFont);
        doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
        
        doc.addFileToVFS('THSarabunNew-Bold.ttf', boldFont);
        doc.addFont('THSarabunNew-Bold.ttf', 'THSarabunNew', 'bold');
        
        // Set default font
        doc.setFont('THSarabunNew', 'normal');
        
        console.log('Thai font loaded successfully');
    } catch (error) {
        console.warn('Thai font loading failed, using default font:', error);
        doc.setFont('Arial', 'normal');
    }
};

// Helper function to process text with line breaks and math
const processTextForPDF = async (text: string): Promise<string> => {
    try {
        // Replace \n\n with actual line breaks
        let processedText = text.replace(/\\n\\n/g, '\n').replace(/\n\n/g, '\n');
        
        // Process math expressions with KaTeX
        const mathProcessed = renderMathForPDF(processedText);
        
        // Strip HTML tags but preserve basic formatting
        let plainText = mathProcessed.replace(/<br\s*\/?>/gi, '\n');
        plainText = plainText.replace(/<\/p>/gi, '\n');
        plainText = plainText.replace(/<p[^>]*>/gi, '');
        plainText = plainText.replace(/<[^>]*>/g, '');
        
        // Decode HTML entities
        const htmlEntities: { [key: string]: string } = {
            '&lt;': '<',
            '&gt;': '>',
            '&amp;': '&',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' ',
            '&times;': '×',
            '&divide;': '÷',
            '&plusmn;': '±',
            '&le;': '≤',
            '&ge;': '≥',
            '&ne;': '≠',
            '&infin;': '∞',
            '&sum;': 'Σ',
            '&int;': '∫',
            '&pi;': 'π',
            '&alpha;': 'α',
            '&beta;': 'β',
            '&gamma;': 'γ',
            '&theta;': 'θ',
            '&lambda;': 'λ',
            '&mu;': 'μ',
            '&sigma;': 'σ',
            '&phi;': 'φ',
            '&omega;': 'ω'
        };
        
        Object.keys(htmlEntities).forEach(entity => {
            const regex = new RegExp(entity, 'g');
            plainText = plainText.replace(regex, htmlEntities[entity]);
        });
        
        return plainText;
    } catch (error) {
        console.error('Error processing text for PDF:', error);
        return text;
    }
};

// Helper function to split text into lines
const splitTextToLines = async (doc: jsPDF, text: string, maxWidth: number): Promise<string[]> => {
    const processedText = await processTextForPDF(text);
    const lines = doc.splitTextToSize(processedText, maxWidth);
    return Array.isArray(lines) ? lines : [lines];
};

// Helper function to add HTML content to PDF
const addHTMLContent = async (doc: jsPDF, htmlContent: string, x: number, y: number, maxWidth: number): Promise<number> => {
    // For now, strip HTML and add as plain text
    // In production, you might want to use html2canvas or similar
    const plainText = htmlContent.replace(/<[^>]*>/g, '').replace(/\n+/g, '\n');
    const lines = await splitTextToLines(doc, plainText, maxWidth);
    
    lines.forEach((line: string, index: number) => {
        doc.text(line, x, y + (index * 6));
    });
    
    return y + (lines.length * 6);
};

export const generatePDF = async (data: QuestionsData, includeAnswers: boolean = false): Promise<void> => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        await loadThaiFont(doc);

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let currentY = margin;

        // Title
        doc.setFontSize(20);
        doc.setFont('THSarabunNew', 'bold');
        const title = `ชุดฝึกคณิตศาสตร์`;
        doc.text(title, pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        // Metadata
        doc.setFontSize(12);
        doc.setFont('THSarabunNew', 'normal');
        const metadata = [
            `วิชา: ${data.metadata.subject}`,
            `ระดับ: ${data.metadata.level}`,
            `ประเภท: ${data.metadata.type}`,
            `จำนวนข้อ: ${data.metadata.total_questions} ข้อ`,
            `คะแนนเต็ม: ${data.metadata.total_score} คะแนน`,
            `วันที่สร้าง: ${new Date(data.metadata.created_at).toLocaleDateString('th-TH')}`
        ];

        metadata.forEach(line => {
            doc.text(line, margin, currentY);
            currentY += 6;
        });

        currentY += 10;

        // Instructions
        doc.setFontSize(10);
        doc.text('คำแนะนำ: กรุณาเลือกคำตอบที่ถูกต้องที่สุด', margin, currentY);
        currentY += 10;

        // Draw line
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;

        // Questions
        doc.setFontSize(12);
        
        for (let index = 0; index < data.questions.length; index++) {
            const question = data.questions[index];
            
            // Check if we need a new page
            if (currentY > pageHeight - 50) {
                doc.addPage();
                currentY = margin;
            }

            // Question number and score
            doc.setFont('THSarabunNew', 'bold');
            const questionHeader = `ข้อที่ ${index + 1} (${question.score} คะแนน)`;
            doc.text(questionHeader, margin, currentY);
            currentY += 8;

            // Question text
            doc.setFont('THSarabunNew', 'normal');
            const questionLines = await splitTextToLines(doc, question.question, contentWidth);
            questionLines.forEach((line: string) => {
                if (currentY > pageHeight - 20) {
                    doc.addPage();
                    currentY = margin;
                }
                doc.text(line, margin, currentY);
                currentY += 6;
            });
            currentY += 4;

            // Options
            if (question.options && question.options.length > 0) {
                for (let optIndex = 0; optIndex < question.options.length; optIndex++) {
                    const option = question.options[optIndex];
                    if (currentY > pageHeight - 20) {
                        doc.addPage();
                        currentY = margin;
                    }
                    
                    const optionText = `${String.fromCharCode(97 + optIndex)}. ${option}`;
                    const optionLines = await splitTextToLines(doc, optionText, contentWidth - 10);
                    
                    optionLines.forEach((line: string, lineIndex: number) => {
                        const prefix = lineIndex === 0 ? '' : '   ';
                        doc.text(prefix + line, margin + 5, currentY);
                        currentY += 6;
                    });
                }
            } else {
                // For open-ended questions, add space for answers
                doc.setFontSize(10);
                doc.text('คำตอบ: ________________________________', margin + 5, currentY);
                currentY += 8;
                doc.text('_________________________________________', margin + 5, currentY);
                currentY += 8;
                doc.text('_________________________________________', margin + 5, currentY);
                currentY += 8;
                doc.setFontSize(12);
            }

            currentY += 5;

            // Answer and explanation (if included)
            if (includeAnswers) {
                if (currentY > pageHeight - 30) {
                    doc.addPage();
                    currentY = margin;
                }

                doc.setFont('THSarabunNew', 'bold');
                doc.text('คำตอบ:', margin, currentY);
                currentY += 6;
                
                doc.setFont('THSarabunNew', 'normal');
                const answerLines = await splitTextToLines(doc, question.correct_answer, contentWidth - 10);
                answerLines.forEach((line: string) => {
                    if (currentY > pageHeight - 20) {
                        doc.addPage();
                        currentY = margin;
                    }
                    doc.text(line, margin + 5, currentY);
                    currentY += 6;
                });
                
                currentY += 4;
                
                doc.setFont('THSarabunNew', 'bold');
                doc.text('วิธีทำ:', margin, currentY);
                currentY += 6;
                
                doc.setFont('THSarabunNew', 'normal');
                const explanationLines = await splitTextToLines(doc, question.explanation, contentWidth - 10);
                explanationLines.forEach((line: string) => {
                    if (currentY > pageHeight - 20) {
                        doc.addPage();
                        currentY = margin;
                    }
                    doc.text(line, margin + 5, currentY);
                    currentY += 6;
                });
                
                currentY += 10;
            } else {
                currentY += 15; // Space for answer
            }

            // Draw separator line
            if (index < data.questions.length - 1) {
                if (currentY > pageHeight - 20) {
                    doc.addPage();
                    currentY = margin;
                }
                doc.line(margin, currentY, pageWidth - margin, currentY);
                currentY += 10;
            }
        }

        // Add footer with page numbers
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('THSarabunNew', 'normal');
            doc.text(`หน้า ${i} จาก ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        // Save the PDF
        const filename = `${data.metadata.subject}_${includeAnswers ? 'with_answers' : 'questions_only'}_${Date.now()}.pdf`;
        doc.save(filename);

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('ไม่สามารถสร้างไฟล์ PDF ได้');
    }
};

export const downloadPDF = async (data: QuestionsData, includeAnswers: boolean = false): Promise<void> => {
    try {
        await generatePDF(data, includeAnswers);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF');
    }
};
