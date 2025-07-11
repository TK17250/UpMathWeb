'use client';
import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KaTeXRendererProps {
    children: string;
    displayMode?: boolean;
    className?: string;
}

export default function KaTeXRenderer({ children, displayMode = false, className = '' }: KaTeXRendererProps) {
    const containerRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (containerRef.current && children) {
            try {
                // Clean the container
                containerRef.current.innerHTML = '';
                
                // Replace line breaks with <br> tags
                // Handle both \n\n (double line breaks) and \n (single line breaks)
                const processedText = children
                    .replace(/\\n\\n/g, '<br><br>')  // Double escaped line breaks -> double <br>
                    .replace(/\n\n/g, '<br><br>')    // Double line breaks -> double <br>
                    .replace(/\\n/g, '<br>')         // Single escaped line breaks -> <br>
                    .replace(/\n/g, '<br>');         // Single line breaks -> <br>
                
                // Replace multiple math expressions in the text
                const mathRegex = displayMode 
                    ? /\$\$(.*?)\$\$/g  // Display math $$...$$
                    : /\$(.*?)\$/g;     // Inline math $...$
                
                const parts = processedText.split(mathRegex);
                
                parts.forEach((part, index) => {
                    if (index % 2 === 0) {
                        // Regular text with possible HTML
                        if (part) {
                            // Handle <br> tags by splitting and creating elements
                            const htmlParts = part.split('<br>');
                            htmlParts.forEach((htmlPart, htmlIndex) => {
                                if (htmlPart) {
                                    const textNode = document.createTextNode(htmlPart);
                                    containerRef.current!.appendChild(textNode);
                                }
                                if (htmlIndex < htmlParts.length - 1) {
                                    const brElement = document.createElement('br');
                                    containerRef.current!.appendChild(brElement);
                                }
                            });
                        }
                    } else {
                        // Math expression
                        try {
                            const mathSpan = document.createElement('span');
                            katex.render(part, mathSpan, {
                                displayMode: displayMode,
                                throwOnError: false,
                                errorColor: '#cc0000',
                                strict: false,
                                trust: true
                            });
                            containerRef.current!.appendChild(mathSpan);
                        } catch (error) {
                            // If KaTeX fails, show the original text
                            const errorSpan = document.createElement('span');
                            errorSpan.textContent = displayMode ? `$$${part}$$` : `$${part}$`;
                            errorSpan.style.color = '#cc0000';
                            containerRef.current!.appendChild(errorSpan);
                        }
                    }
                });
            } catch (error) {
                // Fallback: show original text
                containerRef.current.textContent = children;
            }
        }
    }, [children, displayMode]);

    return <span ref={containerRef} className={className} />;
}

// Component for rendering mixed text with math
export function MathText({ children, className = '' }: { children: string; className?: string }) {
    return <KaTeXRenderer className={className}>{children}</KaTeXRenderer>;
}

// Component for rendering display math (block)
export function MathDisplay({ children, className = '' }: { children: string; className?: string }) {
    return <KaTeXRenderer displayMode={true} className={`block text-center ${className}`}>{children}</KaTeXRenderer>;
}

// Function to render math for PDF (returns HTML string)
export function renderMathForPDF(text: string): string {
    try {
        // Replace line breaks with HTML breaks for PDF
        let result = text
            .replace(/\\n\\n/g, '<br><br>')  // Double escaped line breaks
            .replace(/\n\n/g, '<br><br>')    // Double line breaks
            .replace(/\\n/g, '<br>')         // Single escaped line breaks
            .replace(/\n/g, '<br>');         // Single line breaks
        
        // Handle display math first
        result = result.replace(/\$\$(.*?)\$\$/g, (match, math) => {
            try {
                return katex.renderToString(math, {
                    displayMode: true,
                    throwOnError: false,
                    strict: false,
                    trust: true
                });
            } catch {
                return match;
            }
        });
        
        // Handle inline math
        result = result.replace(/\$(.*?)\$/g, (match, math) => {
            try {
                return katex.renderToString(math, {
                    displayMode: false,
                    throwOnError: false,
                    strict: false,
                    trust: true
                });
            } catch {
                return match;
            }
        });
        
        return result;
    } catch (error) {
        return text;
    }
}
