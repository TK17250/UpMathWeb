"use client";
import React, { useState } from 'react';
import { X, HelpCircle, Copy, CheckCircle } from 'lucide-react';

interface KaTeXGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'basics' | 'common' | 'examples' | 'editing';

export default function KaTeXGuideModal({ isOpen, onClose }: KaTeXGuideModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('basics');
  const [copiedText, setCopiedText] = useState<string>('');

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
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1"
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


  const ExampleCard = ({ title, katex, preview, description }: { 
    title: string; 
    katex: string; 
    preview: string;
    description?: string;
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
            { id: 'common' as TabType, label: 'สูตรที่ใช้บ่อย', icon: '⚡' },
            { id: 'examples' as TabType, label: 'ตัวอย่างโจทย์', icon: '📝' },
            { id: 'editing' as TabType, label: 'การแก้ไขในระบบ', icon: '✏️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 whitespace-nowrap ${
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
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
                    <CodeBlock>$ \frac{`{1}{2}`} $ สำหรับเศษส่วน</CodeBlock>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">3. ใช้ {`{}`} จัดกลุ่ม</h4>
                    <p className="text-gray-300 text-sm mb-2">ใช้ปีกกาเมื่อมีมากกว่า 1 ตัวอักษร</p>
                    <CodeBlock>$ x^{`{10}`} $ ไม่ใช่ $ x^10 $</CodeBlock>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">4. ข้อความไทยใช้ \text{`{}`}</h4>
                    <p className="text-gray-300 text-sm mb-2">ข้อความภาษาไทยต้องใส่ใน \text{`{}`}</p>
                    <CodeBlock>$ \text{`{เมื่อ }`} x = 5 $</CodeBlock>
                  </div>
                </div>

                <div className="bg-red-900/30 border border-red-400/50 rounded-lg p-4">
                  <h4 className="text-red-300 font-medium mb-2">⚠️ ข้อผิดพลาดที่พบบ่อย</h4>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• ลืมใส่ $ ข้างหน้าและข้างหลัง</li>
                    <li>• ลืม \ หน้าคำสั่งเช่น frac แทน \frac</li>
                    <li>• ลืมปิดปีกกา {`{}`} ให้ครบ</li>
                    <li>• ไม่ใส่ข้อความไทยใน \text{`{}`}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'common' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">สูตรที่ใช้บ่อยในการสอน</h3>
              
              <div>
                <h4 className="text-lg font-medium text-emerald-400 mb-3">🔢 ตัวเลขและเครื่องหมาย</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ExampleCard
                    title="เศษส่วน"
                    katex="$ \frac{3}{4} $"
                    preview="¾"
                  />
                  <ExampleCard
                    title="กำลัง (ยกกำลัง)"
                    katex="$ x^2 $ หรือ $ x^{10} $"
                    preview="x² หรือ x¹⁰"
                  />
                  <ExampleCard
                    title="รากที่สอง"
                    katex="$ \sqrt{25} $"
                    preview="√25"
                  />
                  <ExampleCard
                    title="รากที่ n"
                    katex="$ \sqrt[3]{27} $"
                    preview="∛27"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-emerald-400 mb-3">📐 เรขาคณิต</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ExampleCard
                    title="พื้นที่วงกลม"
                    katex="$ A = \pi r^2 $"
                    preview="A = πr²"
                  />
                  <ExampleCard
                    title="ปริมาตรทรงกลม"
                    katex="$ V = \frac{4}{3}\pi r^3 $"
                    preview="V = (4/3)πr³"
                  />
                  <ExampleCard
                    title="ทฤษฎีบทพีทาโกรัส"
                    katex="$ a^2 + b^2 = c^2 $"
                    preview="a² + b² = c²"
                  />
                  <ExampleCard
                    title="มุมและองศา"
                    katex="$ 90° $ หรือ $ \frac{\pi}{2} $ รูบ"
                    preview="90° หรือ π/2 รูบ"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-emerald-400 mb-3">🧮 พีชคณิต</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ExampleCard
                    title="สมการกำลังสอง"
                    katex="$ ax^2 + bx + c = 0 $"
                    preview="ax² + bx + c = 0"
                  />
                  <ExampleCard
                    title="สูตรแก้สมการ"
                    katex="$ x = \frac{-b \pm \sqrt{b^2-4ac}}{2a} $"
                    preview="x = (-b ± √(b²-4ac))/(2a)"
                  />
                  <ExampleCard
                    title="การแยกตัวประกอบ"
                    katex="$ x^2 - 4 = (x+2)(x-2) $"
                    preview="x² - 4 = (x+2)(x-2)"
                  />
                  <ExampleCard
                    title="ระบบสมการ"
                    katex="$ \begin{cases} x + y = 5 \\ 2x - y = 1 \end{cases} $"
                    preview="{ x + y = 5\n{ 2x - y = 1"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-emerald-400 mb-3">📊 ฟังก์ชันและกราฟ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ExampleCard
                    title="ฟังก์ชันเชิงเส้น"
                    katex="$ f(x) = mx + b $"
                    preview="f(x) = mx + b"
                  />
                  <ExampleCard
                    title="ฟังก์ชันกำลังสอง"
                    katex="$ f(x) = ax^2 + bx + c $"
                    preview="f(x) = ax² + bx + c"
                  />
                  <ExampleCard
                    title="ฟังก์ชันตรีโกณมิติ"
                    katex="$ \sin x, \cos x, \tan x $"
                    preview="sin x, cos x, tan x"
                  />
                  <ExampleCard
                    title="ลิมิต"
                    katex="$ \lim_{x \to 0} \frac{\sin x}{x} = 1 $"
                    preview="lim[x→0] (sin x)/x = 1"
                  />
                </div>
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
                <h4 className="text-lg font-medium text-emerald-400 mb-3">⚗️ โจทย์วิทยาศาสตร์</h4>
                
                <ExampleCard
                  title="โจทย์ฟิสิกส์ - แรง"
                  katex="ถ้าแรง $ F = 50 $ นิวตัน กระทำต่อวัตถุมวล $ m = 10 $ กิโลกรัม จงหาความเร่ง $ a $ โดยใช้สูตร $ F = ma $"
                  preview="ถ้าแรง F = 50 นิวตัน กระทำต่อวัตถุมวล m = 10 กิโลกรัม จงหาความเร่ง a โดยใช้สูตร F = ma"
                />
                
                <ExampleCard
                  title="โจทย์เคมี - สมการ"
                  katex="จงสมดุลสมการเคมี: $ \\text{CH}_4 + \\text{O}_2 \\rightarrow \\text{CO}_2 + \\text{H}_2\\text{O} $"
                  preview="จงสมดุลสมการเคมี: CH₄ + O₂ → CO₂ + H₂O"
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
                      <span className="text-green-300">ถูก:</span> $ \frac{`{1}{2}`} $
                    </p>
                  </div>
                  
                  <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-4">
                    <h5 className="text-red-300 font-medium mb-2">❌ ข้อความไทยผิด</h5>
                    <p className="text-gray-300 text-sm mb-2">สาเหตุ: ไม่ใส่ใน \text{`{}`}</p>
                    <p className="text-gray-300 text-sm">
                      <span className="text-red-300">ผิด:</span> $ เมื่อ x = 5 $<br/>
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

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-slate-600">
          <div className="text-sm text-gray-400">
            กดปุ่ม "คัดลอก" เพื่อคัดลอกโค้ด KaTeX ไปใช้ในระบบ
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
          >
            เข้าใจแล้ว
          </button>
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
        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg"
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