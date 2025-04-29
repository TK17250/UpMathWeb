'use server'
import { createSupabaseServerClient } from "@/server/server";
import sanitizeHtml from 'sanitize-html';

// ฟังก์ชันสำหรับทำความสะอาด HTML ป้องกัน XSS
function sanitizeContent(html: string): string {
    return sanitizeHtml(html, {
        allowedTags: ['a', 'b', 'i', 'u', 'p', 'br', 'span', 'div', 'strong', 'em'],
        allowedAttributes: {
            'a': ['href', 'target', 'rel'],
            'span': ['style'],
            'div': ['style']
        },
        transformTags: {
            'a': (tagName, attribs) => {
                // Add security attributes to external links
                if (attribs.href && (attribs.href.startsWith('http://') || attribs.href.startsWith('https://'))) {
                    return {
                        tagName: 'a',
                        attribs: {
                            ...attribs,
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        }
                    };
                }
                return { tagName, attribs };
            }
        },
        // Only allow http, https and mailto urls
        allowedSchemes: ['http', 'https', 'mailto']
    });
}

// Create news
async function createNews(prevState: any, formData: FormData) {
    try {
        const classid = formData.get("classid") as string;
        const content = formData.get("content") as string;
        if (content == "" || !classid) return { title: "เกิดข้อผิดพลาด", message: "กรุณากรอกเนื้อหา", type: "error" } // Check empty

        const contentSanitized = sanitizeContent(content); // Sanitize HTML

        // Create News
        const supabase = await createSupabaseServerClient(); // Call Supabase
        const { error } = await supabase
            .from("news")
            .insert({
                n_cid: classid,
                n_content: contentSanitized,
            })
        if (error) {
            console.log("เกิดข้อผิดพลาด", error.message);
            return { title: "เกิดข้อผิดพลาด", message: error.message, type: "error" }
        }

        return { title: "สำเร็จ", message: "บันทึกข้อมูลเรียบร้อย", type: "success" }
    } catch (error: any) {
        console.log("เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" }
    }
}

// Get news by class id
async function getNewsByClassId(classid: number) {
    try {
        const supabase = await createSupabaseServerClient(); // Call Supabase
        const { data, error } = await supabase
            .from("news")
            .select("*")
            .eq("n_cid", classid)
            .order("n_time", { ascending: false })
            .limit(10);
        if (error) {
            console.log("เกิดข้อผิดพลาด", error.message);
            return { title: "เกิดข้อผิดพลาด", message: error.message, type: "error" }
        }

        return data;
    } catch (error: any) {
        console.log("เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" }
    }
}

export {
    createNews,
    getNewsByClassId,
};