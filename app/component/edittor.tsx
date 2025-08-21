import React, { useState, useRef, useEffect, ReactElement } from 'react';
import 'katex/dist/katex.min.css';

// Type definitions
interface MathTextProps {
  children?: string;
}

interface EquationData {
  equation: string;
  start: number;
  end: number;
}

interface EquationMatch {
  match: string;
  start: number;
  end: number;
  isBlock: boolean;
}

interface EquationEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
  placeholder?: string;
}

// Mock MathText component that renders KaTeX
const MathText: React.FC<MathTextProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current && typeof window !== 'undefined') {
      const text = children || '';
      
      // Simple regex to find $$ blocks and inline $ blocks
      const parts = text.split(/(\$\$[^$]*\$\$|\$[^$]*\$)/g);
      
      let html = '';
      parts.forEach((part: string) => {
        if (part.match(/^\$\$.*\$\$$/)) {
          // Block math
          const math = part.replace(/^\$\$|\$\$$/g, '');
          html += `<div class="katex-block" style="text-align: center; margin: 10px 0; padding: 10px; background: rgba(128, 237, 153, 0.1); border-radius: 4px; color: #80ED99;">${math}</div>`;
        } else if (part.match(/^\$.*\$$/)) {
          // Inline math
          const math = part.replace(/^\$|\$$/g, '');
          html += `<span class="katex-inline" style="color: #80ED99; background: rgba(128, 237, 153, 0.1); padding: 2px 4px; border-radius: 2px;">${math}</span>`;
        } else {
          html += part;
        }
      });
      
      containerRef.current.innerHTML = html;
    }
  }, [children]);
  
  return <div ref={containerRef}></div>;
};

// Enhanced textarea with equation editing capabilities
const EquationEditor: React.FC<EquationEditorProps> = ({ 
  value, 
  onChange, 
  className, 
  rows = 4, 
  placeholder 
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingEquation, setEditingEquation] = useState<EquationData | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+E to insert equation
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      insertEquation();
    }
    
    // Escape to cancel equation editing
    if (e.key === 'Escape' && editingEquation !== null) {
      setEditingEquation(null);
      setEditingValue('');
      setIsEditing(false);
    }
    
    // Enter to confirm equation editing
    if (e.key === 'Enter' && editingEquation !== null) {
      e.preventDefault();
      confirmEquationEdit();
    }
  };

  // Insert new equation at cursor position
  const insertEquation = (): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + '$$  $$' + value.substring(end);
    
    onChange(newValue);
    
    // Position cursor between the $$
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 3, start + 3);
    }, 0);
  };

  // Find equations in text
  const findEquations = (text: string): EquationMatch[] => {
    const equations: EquationMatch[] = [];
    const regex = /(\$\$[^$]*\$\$|\$[^$]*\$)/g;
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(text)) !== null) {
      equations.push({
        match: match[0],
        start: match.index,
        end: match.index + match[0].length,
        isBlock: match[0].startsWith('$$')
      });
    }
    
    return equations;
  };

  // Handle double click on rendered math
  const handleMathDoubleClick = (equation: string, start: number, end: number): void => {
    setEditingEquation({ equation, start, end });
    setEditingValue(equation);
    setIsEditing(true);
  };

  // Confirm equation edit
  const confirmEquationEdit = (): void => {
    if (editingEquation) {
      const { start, end } = editingEquation;
      const newValue = value.substring(0, start) + editingValue + value.substring(end);
      onChange(newValue);
      setEditingEquation(null);
      setEditingValue('');
      setIsEditing(false);
    }
  };

  // Render the content with interactive equations
  const renderContent = (): ReactElement => {
    if (isEditing && !editingEquation) {
      return <MathText>{value}</MathText>;
    }

    const equations = findEquations(value);
    if (equations.length === 0) {
      return <MathText>{value}</MathText>;
    }

    const parts: ReactElement[] = [];
    let lastEnd = 0;

    equations.forEach((eq, index) => {
      // Add text before equation
      if (eq.start > lastEnd) {
        parts.push(
          <span key={`text-${index}`}>
            {value.substring(lastEnd, eq.start)}
          </span>
        );
      }

      // Add equation (editable on double click)
      parts.push(
        <span
          key={`eq-${index}`}
          className="equation-wrapper cursor-pointer hover:bg-blue-500/10 rounded px-1"
          onDoubleClick={() => handleMathDoubleClick(eq.match, eq.start, eq.end)}
          title="Double-click to edit this equation"
        >
          <MathText>{eq.match}</MathText>
        </span>
      );

      lastEnd = eq.end;
    });

    // Add remaining text
    if (lastEnd < value.length) {
      parts.push(
        <span key="text-end">
          {value.substring(lastEnd)}
        </span>
      );
    }

    return <div className="rendered-content">{parts}</div>;
  };

  return (
    <div className="equation-editor">
      {/* Editing Mode Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isEditing 
                ? 'bg-[#80ED99] text-[#002D4A]' 
                : 'bg-[#203D4F] text-white hover:bg-[#2a4f63]'
            }`}
          >
            {isEditing ? 'Preview Mode' : 'Edit Mode'}
          </button>
          
          <button
            type="button"
            onClick={insertEquation}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Insert equation (Ctrl+E)"
          >
            + Equation
          </button>
        </div>
        
        <div className="text-xs text-gray-400">
          {isEditing ? 'Double-click equations to edit • Ctrl+E for new equation' : 'Toggle to edit mode to interact with equations'}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="relative">
        {isEditing ? (
          // Edit mode with rendered equations
          <div 
            className={`${className} min-h-[100px] p-3 border rounded focus-within:border-[#80ED99] cursor-text`}
            onClick={() => textareaRef.current?.focus()}
          >
            {renderContent()}
            
            {/* Hidden textarea for actual editing */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="absolute inset-0 w-full h-full opacity-0 resize-none"
              placeholder={placeholder}
            />
          </div>
        ) : (
          // Simple textarea mode
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={className}
            rows={rows}
            placeholder={placeholder}
          />
        )}
      </div>

      {/* Equation Edit Modal */}
      {editingEquation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2D4A5B] p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Equation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#80ED99] mb-2">LaTeX Code:</label>
                <textarea
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingEquation(null);
                      setEditingValue('');
                      setIsEditing(false);
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmEquationEdit();
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#203D4F] text-white rounded border border-[#002D4A] focus:border-[#80ED99] resize-none"
                  rows={3}
                  placeholder="Enter LaTeX code (with $ or $$ delimiters)"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#80ED99] mb-2">Preview:</label>
                <div className="bg-[#203D4F] p-3 rounded border border-[#002D4A] min-h-[50px]">
                  <MathText>{editingValue}</MathText>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setEditingEquation(null);
                  setEditingValue('');
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-[#203D4F] text-white rounded hover:bg-[#152b3a] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEquationEdit}
                className="px-4 py-2 bg-[#80ED99] text-[#002D4A] rounded hover:bg-[#6ee085] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquationEditor;