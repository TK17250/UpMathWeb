'use client';
import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KaTeXRendererProps {
    children: string;
    displayMode?: boolean;
    className?: string;
}

export default function KaTeXRenderer({ 
    children, 
    displayMode = false, 
    className = '' 
}: KaTeXRendererProps) {
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (containerRef.current && children) {
            try {
                containerRef.current.innerHTML = '';
                
                // Split text into math and non-math parts
                const parts = splitTextAndMath(children, displayMode);
                
                parts.forEach(part => {
                    if (part.isMath) {
                        renderMathPart(part.content, containerRef.current!, part.display);
                    } else {
                        renderTextPart(part.content, containerRef.current!);
                    }
                });
            } catch (error) {
                console.error('KaTeX rendering error:', error);
                containerRef.current.textContent = children;
            }
        }
    }, [children, displayMode]);

    return <span ref={containerRef} className={className} />;
}

// Helper function to split text into math and non-math parts
function splitTextAndMath(text: string, defaultDisplayMode: boolean) {
    const parts: Array<{content: string, isMath: boolean, display: boolean}> = [];
    let remaining = text;
    
    // Handle line breaks first
    remaining = remaining.replace(/\\n/g, '\n');
    
    // Regex to match both display ($$...$$) and inline ($...$) math
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g;
    let lastIndex = 0;
    let match;
    
    while ((match = mathRegex.exec(remaining)) !== null) {
        // Add text before math
        if (match.index > lastIndex) {
            const textPart = remaining.substring(lastIndex, match.index);
            if (textPart.trim()) {
                parts.push({
                    content: textPart,
                    isMath: false,
                    display: false
                });
            }
        }
        
        // Add math part
        const mathContent = match[0];
        const isDisplayMath = mathContent.startsWith('$$') && mathContent.endsWith('$$');
        const cleanMath = isDisplayMath 
            ? mathContent.slice(2, -2).trim() 
            : mathContent.slice(1, -1).trim();
        
        parts.push({
            content: cleanMath,
            isMath: true,
            display: isDisplayMath || defaultDisplayMode
        });
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < remaining.length) {
        const textPart = remaining.substring(lastIndex);
        if (textPart.trim()) {
            parts.push({
                content: textPart,
                isMath: false,
                display: false
            });
        }
    }
    
    return parts;
}

// Helper function to render math parts
function renderMathPart(mathContent: string, container: HTMLElement, displayMode: boolean) {
    try {
        const mathSpan = document.createElement('span');
        katex.render(mathContent, mathSpan, {
            displayMode,
            throwOnError: false,
            trust: true,
            strict: false,
            macros: {
                // Add common macros if needed
                '\\RR': '\\mathbb{R}',
                '\\NN': '\\mathbb{N}',
                '\\ZZ': '\\mathbb{Z}',
                '\\QQ': '\\mathbb{Q}'
            }
        });
        container.appendChild(mathSpan);
    } catch (error) {
        console.error('Math rendering error:', error, 'Content:', mathContent);
        // Fallback: show original math notation
        const errorSpan = document.createElement('span');
        const delimiter = displayMode ? '$$' : '$';
        errorSpan.textContent = `${delimiter}${mathContent}${delimiter}`;
        errorSpan.style.color = '#cc0000';
        errorSpan.style.backgroundColor = '#fff3cd';
        errorSpan.style.padding = '2px 4px';
        errorSpan.style.borderRadius = '3px';
        container.appendChild(errorSpan);
    }
}

// Helper function to render text parts
function renderTextPart(textContent: string, container: HTMLElement) {
    const lines = textContent.split('\n');
    lines.forEach((line, index) => {
        if (line) {
            container.appendChild(document.createTextNode(line));
        }
        if (index < lines.length - 1) {
            container.appendChild(document.createElement('br'));
        }
    });
}

// Simplified component interfaces
export function MathText({ children, className = '' }: { children: string; className?: string }) {
    return <KaTeXRenderer className={className}>{children}</KaTeXRenderer>;
}

export function MathDisplay({ children, className = '' }: { children: string; className?: string }) {
    return (
        <KaTeXRenderer 
            displayMode={true} 
            className={`block text-center my-4 ${className}`}
        >
            {children}
        </KaTeXRenderer>
    );
}

// This function is for PDF generation - it should NOT be used in the PDF generator
// since PDF generators can't handle HTML/CSS from KaTeX
export function renderMathForPDF(text: string): string {
    console.warn('renderMathForPDF should not be used in PDF generation. Use the PDF generator\'s own math processing instead.');
    return text; // Return original text to avoid errors
}