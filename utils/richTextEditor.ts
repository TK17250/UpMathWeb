/**
 * ฟังก์ชันสำหรับจัดรูปแบบข้อความในตัวแก้ไข Rich Text
 * @param command คำสั่งสำหรับการจัดรูปแบบข้อความ
 */
export function formatText(command: string): void {
    document.execCommand(command, false, undefined);
    const editor = document.getElementById('editor');
    if (editor) {
        editor.focus();
        updateHiddenInput(editor);
    }
}

/**
 * ฟังก์ชันสำหรับแทรกลิงก์ในตัวแก้ไข Rich Text
 */
export function insertLink(): void {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const selection = window.getSelection();
    if (!selection) return;
    
    // ถ้ามีการเลือกข้อความไว้
    if (selection.toString().length > 0) {
        const url = prompt('กรุณาใส่ URL:', 'https://');
        if (url) {
            document.execCommand('createLink', false, url);
            updateHiddenInput(editor);
        }
    } else {
        // ถ้าไม่มีการเลือกข้อความ
        const url = prompt('กรุณาใส่ URL:', 'https://');
        const linkText = prompt('กรุณาใส่ข้อความลิงก์:', 'ลิงก์');
        
        if (url && linkText) {
            // สร้าง element a และแทรกในตำแหน่งที่ cursor อยู่
            const link = document.createElement('a');
            link.href = url;
            link.textContent = linkText;
            link.target = '_blank';
            
            // แทรกที่ตำแหน่ง cursor
            const range = selection.getRangeAt(0);
            range.insertNode(link);
            
            // เลื่อน cursor ไปต่อจากลิงก์
            range.setStartAfter(link);
            range.setEndAfter(link);
            selection.removeAllRanges();
            selection.addRange(range);
            
            updateHiddenInput(editor);
        }
    }
}

/**
 * อัพเดท hidden input เพื่อเก็บค่า HTML
 * @param editorElement element ของตัวแก้ไข Rich Text
 */
export function updateHiddenInput(editorElement: HTMLElement): void {
    const contentInput = document.getElementById('content-input') as HTMLInputElement;
    if (contentInput) {
        contentInput.value = editorElement.innerHTML;
    }
}

/**
 * ฟังก์ชันสำหรับเริ่มต้นตัวแก้ไข Rich Text
 */
export function initRichTextEditor(): void {
    if (typeof window === 'undefined') return; // ตรวจสอบว่าอยู่ฝั่ง client เท่านั้น
    
    document.addEventListener('DOMContentLoaded', function() {
        const editor = document.getElementById('editor');
        if (editor) {
            editor.addEventListener('focus', function() {
                if (editor.innerHTML === '<p>แจ้งบางสิ่งกับชั้นเรียนของคุณ...</p>') {
                    editor.innerHTML = '';
                }
            });
            
            editor.addEventListener('blur', function() {
                if (editor.innerHTML === '') {
                    editor.innerHTML = '<p>แจ้งบางสิ่งกับชั้นเรียนของคุณ...</p>';
                }
            });
            
            // เริ่มต้นด้วยข้อความแนะนำ
            editor.innerHTML = '<p>แจ้งบางสิ่งกับชั้นเรียนของคุณ...</p>';
        }
    });
    
    // สไตล์เพิ่มเติมสำหรับลิงก์
    const addEditorStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            #editor a {
                color: #80ED99;
                text-decoration: underline;
            }
            .news-content a {
                color: #80ED99;
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);
    };
    
    // เรียกฟังก์ชันเพิ่มสไตล์
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addEditorStyles);
        } else {
            addEditorStyles();
        }
    }
}