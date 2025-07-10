'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";
import axios from "axios";

// Generate questions using AI
async function generateQuestions(subject: string, level: string, bloomTaxonomy: string, type: string, totalQuestions: number, content?: string): Promise<any> {
    try {
        const prompt = `สร้างโจทย์คณิตศาสตร์ ${totalQuestions} ข้อ สำหรับระดับ ${level} 
        หัวข้อ: ${subject}
        ประเภท: ${type}
        Bloom's Taxonomy: ${bloomTaxonomy}
        ${content ? `คำอธิบายเพิ่มเติม: ${content}` : ''}
        
        **ข้อกำหนดสำคัญ:**
        1. ใช้ KaTeX สำหรับการแสดงสูตรคณิตศาสตร์ทั้งหมด
        2. AI จะกำหนดคะแนนของแต่ละข้อตามความยาก (1-5 คะแนน)
        3. ใส่คำอธิบายวิธีทำแบบละเอียดเป็นขั้นตอน
        4. ตอบเป็นภาษาไทยเท่านั้น
        5. **ตอบเป็น JSON เท่านั้น ไม่ต้องใส่ข้อความอื่น**
        6. สร้างโจทย์ให้ครอบคลุมระดับขั้นของ Bloom's Taxonomy ที่กำหนด: ${bloomTaxonomy}
        
        **รูปแบบ JSON ที่ต้องการ:**
        {
            "metadata": {
                "total_questions": ${totalQuestions},
                "level": "${level}",
                "subject": "${subject}",
                "type": "${type}",
                "bloom_taxonomy": "${bloomTaxonomy}",
                "created_at": "${new Date().toISOString()}"
            },
            "questions": [
                {
                    "id": 1,
                    "question": "ข้อความโจทย์ในรูปแบบ KaTeX เช่น $\\\\frac{1}{2} + \\\\frac{1}{3} = ?$",
                    "question_type": "multiple_choice",
                    "options": ["$\\\\frac{5}{6}$", "$\\\\frac{2}{5}$", "$\\\\frac{3}{5}$", "$\\\\frac{1}{6}$"],
                    "correct_answer": "$\\\\frac{5}{6}$",
                    "correct_option_index": 0,
                    "explanation": "ขั้นตอนที่ 1: หาตัวคูณร่วมน้อยของ 2 และ 3 ซึ่งคือ 6\\n\\nขั้นตอนที่ 2: แปลงเศษส่วนให้มีตัวส่วนเท่ากัน\\n$\\\\frac{1}{2} = \\\\frac{3}{6}$\\n$\\\\frac{1}{3} = \\\\frac{2}{6}$\\n\\nขั้นตอนที่ 3: บวกเศษส่วน\\n$\\\\frac{3}{6} + \\\\frac{2}{6} = \\\\frac{5}{6}$",
                    "score": 2,
                    "difficulty": "medium",
                    "bloom_level": "เข้าใจ"
                }
            ]
        }
        
        **หมายเหตุ: ตอบเป็น JSON เท่านั้น ไม่ต้องมีข้อความอื่น**`;

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "qwen/qwen3-30b-a3b:free",
                messages: [
                    {
                        role: "system",
                        content: "You are a math teacher assistant. Respond ONLY with valid JSON. Do not include any explanatory text before or after the JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 6000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                    'X-Title': 'UP Math Generator'
                }
            }
        );

        const generatedContent = response.data.choices[0].message.content;
        
        // Try to parse JSON from the response
        let questionsData;
        try {
            // Log the response for debugging
            console.log("AI Response:", generatedContent);
            
            // Try multiple approaches to extract JSON
            let jsonString = generatedContent;
            
            // Remove markdown code blocks if present
            if (jsonString.includes('```')) {
                const codeBlockMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                if (codeBlockMatch) {
                    jsonString = codeBlockMatch[1];
                }
            }
            
            // Extract JSON object from the response
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
            }
            
            // Clean up the JSON string
            jsonString = jsonString.trim();
            
            // Validate that we have a complete JSON object
            if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
                throw new Error("Invalid JSON format - missing braces");
            }
            
            questionsData = JSON.parse(jsonString);
            
            // Validate the structure
            if (!questionsData.questions || !Array.isArray(questionsData.questions) || questionsData.questions.length === 0) {
                throw new Error("Invalid questions structure");
            }
            
            if (!questionsData.metadata) {
                throw new Error("Missing metadata");
            }
            
        } catch (parseError) {
            console.log("Failed to parse AI response as JSON:", parseError);
            console.log("Original response:", generatedContent);
            
            // Try to create a basic fallback structure for debugging
            const fallbackData: any = {
                metadata: {
                    total_questions: totalQuestions,
                    level: level,
                    subject: subject,
                    type: type,
                    bloom_taxonomy: bloomTaxonomy,
                    created_at: new Date().toISOString(),
                    total_score: totalQuestions * 2
                },
                questions: [] as any[]
            };
            
            // Create simple fallback questions
            for (let i = 1; i <= Math.min(totalQuestions, 3); i++) {
                fallbackData.questions.push({
                    id: i,
                    question: `โจทย์ที่ ${i}: กรุณาติดต่อผู้ดูแลระบบ (AI response error)`,
                    question_type: "multiple_choice",
                    options: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
                    correct_answer: "ตัวเลือก 1",
                    correct_option_index: 0,
                    explanation: "เกิดข้อผิดพลาดในการสร้างโจทย์ กรุณาลองใหม่",
                    score: 2,
                    difficulty: "medium"
                });
            }
            
            return {
                title: "เกิดข้อผิดพลาด",
                message: "ไม่สามารถสร้างโจทย์ได้ กรุณาลองใหม่ (การตอบสนองจาก AI ไม่สมบูรณ์)",
                type: "error",
                fallbackData: fallbackData
            };
        }

        // Calculate total score from individual questions
        const totalScore = questionsData.questions.reduce((sum: number, q: any) => {
            const score = typeof q.score === 'number' ? q.score : 2; // Default to 2 if not a number
            return sum + score;
        }, 0);
        questionsData.metadata.total_score = Math.round(totalScore * 100) / 100;

        return questionsData;
    } catch (error: any) {
        console.log("Error generating questions:", error.message);
        return {
            title: "เกิดข้อผิดพลาด",
            message: "ไม่สามารถเชื่อมต่อกับระบบสร้างโจทย์ได้",
            type: "error"
        };
    }
}

// Create homework
async function createHomework(prevState: any, formData: FormData): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const name = formData.get("h_name") as string;
        let subject = formData.get("h_subject") as string;
        const bloomtax = formData.get("h_bloomtax") as string;
        let type = formData.get("h_type") as string;
        const totalQuestions = formData.get("h_total_questions") as string;
        const level = formData.get("h_level") as string;
        const content = formData.get("h_content") as string;

        // Parse multiple Bloom's Taxonomy values
        const bloomTaxonomies = bloomtax ? bloomtax.split(',').map(b => b.trim()).filter(b => b.length > 0) : [];

        // Subject and type validation for default values
        if (!subject || !type) {
            subject = "พีชคณิต";
            type = "แบบฝึกหัด";
        }

        // Check empty fields
        if (!name || !subject || bloomTaxonomies.length === 0 || !type || !totalQuestions) {
            console.log("Empty fields detected:", { name, subject, bloomTaxonomies, type, totalQuestions });
            return {
                title: "เกิดข้อผิดพลาด",
                message: "กรุณากรอกข้อมูลให้ครบถ้วน",
                type: "error",
            };
        }

        // Validate total questions
        const totalQuestionsNumber = parseInt(totalQuestions);
        if (isNaN(totalQuestionsNumber) || totalQuestionsNumber <= 0) {
            return {
                title: "เกิดข้อผิดพลาด",
                message: "กรุณากรอกจำนวนข้อที่ถูกต้อง",
                type: "error",
            };
        }

        // Get teacher data
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // If content is already a questions object (from the questions preview modal), save it directly
        if (content && content.trim()) {
            let questionsData;
            try {
                questionsData = JSON.parse(content);
                if (questionsData.questions && questionsData.metadata) {
                    // This is already processed questions data, save it
                    const { error: homeworkError } = await supabase
                        .from("homework")
                        .insert({
                            h_name: name,
                            h_temail: userData.t_email,
                            h_subject: subject,
                            h_bloom_taxonomy: bloomTaxonomies.join(', '),
                            h_type: type,
                            h_score: Math.round(questionsData.metadata.total_score),
                            h_content: questionsData,
                        })
                        .select()
                        .single();
                        
                    if (homeworkError) return { title: "เกิดข้อผิดพลาด", message: homeworkError.message, type: "error" };

                    return {
                        title: "สำเร็จ",
                        message: "บันทึกชุดฝึกเรียบร้อยแล้ว",
                        type: "success",
                    };
                }
            } catch (e) {
                // Content is not JSON, continue with generation
            }
        }

        // Generate questions with AI
        const generatedQuestions = await generateQuestions(subject, level || "ไม่ระบุ", bloomTaxonomies.join(', '), type, totalQuestionsNumber, content);
        
        if (generatedQuestions.type === "error") {
            return generatedQuestions;
        }

        // Save directly to database
        const { error: homeworkError } = await supabase
            .from("homework")
            .insert({
                h_name: name,
                h_temail: userData.t_email,
                h_subject: subject,
                h_bloom_taxonomy: bloomTaxonomies.join(', '),
                h_type: type,
                h_score: Math.round(generatedQuestions.metadata.total_score),
                h_content: generatedQuestions,
            })
            .select()
            .single();
            
        if (homeworkError) return { title: "เกิดข้อผิดพลาด", message: homeworkError.message, type: "error" };

        // Return questions data for preview
        return {
            title: "สำเร็จ",
            message: "สร้างและบันทึกชุดฝึกด้วย AI เรียบร้อยแล้ว",
            type: "success",
            questionsData: generatedQuestions,
        };
    } catch (error: any) {
        console.log(`เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์: ${error.message}`);
        return { title: "เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์", message: "กรุณาลองใหม่ภายหลัง", type: "error" };
    }
}

// Update homework
async function updateHomework(homeworkId: number, questionsData: any): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Update homework in database
        const { error: updateError } = await supabase
            .from("homework")
            .update({
                h_content: questionsData,
                h_score: Math.round(questionsData.metadata.total_score),
            })
            .eq("h_id", homeworkId)
            .eq("h_temail", userData.t_email);

        if (updateError) return { title: "เกิดข้อผิดพลาด", message: updateError.message, type: "error" };

        return {
            title: "สำเร็จ",
            message: "อัพเดตชุดฝึกเรียบร้อยแล้ว",
            type: "success",
        };
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// // Get homework list
async function getHomework() {
    try {
        const supabase = await createSupabaseServerClient(); // Call Supabase
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Get homework data
        const { data: homeworkData, error: homeworkError } = await supabase
            .from("homework")
            .select("*")
            .eq("h_temail", userData.t_email)
            .order("h_id", { ascending: false });
        if (homeworkError) return { title: "เกิดข้อผิดพลาด", message: homeworkError.message, type: "error" };

        return homeworkData;
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// // Delete homework
// async function deleteHomework(homeworkId: number) {
//     try {
//         const supabase = await createSupabaseServerClient();
//         const userData = await getUserData();
//         if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

//         // First, get the homework to check if it exists
//         const { data: homework, error: fetchError } = await supabase
//             .from("homework")
//             .select("h_id")
//             .eq("h_id", homeworkId)
//             .eq("h_temail", userData.t_email)
//             .single();
        
//         if (fetchError) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบการบ้านที่ต้องการลบ", type: "error" };

//         // Delete homework from database
//         const { error: deleteError } = await supabase
//             .from("homework")
//             .delete()
//             .eq("h_id", homeworkId)
//             .eq("h_temail", userData.t_email);
        
//         if (deleteError) return { title: "เกิดข้อผิดพลาด", message: deleteError.message, type: "error" };

//         return { title: "สำเร็จ", message: "ลบการบ้านเรียบร้อยแล้ว", type: "success" };
//     } catch (error: any) {
//         console.log("Server error: ", error.message);
//         return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
//     }
// }

export {
    createHomework,
    getHomework,
    generateQuestions,
    updateHomework,
    // deleteHomework,
}
