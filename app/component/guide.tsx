"use client";
import React, { useState } from 'react';
import { X, HelpCircle, Copy, CheckCircle, Search } from 'lucide-react';

interface KaTeXGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'basics' | 'common' | 'examples' | 'editing';

export default function KaTeXGuideModal({ isOpen, onClose }: KaTeXGuideModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basics');
  const [copiedText, setCopiedText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    });
  };

  const CodeBlock = ({ children, copyable = true }: { children: React.ReactNode; copyable?: boolean }) => {
    const text = typeof children === "string" ? children : React.Children.toArray(children).join("");

    return (
      <div className="relative bg-gray-800 rounded-lg p-3 font-mono text-sm text-gray-100 my-2">
        <pre className="whitespace-pre-wrap overflow-x-auto">{children}</pre>
        {copyable && (
          <button
            onClick={() => copyToClipboard(text)}
            className="cursor-pointer absolute top-2 right-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1"
          >
            {copiedText === text ? (
              <>
                <CheckCircle className="w-3 h-3" />
                คัดลอกแล้ว!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                คัดลอก
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  const ExampleCard = ({ title, katex, preview, description, category }: { 
    title: string; 
    katex: string; 
    preview: string;
    description?: string;
    category?: string;
  }) => (
    <div className="bg-slate-700 rounded-lg p-4 mb-4">
      <h4 className="text-emerald-400 font-medium mb-2">{title}</h4>
      {description && <p className="text-gray-300 text-sm mb-3">{description}</p>}
      <div className="space-y-3">
        <div>
          <span className="text-sm text-gray-300 font-medium">พิมพ์ในช่องแก้ไข:</span>
          <CodeBlock>{katex}</CodeBlock>
        </div>
        <div>
          <span className="text-sm text-gray-300 font-medium">จะแสดงผลเป็น:</span>
          <div className="bg-white p-3 rounded border text-black text-lg font-serif">{preview}</div>
        </div>
      </div>
    </div>
  );

  // All math examples data
  const allMathExamples = [
    // พื้นฐานและเศษส่วน
    { title: "เศษส่วน", katex: "$ \\frac{a}{b} $", preview: "a/b", category: "พื้นฐานและเศษส่วน", keywords: ["เศษส่วน", "หาร", "frac"] },
    { title: "เศษส่วนผสม", katex: "$ 2\\frac{1}{3} $", preview: "2⅓", category: "พื้นฐานและเศษส่วน", keywords: ["เศษส่วนผสม", "ผสม"] },
    { title: "เศษส่วนซ้อน", katex: "$ \\frac{\\frac{a}{b}}{c} $", preview: "(a/b)/c", category: "พื้นฐานและเศษส่วน", keywords: ["เศษส่วนซ้อน", "ซ้อน"] },
    { title: "ทศนิยม", katex: "$ 0.5 = \\frac{1}{2} $", preview: "0.5 = ½", category: "พื้นฐานและเศษส่วน", keywords: ["ทศนิยม", "จุดทศนิยม"] },
    { title: "เปอร์เซ็นต์", katex: "$ 50\\% = 0.5 $", preview: "50% = 0.5", category: "พื้นฐานและเศษส่วน", keywords: ["เปอร์เซ็นต์", "percent"] },
    { title: "อัตราส่วน", katex: "$ a : b = c : d $", preview: "a : b = c : d", category: "พื้นฐานและเศษส่วน", keywords: ["อัตราส่วน", "ratio"] },

    // กำลัง รากและลอการิทึม
    { title: "กำลัง", katex: "$ x^n $", preview: "xⁿ", category: "กำลัง รากและลอการิทึม", keywords: ["กำลัง", "power", "ยกกำลัง"] },
    { title: "กำลังสอง", katex: "$ x^2 $", preview: "x²", category: "กำลัง รากและลอการิทึม", keywords: ["กำลังสอง", "square"] },
    { title: "กำลังลบ", katex: "$ x^{-n} $", preview: "x⁻ⁿ", category: "กำลัง รากและลอการิทึม", keywords: ["กำลังลบ", "negative"] },
    { title: "รากที่สอง", katex: "$ \\sqrt{x} $", preview: "√x", category: "กำลัง รากและลอการิทึม", keywords: ["รากที่สอง", "sqrt", "root"] },
    { title: "รากที่ n", katex: "$ \\sqrt[n]{x} $", preview: "ⁿ√x", category: "กำลัง รากและลอการิทึม", keywords: ["รากที่", "nth root"] },
    { title: "รากที่สาม", katex: "$ \\sqrt[3]{27} $", preview: "∛27", category: "กำลัง รากและลอการิทึม", keywords: ["รากที่สาม", "cube root"] },
    { title: "ลอการิทึม", katex: "$ \\log_a b $", preview: "log_a b", category: "กำลัง รากและลอการิทึม", keywords: ["ลอการิทึม", "log"] },
    { title: "ลอการิทึมธรรมชาติ", katex: "$ \\ln x $", preview: "ln x", category: "กำลัง รากและลอการิทึม", keywords: ["ลอการิทึมธรรมชาติ", "ln", "natural log"] },
    { title: "เลขยกกำลัง e", katex: "$ e^x $", preview: "eˣ", category: "กำลัง รากและลอการิทึม", keywords: ["e", "exponential"] },

    // การดำเนินการพื้นฐาน
    { title: "บวก", katex: "$ a + b $", preview: "a + b", category: "การดำเนินการพื้นฐาน", keywords: ["บวก", "plus", "add"] },
    { title: "ลบ", katex: "$ a - b $", preview: "a - b", category: "การดำเนินการพื้นฐาน", keywords: ["ลบ", "minus", "subtract"] },
    { title: "คูณ", katex: "$ a \\times b $", preview: "a × b", category: "การดำเนินการพื้นฐาน", keywords: ["คูณ", "times", "multiply"] },
    { title: "คูณ (จุด)", katex: "$ a \\cdot b $", preview: "a · b", category: "การดำเนินการพื้นฐาน", keywords: ["คูณจุด", "dot", "cdot"] },
    { title: "หาร", katex: "$ a \\div b $", preview: "a ÷ b", category: "การดำเนินการพื้นฐาน", keywords: ["หาร", "divide", "div"] },
    { title: "บวกลบ", katex: "$ a \\pm b $", preview: "a ± b", category: "การดำเนินการพื้นฐาน", keywords: ["บวกลบ", "plus minus", "pm"] },
    { title: "ลบบวก", katex: "$ a \\mp b $", preview: "a ∓ b", category: "การดำเนินการพื้นฐาน", keywords: ["ลบบวก", "minus plus", "mp"] },
    { title: "เท่ากับ", katex: "$ a = b $", preview: "a = b", category: "การดำเนินการพื้นฐาน", keywords: ["เท่ากับ", "equal"] },
    { title: "ไม่เท่ากับ", katex: "$ a \\neq b $", preview: "a ≠ b", category: "การดำเนินการพื้นฐาน", keywords: ["ไม่เท่ากับ", "not equal", "neq"] },

    // เครื่องหมายเปรียบเทียบ
    { title: "น้อยกว่า", katex: "$ a < b $", preview: "a < b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["น้อยกว่า", "less than"] },
    { title: "มากกว่า", katex: "$ a > b $", preview: "a > b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["มากกว่า", "greater than"] },
    { title: "น้อยกว่าหรือเท่ากับ", katex: "$ a \\leq b $", preview: "a ≤ b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["น้อยกว่าหรือเท่ากับ", "leq"] },
    { title: "มากกว่าหรือเท่ากับ", katex: "$ a \\geq b $", preview: "a ≥ b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["มากกว่าหรือเท่ากับ", "geq"] },
    { title: "ประมาณ", katex: "$ a \\approx b $", preview: "a ≈ b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["ประมาณ", "approx"] },
    { title: "เท่ากันเอกลักษณ์", katex: "$ a \\equiv b $", preview: "a ≡ b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["เอกลักษณ์", "equiv"] },
    { title: "สัดส่วน", katex: "$ a \\propto b $", preview: "a ∝ b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["สัดส่วน", "propto"] },
    { title: "คล้าย", katex: "$ a \\sim b $", preview: "a ∼ b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["คล้าย", "sim"] },
    { title: "สอดคล้อง", katex: "$ a \\cong b $", preview: "a ≅ b", category: "เครื่องหมายเปรียบเทียบ", keywords: ["สอดคล้อง", "cong"] },

    // ฟังก์ชันและตรีโกณมิติ
    { title: "ไซน์", katex: "$ \\sin x $", preview: "sin x", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["ไซน์", "sin", "sine"] },
    { title: "โคไซน์", katex: "$ \\cos x $", preview: "cos x", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["โคไซน์", "cos", "cosine"] },
    { title: "แทนเจนต์", katex: "$ \\tan x $", preview: "tan x", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["แทนเจนต์", "tan", "tangent"] },
    { title: "โคแทนเจนต์", katex: "$ \\cot x $", preview: "cot x", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["โคแทนเจนต์", "cot", "cotangent"] },
    { title: "ซีแคนต์", katex: "$ \\sec x $", preview: "sec x", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["ซีแคนต์", "sec", "secant"] },
    { title: "โคซีแคนต์", katex: "$ \\csc x $", preview: "csc x", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["โคซีแคนต์", "csc", "cosecant"] },
    { title: "ฟังก์ชัน", katex: "$ f(x) $", preview: "f(x)", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["ฟังก์ชัน", "function"] },
    { title: "อนุพันธ์", katex: "$ f'(x) $", preview: "f'(x)", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["อนุพันธ์", "derivative"] },
    { title: "ลิมิต", katex: "$ \\lim_{x \\to a} f(x) $", preview: "lim[x→a] f(x)", category: "ฟังก์ชันและตรีโกณมิติ", keywords: ["ลิมิต", "lim", "limit"] },

    // พีชคณิตและสมการ
    { title: "สมการกำลังสอง", katex: "$ ax^2 + bx + c = 0 $", preview: "ax² + bx + c = 0", category: "พีชคณิตและสมการ", keywords: ["สมการกำลังสอง", "quadratic"] },
    { title: "สูตรแก้สมการ", katex: "$ x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} $", preview: "x = (-b ± √(b²-4ac))/(2a)", category: "พีชคณิตและสมการ", keywords: ["สูตรแก้สมการ", "quadratic formula"] },
    { title: "การแยกตัวประกอบ", katex: "$ x^2 - a^2 = (x+a)(x-a) $", preview: "x² - a² = (x+a)(x-a)", category: "พีชคณิตและสมการ", keywords: ["แยกตัวประกอบ", "factoring"] },
    { title: "อนุกรม", katex: "$ \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2} $", preview: "Σ[i=1 to n] i = n(n+1)/2", category: "พีชคณิตและสมการ", keywords: ["อนุกรม", "sum", "series"] },
    { title: "ผลคูณ", katex: "$ \\prod_{i=1}^{n} i = n! $", preview: "∏[i=1 to n] i = n!", category: "พีชคณิตและสมการ", keywords: ["ผลคูณ", "product", "factorial"] },

    // เรขาคณิตและพื้นที่
    { title: "พื้นที่วงกลม", katex: "$ A = \\pi r^2 $", preview: "A = πr²", category: "เรขาคณิตและพื้นที่", keywords: ["พื้นที่วงกลม", "circle area"] },
    { title: "ปริมาตรทรงกลม", katex: "$ V = \\frac{4}{3}\\pi r^3 $", preview: "V = (4/3)πr³", category: "เรขาคณิตและพื้นที่", keywords: ["ปริมาตรทรงกลม", "sphere volume"] },
    { title: "ทฤษฎีบทพีทาโกรัส", katex: "$ a^2 + b^2 = c^2 $", preview: "a² + b² = c²", category: "เรขาคณิตและพื้นที่", keywords: ["พีทาโกรัส", "pythagorean"] },
    { title: "องศา", katex: "$ 90° $", preview: "90°", category: "เรขาคณิตและพื้นที่", keywords: ["องศา", "degree"] },
    { title: "มุม", katex: "$ \\angle ABC $", preview: "∠ABC", category: "เรขาคณิตและพื้นที่", keywords: ["มุม", "angle"] },
    { title: "ขนาน", katex: "$ AB \\parallel CD $", preview: "AB ∥ CD", category: "เรขาคณิตและพื้นที่", keywords: ["ขนาน", "parallel"] },
    { title: "ตั้งฉาก", katex: "$ AB \\perp CD $", preview: "AB ⟂ CD", category: "เรขาคณิตและพื้นที่", keywords: ["ตั้งฉาก", "perpendicular"] },

    // ตัวอักษรกรีก
    { title: "อัลฟ่า", katex: "$ \\alpha $", preview: "α", category: "ตัวอักษรกรีก", keywords: ["อัลฟ่า", "alpha"] },
    { title: "บีตา", katex: "$ \\beta $", preview: "β", category: "ตัวอักษรกรีก", keywords: ["บีตา", "beta"] },
    { title: "แกมมา", katex: "$ \\gamma $", preview: "γ", category: "ตัวอักษรกรีก", keywords: ["แกมมา", "gamma"] },
    { title: "เดลตา", katex: "$ \\delta $", preview: "δ", category: "ตัวอักษรกรีก", keywords: ["เดลตา", "delta"] },
    { title: "เอปไซลอน", katex: "$ \\epsilon $", preview: "ε", category: "ตัวอักษรกรีก", keywords: ["เอปไซลอน", "epsilon"] },
    { title: "ซีตา", katex: "$ \\zeta $", preview: "ζ", category: "ตัวอักษรกรีก", keywords: ["ซีตา", "zeta"] },
    { title: "อีตา", katex: "$ \\eta $", preview: "η", category: "ตัวอักษรกรีก", keywords: ["อีตา", "eta"] },
    { title: "ทีตา", katex: "$ \\theta $", preview: "θ", category: "ตัวอักษรกรีก", keywords: ["ทีตา", "theta"] },
    { title: "ไอโอตา", katex: "$ \\iota $", preview: "ι", category: "ตัวอักษรกรีก", keywords: ["ไอโอตา", "iota"] },
    { title: "แคปปา", katex: "$ \\kappa $", preview: "κ", category: "ตัวอักษรกรีก", keywords: ["แคปปา", "kappa"] },
    { title: "แลมบ์ดา", katex: "$ \\lambda $", preview: "λ", category: "ตัวอักษรกรีก", keywords: ["แลมบ์ดา", "lambda"] },
    { title: "มิว", katex: "$ \\mu $", preview: "μ", category: "ตัวอักษรกรีก", keywords: ["มิว", "mu"] },
    { title: "นิว", katex: "$ \\nu $", preview: "ν", category: "ตัวอักษรกรีก", keywords: ["นิว", "nu"] },
    { title: "ไซ", katex: "$ \\xi $", preview: "ξ", category: "ตัวอักษรกรีก", keywords: ["ไซ", "xi"] },
    { title: "โอมิครอน", katex: "$ o $", preview: "o", category: "ตัวอักษรกรีก", keywords: ["โอมิครอน", "omicron"] },
    { title: "พาย", katex: "$ \\pi $", preview: "π", category: "ตัวอักษรกรีก", keywords: ["พาย", "pi", "ไพ"] },
    { title: "โร", katex: "$ \\rho $", preview: "ρ", category: "ตัวอักษรกรีก", keywords: ["โร", "rho"] },
    { title: "ซิกมา", katex: "$ \\sigma $", preview: "σ", category: "ตัวอักษรกรีก", keywords: ["ซิกมา", "sigma"] },
    { title: "เทา", katex: "$ \\tau $", preview: "τ", category: "ตัวอักษรกรีก", keywords: ["เทา", "tau"] },
    { title: "อัพไซลอน", katex: "$ \\upsilon $", preview: "υ", category: "ตัวอักษรกรีก", keywords: ["อัพไซลอน", "upsilon"] },
    { title: "ไฟ", katex: "$ \\phi $", preview: "φ", category: "ตัวอักษรกรีก", keywords: ["ไฟ", "phi"] },
    { title: "ไค", katex: "$ \\chi $", preview: "χ", category: "ตัวอักษรกรีก", keywords: ["ไค", "chi"] },
    { title: "ไซ", katex: "$ \\psi $", preview: "ψ", category: "ตัวอักษรกรีก", keywords: ["ไซ", "psi"] },
    { title: "โอเมกา", katex: "$ \\omega $", preview: "ω", category: "ตัวอักษรกรีก", keywords: ["โอเมกา", "omega"] },

    // แคลคูลัสและการวิเคราะห์
    { title: "อนุพันธ์", katex: "$ \\frac{dy}{dx} $", preview: "dy/dx", category: "แคลคูลัสและการวิเคราะห์", keywords: ["อนุพันธ์", "derivative"] },
    { title: "อนุพันธ์ย่อย", katex: "$ \\frac{\\partial f}{\\partial x} $", preview: "∂f/∂x", category: "แคลคูลัสและการวิเคราะห์", keywords: ["อนุพันธ์ย่อย", "partial derivative"] },
    { title: "ปริพันธ์", katex: "$ \\int f(x) dx $", preview: "∫ f(x) dx", category: "แคลคูลัสและการวิเคราะห์", keywords: ["ปริพันธ์", "integral"] },
    { title: "ปริพันธ์จำกัดเขต", katex: "$ \\int_a^b f(x) dx $", preview: "∫[a to b] f(x) dx", category: "แคลคูลัสและการวิเคราะห์", keywords: ["ปริพันธ์จำกัดเขต", "definite integral"] },
    { title: "เดลต้า", katex: "$ \\Delta x $", preview: "Δx", category: "แคลคูลัสและการวิเคราะห์", keywords: ["เดลต้า", "delta", "change"] },
    { title: "นาบลา", katex: "$ \\nabla f $", preview: "∇f", category: "แคลคูลัสและการวิเคราะห์", keywords: ["นาบลา", "nabla", "gradient"] },

    // สถิติและความน่าจะเป็น
    { title: "ค่าเฉลี่ย", katex: "$ \\bar{x} $", preview: "x̄", category: "สถิติและความน่าจะเป็น", keywords: ["ค่าเฉลี่ย", "mean", "average"] },
    { title: "ความแปรปรวน", katex: "$ \\sigma^2 $", preview: "σ²", category: "สถิติและความน่าจะเป็น", keywords: ["ความแปรปรวน", "variance"] },
    { title: "ส่วนเบี่ยงเบนมาตรฐาน", katex: "$ \\sigma $", preview: "σ", category: "สถิติและความน่าจะเป็น", keywords: ["ส่วนเบี่ยงเบนมาตรฐาน", "standard deviation"] },
    { title: "ความน่าจะเป็น", katex: "$ P(A) $", preview: "P(A)", category: "สถิติและความน่าจะเป็น", keywords: ["ความน่าจะเป็น", "probability"] },
    { title: "ความน่าจะเป็นเงื่อนไข", katex: "$ P(A|B) $", preview: "P(A|B)", category: "สถิติและความน่าจะเป็น", keywords: ["ความน่าจะเป็นเงื่อนไข", "conditional probability"] },
    { title: "การจัดเรียง", katex: "$ P_n^r $", preview: "Pₙʳ", category: "สถิติและความน่าจะเป็น", keywords: ["การจัดเรียง", "permutation"] },
    { title: "การจัดหมู่", katex: "$ C_n^r $", preview: "Cₙʳ", category: "สถิติและความน่าจะเป็น", keywords: ["การจัดหมู่", "combination"] },
    { title: "แฟกทอเรียล", katex: "$ n! $", preview: "n!", category: "สถิติและความน่าจะเป็น", keywords: ["แฟกทอเรียล", "factorial"] },
    { title: "การรวม", katex: "$ \\binom{n}{k} $", preview: "C(n,k)", category: "สถิติและความน่าจะเป็น", keywords: ["การรวม", "binomial coefficient"] },

    // เซตและสัญลักษณ์พิเศษ
    { title: "อนันต์", katex: "$ \\infty $", preview: "∞", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["อนันต์", "infinity", "infty"] },
    { title: "เซตว่าง", katex: "$ \\emptyset $", preview: "∅", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["เซตว่าง", "empty set", "emptyset"] },
    { title: "สมาชิกของ", katex: "$ a \\in A $", preview: "a ∈ A", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["สมาชิกของ", "in", "element"] },
    { title: "ไม่ใช่สมาชิก", katex: "$ a \\notin A $", preview: "a ∉ A", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["ไม่ใช่สมาชิก", "not in", "notin"] },
    { title: "สับเซต", katex: "$ A \\subset B $", preview: "A ⊂ B", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["สับเซต", "subset"] },
    { title: "สับเซตหรือเท่ากับ", katex: "$ A \\subseteq B $", preview: "A ⊆ B", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["สับเซตหรือเท่ากับ", "subseteq"] },
    { title: "ยูเนียน", katex: "$ A \\cup B $", preview: "A ∪ B", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["ยูเนียน", "union", "cup"] },
    { title: "อินเตอร์เซกชัน", katex: "$ A \\cap B $", preview: "A ∩ B", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["อินเตอร์เซกชัน", "intersection", "cap"] },
    { title: "ผลต่าง", katex: "$ A \\setminus B $", preview: "A \\ B", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["ผลต่าง", "difference", "setminus"] },
    { title: "ดังนั้น", katex: "$ \\therefore $", preview: "∴", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["ดังนั้น", "therefore"] },
    { title: "เพราะว่า", katex: "$ \\because $", preview: "∵", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["เพราะว่า", "because"] },
    { title: "สำหรับทุก", katex: "$ \\forall $", preview: "∀", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["สำหรับทุก", "forall", "for all"] },
    { title: "มีอยู่", katex: "$ \\exists $", preview: "∃", category: "เซตและสัญลักษณ์พิเศษ", keywords: ["มีอยู่", "exists", "there exists"] },
  ];

  // Filter examples based on search query
  const filteredExamples = allMathExamples.filter(example => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      example.title.toLowerCase().includes(query) ||
      example.preview.toLowerCase().includes(query) ||
      example.category.toLowerCase().includes(query) ||
      example.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  // Group filtered examples by category
  const groupedFilteredExamples = filteredExamples.reduce((acc, example) => {
    const category = example.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(example);
    return acc;
  }, {} as Record<string, typeof allMathExamples>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-xl w-11/12 max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-emerald-400" />
              คู่มือการแก้ไขโจทย์ด้วย KaTeX
            </h2>
            <p className="text-gray-300 mt-1">เรียนรู้การเขียนสูตรคณิตศาสตร์ในระบบแก้ไขโจทย์</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-600 overflow-x-auto">
          {[
            { id: 'basics' as TabType, label: 'พื้นฐานที่ต้องรู้', icon: '📚' },
            { id: 'common' as TabType, label: 'สูตรคณิตศาสตร์ทั้งหมด', icon: '⚡' },
            { id: 'examples' as TabType, label: 'ตัวอย่างโจทย์', icon: '📝' },
            { id: 'editing' as TabType, label: 'การแก้ไขในระบบ', icon: '✏️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={` cursor-pointer px-6 py-3 font-medium transition-colors flex items-center space-x-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar - Only show in 'common' tab */}
        {activeTab === 'common' && (
          <div className="p-4 border-b border-slate-600 bg-slate-750">
            <div className="relative full-w-md mx-auto ">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาสัญลักษณ์หรือสูตร... (เช่น เศษส่วน, sin, alpha)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="text-center mt-2 text-sm text-gray-400">
                พบ {filteredExamples.length} ผลลัพธ์จากการค้นหา "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {activeTab === 'basics' && (
            <div className="space-y-6">
              <div className="bg-blue-900/30 border border-blue-400/50 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-3">🎯 KaTeX คืออะไร?</h3>
                <p className="text-gray-300 mb-2">
                  KaTeX เป็นเครื่องมือสำหรับเขียนสูตรคณิตศาสตร์ให้แสดงผลสวยงาม เหมือนในตำราเรียน
                </p>
                <p className="text-gray-300">
                  ในระบบแก้ไขโจทย์ คุณสามารถใช้ KaTeX ได้ทั้งในโจทย์และตัวเลือกคำตอบ
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-4">กฎพื้นฐานที่ต้องจำ</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">1. เริ่มต้นและจบด้วย $</h4>
                    <p className="text-gray-300 text-sm mb-2">สูตรคณิตศาสตร์ต้องอยู่ระหว่าง $ และ $</p>
                    <CodeBlock>$ x^2 + 5x + 6 = 0 $</CodeBlock>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">2. ใช้ \ หน้าคำสั่งพิเศษ</h4>
                    <p className="text-gray-300 text-sm mb-2">คำสั่งพิเศษต้องมี backslash (\) ข้างหน้า</p>
                    <CodeBlock>$ \frac{1}{2} $ สำหรับเศษส่วน</CodeBlock>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">3. ใช้ {} จัดกลุ่ม</h4>
                    <p className="text-gray-300 text-sm mb-2">ใช้ปีกกาเมื่อมีมากกว่า 1 ตัวอักษร</p>
                    <CodeBlock>$ x^{10} $ ไม่ใช่ $ x^10 $</CodeBlock>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">4. ข้อความไทยใช้ \text{}</h4>
                    <p className="text-gray-300 text-sm mb-2">ข้อความภาษาไทยต้องใส่ใน \text{}</p>
                    <CodeBlock>$ \text{`{เมื่อ }`} x = 5 $</CodeBlock>
                  </div>
                </div>

                <div className="bg-red-900/30 border border-red-400/50 rounded-lg p-4">
                  <h4 className="text-red-300 font-medium mb-2">⚠️ ข้อผิดพลาดที่พบบ่อย</h4>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• ลืมใส่ $ ข้างหน้าและข้างหลัง</li>
                    <li>• ลืม \ หน้าคำสั่งเช่น frac แทน \frac</li>
                    <li>• ลืมปิดปีกกา {} ให้ครบ</li>
                    <li>• ไม่ใส่ข้อความไทยใน \text{}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'common' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">สัญลักษณ์และสูตรคณิตศาสตร์ทั้งหมด</h3>
              
              {searchQuery && filteredExamples.length === 0 && (
                <div className="bg-yellow-900/30 border border-yellow-400/50 rounded-lg p-4 text-center">
                  <p className="text-yellow-300">ไม่พบผลลัพธ์สำหรับ "{searchQuery}"</p>
                  <p className="text-gray-400 text-sm mt-1">ลองค้นหาด้วยคำอื่นหรือลบคำค้นหา</p>
                </div>
              )}

              {Object.entries(groupedFilteredExamples).map(([categoryName, examples]) => (
                <div key={categoryName}>
                  <h4 className="text-lg font-medium text-emerald-400 mb-3">
                    {categoryName === "พื้นฐานและเศษส่วน" && "🔢 "}
                    {categoryName === "กำลัง รากและลอการิทึม" && "⚡ "}
                    {categoryName === "การดำเนินการพื้นฐาน" && "➕ "}
                    {categoryName === "เครื่องหมายเปรียบเทียบ" && "⚖️ "}
                    {categoryName === "ฟังก์ชันและตรีโกณมิติ" && "📊 "}
                    {categoryName === "พีชคณิตและสมการ" && "🧮 "}
                    {categoryName === "เรขาคณิตและพื้นที่" && "📐 "}
                    {categoryName === "ตัวอักษรกรีก" && "🔤 "}
                    {categoryName === "แคลคูลัสและการวิเคราะห์" && "∫ "}
                    {categoryName === "สถิติและความน่าจะเป็น" && "📈 "}
                    {categoryName === "เซตและสัญลักษณ์พิเศษ" && "∞ "}
                    {categoryName}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {examples.map((example, index) => (
                      <ExampleCard
                        key={`${categoryName}-${index}`}
                        title={example.title}
                        katex={example.katex}
                        preview={example.preview}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="bg-green-900/30 border border-green-400/50 rounded-lg p-4 mt-6">
                <h4 className="text-green-300 font-medium mb-2">💡 เทคนิคการใช้งาน</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• ใช้ปีกกา {} เมื่อต้องการจัดกลุ่มตัวอักษรหลายตัว</li>
                  <li>• ใช้ \, \quad \qquad สำหรับการเว้นวรรคในระดับต่างๆ</li>
                  <li>• ใช้ \text{} สำหรับข้อความภาษาไทยหรือคำอธิบาย</li>
                  <li>• ใช้ \displaystyle เพื่อให้สูตรแสดงผลขนาดใหญ่ขึ้น</li>
                  <li>• สามารถใช้หลาย $ ในประโยคเดียวกันได้</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">ตัวอย่างโจทย์ในระบบ</h3>
              
              <div className="bg-amber-900/30 border border-amber-400/50 rounded-lg p-4 mb-6">
                <h4 className="text-amber-300 font-medium mb-2">💡 วิธีใช้ตัวอย่างเหล่านี้</h4>
                <p className="text-gray-300 text-sm">
                  คัดลอกโค้ด KaTeX จากตัวอย่างด้านล่าง แล้ววางลงในช่องแก้ไขโจทย์หรือตัวเลือก
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-emerald-400 mb-3">📝 โจทย์คณิตศาสตร์</h4>
                
                <ExampleCard
                  title="โจทย์สมการกำลังสอง"
                  description="ตัวอย่างโจทย์ที่ผสมข้อความไทยกับสูตร"
                  katex="นักเรียนสามารถหาค่าของ $ x $ ที่ทำให้สมการ $ x^2 + 5x + 6 = 0 $ เป็นจริงได้หรือไม่ โดยใช้วิธีแยกตัวประกอบ"
                  preview="นักเรียนสามารถหาค่าของ x ที่ทำให้สมการ x² + 5x + 6 = 0 เป็นจริงได้หรือไม่ โดยใช้วิธีแยกตัวประกอบ"
                />
                
                <ExampleCard
                  title="โจทย์เรขาคณิต"
                  katex="วงกลมมีรัศมี $ r = 7 $ เซนติเมตร จงหาพื้นที่ของวงกลมนี้ โดยใช้สูตร $ A = \pi r^2 $"
                  preview="วงกลมมีรัศมี r = 7 เซนติเมตร จงหาพื้นที่ของวงกลมนี้ โดยใช้สูตร A = πr²"
                />
                
                <ExampleCard
                  title="โจทย์เศษส่วน"
                  katex="จงคำนวณ $ \frac{2}{3} + \frac{1}{4} $ และเขียนผลลัพธ์ในรูปเศษส่วนอย่างต่ำ"
                  preview="จงคำนวณ ⅔ + ¼ และเขียนผลลัพธ์ในรูปเศษส่วนอย่างต่ำ"
                />
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-emerald-400 mb-3">🎯 ตัวเลือกคำตอบ</h4>
                
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-gray-300 mb-3">ตัวอย่างตัวเลือกสำหรับโจทย์ $ x^2 - 4x + 4 = 0 $</p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-emerald-400">ตัวเลือก A:</span>
                        <CodeBlock>$ x = 2 $ เท่านั้น</CodeBlock>
                      </div>
                      <div>
                        <span className="text-emerald-400">ตัวเลือก B:</span>
                        <CodeBlock>$ x = 1 $ หรือ $ x = 4 $</CodeBlock>
                      </div>
                      <div>
                        <span className="text-emerald-400">ตัวเลือก C:</span>
                        <CodeBlock>$ x = -2 $ หรือ $ x = 2 $</CodeBlock>
                      </div>
                      <div>
                        <span className="text-emerald-400">ตัวเลือก D:</span>
                        <CodeBlock>ไม่มีคำตอบที่เป็นจำนวนจริง</CodeBlock>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editing' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">วิธีแก้ไขในระบบ</h3>
              
              <div className="bg-green-900/30 border border-green-400/50 rounded-lg p-4">
                <h4 className="text-green-300 font-medium mb-2">✅ ขั้นตอนการแก้ไข</h4>
                <ol className="text-gray-300 space-y-2 text-sm list-decimal list-inside">
                  <li>คลิกที่โจทย์หรือตัวเลือกที่ต้องการแก้ไข</li>
                  <li>พิมพ์สูตร KaTeX ในช่องแก้ไข (อย่าลืม $ ข้างหน้าและข้างหลัง)</li>
                  <li>กดปุ่ม "บันทึก" เพื่อดูผลลัพธ์</li>
                  <li>ถ้าผิดพลาด ให้แก้ไขและบันทึกใหม่</li>
                </ol>
              </div>

              <div>
                <h4 className="text-lg font-medium text-emerald-400 mb-3">🛠️ เครื่องมือช่วยแก้ไข</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h5 className="text-white font-medium mb-2">คัดลอกได้ทุกตัวอย่าง</h5>
                    <p className="text-gray-300 text-sm mb-2">
                      ใช้ปุ่ม "คัดลอก" ในแต่ละตัวอย่างแล้วนำไปวางในระบบ
                    </p>
                    <div className="bg-gray-800 p-2 rounded text-xs text-gray-300">
                      💡 เคล็ดลับ: คัดลอกแล้ววาง จากนั้นปรับแต่งตามต้องการ
                    </div>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h5 className="text-white font-medium mb-2">ตรวจสอบผลลัพธ์</h5>
                    <p className="text-gray-300 text-sm mb-2">
                      หลังบันทึกแล้ว ให้ตรวจดูว่าสูตรแสดงผลถูกต้องหรือไม่
                    </p>
                    <div className="bg-gray-800 p-2 rounded text-xs text-gray-300">
                      ⚠️ หากผิดพลาด ให้แก้ไขและบันทึกใหม่
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-emerald-400 mb-3">🔧 การแก้ปัญหาที่พบบ่อย</h4>
                
                <div className="space-y-4">
                  <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-4">
                    <h5 className="text-red-300 font-medium mb-2">❌ สูตรไม่แสดงผล</h5>
                    <p className="text-gray-300 text-sm mb-2">สาเหตุ: ลืมใส่ $ หรือมี syntax ผิด</p>
                    <p className="text-gray-300 text-sm">
                      <span className="text-red-300">ผิด:</span> x^2 + 5x + 6 = 0<br/>
                      <span className="text-green-300">ถูก:</span> $ x^2 + 5x + 6 = 0 $
                    </p>
                  </div>
                  
                  <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-4">
                    <h5 className="text-red-300 font-medium mb-2">❌ เศษส่วนไม่สวย</h5>
                    <p className="text-gray-300 text-sm mb-2">สาเหตุ: ไม่ใช้ \frac</p>
                    <p className="text-gray-300 text-sm">
                      <span className="text-red-300">ผิด:</span> $ 1/2 $<br/>
                      <span className="text-green-300">ถูก:</span> $ \frac{1}{2} $
                    </p>
                  </div>
                  
                  <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-4">
                    <h5 className="text-red-300 font-medium mb-2">❌ ข้อความไทยผิด</h5>
                    <p className="text-gray-300 text-sm mb-2">สาเหตุ: ไม่ใส่ใน \text{}</p>
                    <p className="text-gray-300 text-sm">
                      <span className="text-red-300">ผิด:</span> $ x = 5 $<br/>
                      <span className="text-green-300">ถูก:</span> $ \text{`{เมื่อ }`} x = 5 $
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-400/50 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">💡 เทคนิคขั้นสูง</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• ใช้ \, สำหรับเว้นวรรคเล็กน้อยระหว่างสูตร</li>
                  <li>• ใช้ \quad สำหรับเว้นวรรคมากขึ้น</li>
                  <li>• ใช้ \displaystyle เพื่อให้สูตรใหญ่ขึ้น</li>
                  <li>• สามารถใช้หลาย $ ในประโยคเดียวได้</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Guide Button Component to be added to the header
export function KaTeXGuideButton() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsGuideOpen(true)}
        className=" cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg"
        title="คู่มือการแก้ไขโจทย์ด้วย KaTeX"
      >
        <HelpCircle className="w-4 h-4" />
        <span>คู่มือ KaTeX</span>
      </button>
      
      <KaTeXGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />
    </>
  );
}