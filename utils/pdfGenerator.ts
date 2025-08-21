'use client';
import jsPDF from 'jspdf';
import { getCachedFont } from './fontUtils';

interface Question {
    id: number;
    question: string;
    question_type: string;
    options?: string[];
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

// Load Thai font
const loadThaiFont = async (doc: jsPDF) => {
    try {
        const regularFont = await getCachedFont('regular');
        const boldFont = await getCachedFont('bold');

        doc.addFileToVFS('THSarabunNew.ttf', regularFont);
        doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');

        doc.addFileToVFS('THSarabunNew-Bold.ttf', boldFont);
        doc.addFont('THSarabunNew-Bold.ttf', 'THSarabunNew', 'bold');

        doc.setFont('THSarabunNew', 'normal');
    } catch {
        doc.setFont('Arial', 'normal');
    }
};

// ========== IMPROVED FRACTION DRAWER ==========
const drawFraction = (
    doc: jsPDF,
    numerator: string,
    denominator: string,
    x: number,
    y: number,
    fontSize: number = 12
) => {
    const originalFontSize = fontSize;
    const fracFontSize = Math.max(8, fontSize - 2); // Slightly smaller font for fractions
    
    doc.setFontSize(fracFontSize);

    const numWidth = doc.getTextWidth(numerator);
    const denWidth = doc.getTextWidth(denominator);
    const fracWidth = Math.max(numWidth, denWidth) + 4; // Add padding
    const lineLength = fracWidth - 2;

    const numX = x + (fracWidth - numWidth) / 2;
    const denX = x + (fracWidth - denWidth) / 2;

    // Draw numerator above the line
    doc.text(numerator, numX, y - 4);
    
    // Draw fraction line (slightly thicker and better positioned)
    doc.setLineWidth(0.8);
    doc.line(x + 1, y, x + lineLength + 1, y);
    
    // Draw denominator below the line
    doc.text(denominator, denX, y + fracFontSize * 0.7 + 2);

    // Reset font size
    doc.setFontSize(originalFontSize);

    return fracWidth + 3; // Return width including spacing
};

// ========== IMPROVED LATEX PARSER ==========
const convertMathToUnicode = (mathText: string): string => {
    let result = mathText.trim();

    // Handle \text{} commands
    result = result.replace(/\\text\{([^}]*)\}/g, '$1');

    // Handle fractions - keep as placeholders for special rendering
    result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '__FRAC_$1_$2__');

    // Handle square roots
    result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
    result = result.replace(/\\sqrt/g, '√');

    // Handle superscripts (improved to handle more cases)
    result = result.replace(/\^(\{[^}]+\}|[a-zA-Z0-9+\-()]+)/g, (_, exp) => {
        const cleanExp = exp.replace(/[{}]/g, '');
        const superscripts: Record<string, string> = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
            '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
            'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
            'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
            'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
            'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
            'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
        };
        return cleanExp.split('').map((c: string) => superscripts[c] || c).join('');
    });

    // Handle subscripts (improved)
    result = result.replace(/_(\{[^}]+\}|[a-zA-Z0-9+\-()]+)/g, (_, sub) => {
        const cleanSub = sub.replace(/[{}]/g, '');
        const subscripts: Record<string, string> = {
            '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
            '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
            '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
            'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
            'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
            'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
            'v': 'ᵥ', 'x': 'ₓ'
        };
        return cleanSub.split('').map((c: string) => subscripts[c] || c).join('');
    });

    // Mathematical symbols
    const mathSymbols: Record<string, string> = {
        '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
        '\\leq': '≤', '\\le': '≤', '\\geq': '≥', '\\ge': '≥',
        '\\neq': '≠', '\\ne': '≠', '\\approx': '≈', '\\equiv': '≡',
        '\\infty': '∞', '\\sum': 'Σ', '\\prod': 'Π', '\\int': '∫',
        '\\pi': 'π', '\\theta': 'θ', '\\alpha': 'α', '\\beta': 'β',
        '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε', '\\lambda': 'λ',
        '\\mu': 'μ', '\\sigma': 'σ', '\\phi': 'φ', '\\omega': 'ω',
        '\\leftarrow': '←', '\\rightarrow': '→', '\\leftrightarrow': '↔',
        '\\Leftarrow': '⇐', '\\Rightarrow': '⇒', '\\Leftrightarrow': '⇔'
    };

    Object.entries(mathSymbols).forEach(([latex, unicode]) => {
        result = result.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), unicode);
    });

    // Clean up remaining LaTeX commands and brackets
    result = result.replace(/\\[a-zA-Z]+\*?/g, ''); // Remove remaining commands
    result = result.replace(/\{([^}]*)\}/g, '$1'); // Remove remaining braces
    result = result.replace(/\s+/g, ' '); // Normalize spaces

    return result.trim();
};

// ========== IMPROVED TEXT PROCESSOR ==========
const processTextForPDF = async (text: string): Promise<string> => {
    let processedText = text.replace(/\\n/g, '\n');

    // Handle \text{} commands before processing math
    processedText = processedText.replace(/\\text\{([^}]*)\}/g, '$1');

    // Process display math ($$...$$)
    processedText = processedText.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        return '\n' + convertMathToUnicode(math.trim()) + '\n';
    });

    // Process inline math ($...$)
    processedText = processedText.replace(/\$([^$\n]+?)\$/g, (_, math) => {
        return convertMathToUnicode(math.trim());
    });

    // Clean up extra newlines
    processedText = processedText.replace(/\n\s*\n/g, '\n');

    return processedText;
};

// ========== IMPROVED LINE RENDERER WITH FRACTIONS ==========
const renderLineWithFractions = (doc: jsPDF, line: string, x: number, y: number): number => {
    let remaining = line;
    let cursorX = x;
    let maxHeight = 8; // Default line height
    
    // Find all fraction matches first
    const fracRegex = /__FRAC_(.+?)_(.+?)__/g;
    let lastIndex = 0;
    let match;

    // Reset regex to start from beginning
    fracRegex.lastIndex = 0;
    
    while ((match = fracRegex.exec(remaining)) !== null) {
        const [fullMatch, numerator, denominator] = match;
        const beforeText = remaining.substring(lastIndex, match.index);

        // Render text before fraction
        if (beforeText) {
            doc.text(beforeText, cursorX, y);
            cursorX += doc.getTextWidth(beforeText);
        }

        // Draw fraction and get its width
        const fracWidth = drawFraction(doc, numerator, denominator, cursorX, y);
        cursorX += fracWidth;
        maxHeight = Math.max(maxHeight, 16); // Account for fraction height

        lastIndex = match.index + fullMatch.length;
    }

    // Render any remaining text after the last fraction
    const remainingText = remaining.substring(lastIndex);
    if (remainingText) {
        doc.text(remainingText, cursorX, y);
    }

    return maxHeight;
};

// ========== MAIN PDF GENERATOR ==========
export const generatePDF = async (data: QuestionsData, includeAnswers: boolean = false): Promise<void> => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await loadThaiFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    const checkPageBreak = (requiredSpace: number = 20) => {
        if (currentY > pageHeight - requiredSpace) {
            doc.addPage();
            currentY = margin;
        }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('THSarabunNew', 'bold');
    doc.text(`ชุดฝึกคณิตศาสตร์`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;

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
        currentY += 7; 
    });
    currentY += 10;

    // Instructions
    doc.setFontSize(10);
    doc.text('คำแนะนำ: กรุณาเลือกคำตอบที่ถูกต้องที่สุด', margin, currentY);
    currentY += 8;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 12;

    // Questions
    doc.setFontSize(12);
    for (let index = 0; index < data.questions.length; index++) {
        const q = data.questions[index];

        checkPageBreak(50);

        // Question header
        doc.setFont('THSarabunNew', 'bold');
        doc.text(`ข้อที่ ${index + 1} (${q.score} คะแนน)`, margin, currentY);
        currentY += 10;

        // Question text
        doc.setFont('THSarabunNew', 'normal');
        const processedQuestion = await processTextForPDF(q.question);
        const questionLines = doc.splitTextToSize(processedQuestion, contentWidth);
        
        for (const line of questionLines) {
            checkPageBreak();
            const lineHeight = renderLineWithFractions(doc, line, margin, currentY);
            currentY += lineHeight;
        }
        currentY += 6;

        // Options
        if (q.options && q.options.length > 0) {
            for (let optIndex = 0; optIndex < q.options.length; optIndex++) {
                const optionLabel = String.fromCharCode(97 + optIndex); // a, b, c, d
                const processedOption = await processTextForPDF(q.options[optIndex]);
                const optionText = `${optionLabel}. ${processedOption}`;
                const optionLines = doc.splitTextToSize(optionText, contentWidth - 10);
                
                for (const line of optionLines) {
                    checkPageBreak();
                    const lineHeight = renderLineWithFractions(doc, line, margin + 5, currentY);
                    currentY += lineHeight;
                }
                currentY += 2;
            }
        }

        currentY += 8;

        // Answers (if requested)
        if (includeAnswers) {
            checkPageBreak(30);
            
            // Answer
            doc.setFont('THSarabunNew', 'bold');
            doc.text('คำตอบ:', margin, currentY);
            currentY += 8;

            doc.setFont('THSarabunNew', 'normal');
            if (q.options && q.correct_option_index !== undefined) {
                const correctAnswer = q.options[q.correct_option_index] || 'ไม่มีคำตอบ';
                const processedAnswer = await processTextForPDF(correctAnswer);
                const answerLines = doc.splitTextToSize(processedAnswer, contentWidth - 10);
                
                for (const line of answerLines) {
                    checkPageBreak();
                    const lineHeight = renderLineWithFractions(doc, line, margin + 5, currentY);
                    currentY += lineHeight;
                }
            }

            currentY += 8;

            // Explanation
            doc.setFont('THSarabunNew', 'bold');
            doc.text('วิธีทำ:', margin, currentY);
            currentY += 8;

            doc.setFont('THSarabunNew', 'normal');
            const processedExplanation = await processTextForPDF(q.explanation);
            const explanationLines = doc.splitTextToSize(processedExplanation, contentWidth - 10);
            
            for (const line of explanationLines) {
                checkPageBreak();
                const lineHeight = renderLineWithFractions(doc, line, margin + 5, currentY);
                currentY += lineHeight;
            }
            currentY += 12;
        } else {
            currentY += 20; // Space for student answers
        }

        // Separator line between questions
        if (index < data.questions.length - 1) {
            checkPageBreak(10);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 12;
        }
    }

    // Add page numbers
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
};