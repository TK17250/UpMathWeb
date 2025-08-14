'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";
import axios from "axios";
import fs from 'fs';
import path from 'path';

// RunPod Configuration
const RUNPOD_URL = "https://api.runpod.ai/v2/57uty6p5a5zfdt";
const HEADERS = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.RUNPOD_API_KEY}`
};

const SYSTEM_PROMPT = fs.readFileSync(path.join(process.cwd(), 'system_prompt.txt'), 'utf8');

const ADDITIONAL_REQUIREMENTS = "โจทย์จำเป็นต้องมีคำตอบ และถ้าโจทย์เป็นแบบ multiple choice (ปรนัย) ต้องมีคำตอบหลอกจำนวน 3 ข้อ (ทั้งหมด หลอก + จริง มี 4 ข้อ) โดยมาจากการคำนวนที่ผิดพลาด";

// Define types for the API response
interface RunpodChoice {
    tokens: string[];
}

interface RunpodOutput {
    choices: RunpodChoice[];
}


// Function to shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Function to randomize choices in questions
function randomizeChoices(questions: any[]): any[] {
    return questions.map(question => {
        if (question.question_type === 'multiple_choice' && 
            question.options && 
            Array.isArray(question.options) && 
            question.options.length > 0 &&
            typeof question.correct_option_index === 'number' &&
            question.correct_option_index >= 0) {
            
            const correctAnswer = question.options[question.correct_option_index];
            const shuffledOptions = shuffleArray(question.options);
            const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
            
            return {
                ...question,
                options: shuffledOptions,
                correct_option_index: newCorrectIndex,
                correct_answer: correctAnswer
            };
        }
        
        return question;
    });
}

// Create user prompt for RunPod
function createUserPrompt(topic: string, gradeLevel: string, questionType: string, difficulty: string, bloomLevels: string[], additionalRequirements: string = ADDITIONAL_REQUIREMENTS): string {
    const bloomStr = bloomLevels.join(", ");
    const prompt = `จงสร้างโจทย์คณิตศาสตร์คุณภาพสูงโดยกำหนดให้
1. หัวข้อ: ${topic}
2. สำหรับนักเรียน: ${gradeLevel}
3. รูปแบบ: ${questionType}
4. ความยาก: ${difficulty}
5. bloom level: ${bloomStr}
6. จำนวน: 1 ข้อ
7. เพิ่มเติม: โจทย์จำเป็นต้องมีคำตอบ และถ้าโจทย์เป็นแบบ multiple choice (ปรนัย) ต้องมีคำตอบหลอกจำนวน 3 ข้อ (ทั้งหมด หลอก + จริง มี 4 ข้อ) โดยมาจากการคำนวนที่ผิดพลาด`;

    return prompt;
}

// Call RunPod API
async function callRunpodApi(userPrompt: string, systemPrompt: string = SYSTEM_PROMPT): Promise<string | null> {
    try {
        const data = {
            input: {
                prompt: `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`,
                sampling_params: { max_tokens: 9216 }
            }
        };

        console.log(`System prompt : ${systemPrompt}`);
        console.log(`User prompt : ${userPrompt}`);

        const response = await axios.post(`${RUNPOD_URL}/runsync`, data, { headers: HEADERS });
        
        if (response.status === 200) {
            console.log('RunPod response:', response.data);
            return response.data?.id || null;
        }
        return null;
    } catch (error) {
        console.error('Error calling RunPod API:', error);
        return null;
    }
}

// Poll RunPod result
async function pollRunpodResult(runId: string, pollInterval: number = 2, timeout: number = 180): Promise<any | null> {
    const url = `${RUNPOD_URL}/status/${runId}`;
    const start = Date.now();

    while (true) {
        try {
            const response = await axios.post(url, {}, { headers: HEADERS });

            if (response.status === 200) {
                const result = response.data;
                const status = result?.status;
                
                if (status === "COMPLETED") {
                    console.log('RunPod result:', result);
                    return result;
                }
                if (status === "FAILED" || status === "CANCELLED") {
                    return null;
                }
            }

            if (Date.now() - start > timeout * 1000) {
                return null;
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
        } catch (error) {
            console.error('Error polling RunPod result:', error);
            return null;
        }
    }
}

// Extract content and remove thinking
function extractContent(outputStr: string | RunpodOutput): string {
    let content = "";
    
    // Handle the case where outputStr is from the API response structure
    if (typeof outputStr === 'object' && outputStr !== null) {
        // If it's the full API response, extract the tokens
        const apiResponse = outputStr as RunpodOutput;
        if (apiResponse.choices && apiResponse.choices[0] && apiResponse.choices[0].tokens) {
            const tokens = apiResponse.choices[0].tokens;
            if (Array.isArray(tokens) && tokens.length > 0) {
                content = tokens[0]; // Get the first token which contains the response
            }
        }
    } else if (typeof outputStr === 'string') {
        content = outputStr;
    }
    
    // Remove <think> blocks completely
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // Extract questions section
    if (content.includes("<questions>")) {
        const questionsStart = content.indexOf("<questions>");
        const questionsEnd = content.indexOf("</questions>") + "</questions>".length;
        if (questionsEnd > questionsStart) {
            content = content.substring(questionsStart, questionsEnd);
        } else {
            // If no closing tag, take from <questions> to end
            content = content.substring(questionsStart);
            // Add closing tag if missing
            if (!content.includes("</questions>")) {
                content += "</questions>";
            }
        }
        content = content.replace(/\n/g, " ").trim();
    }
    
    return content;
}

// Parse XML to JSON
function parseXmlToJson(xmlContent: string): any {
    try {
        console.log('Parsing XML content:', xmlContent);
        // Simple XML parsing for the specific structure
        const questionMatch = xmlContent.match(/<question>([\s\S]*?)<\/question>/);
        if (!questionMatch) return null;

        const questionContent = questionMatch[1];
        
        // Extract fields
        const text = questionContent.match(/<text>([\s\S]*?)<\/text>/)?.[1]?.trim() || "";
        const type = questionContent.match(/<type>([\s\S]*?)<\/type>/)?.[1]?.trim() || "multiple_choice";
        
        // Extract options
        const optionsMatch = questionContent.match(/<options>([\s\S]*?)<\/options>/);
        const options: string[] = [];
        let correctOptionIndex = -1;
        
        if (optionsMatch) {
            const optionMatches = optionsMatch[1].match(/<option>([\s\S]*?)<\/option>/g);
            if (optionMatches) {
                optionMatches.forEach(match => {
                    const option = match.replace(/<\/?option>/g, '').trim();
                    options.push(option);
                });
            }
        }
        
        const correctAnswer = questionContent.match(/<correct_answer>([\s\S]*?)<\/correct_answer>/)?.[1]?.trim() || "";
        if (correctAnswer && options.length > 0) {
            correctOptionIndex = options.findIndex(opt => opt === correctAnswer);
        }
        
        let explanation = questionContent.match(/<explanation>([\s\S]*?)<\/explanation>/)?.[1]?.trim() || "";
        // Only replace <br> tags if they exist, otherwise leave explanation as is
        if (explanation.includes('<br>')) {
        explanation = explanation.replace(/<br>/g, '\n');
        }
        
        const score = parseInt(questionContent.match(/<score>([\s\S]*?)<\/score>/)?.[1]?.trim() || "2");
        const difficulty = questionContent.match(/<difficulty>([\s\S]*?)<\/difficulty>/)?.[1]?.trim() || "medium";
        
        // Extract bloom levels
        const bloomLevelsMatch = questionContent.match(/<bloom_levels>([\s\S]*?)<\/bloom_levels>/);
        let bloomLevel = "เข้าใจ";
        if (bloomLevelsMatch) {
            const levelMatch = bloomLevelsMatch[1].match(/<level>([\s\S]*?)<\/level>/);
            if (levelMatch) {
                bloomLevel = levelMatch[1].trim();
            }
        }

        return {
            question: text,
            question_type: type,
            options: options,
            correct_answer: correctAnswer,
            correct_option_index: correctOptionIndex,
            explanation: explanation,
            score: score,
            difficulty: difficulty,
            bloom_level: bloomLevel
        };
    } catch (error) {
        console.error('Error parsing XML to JSON:', error);
        return null;
    }
}

// Updated generateQuestions function with proper result processing
async function generateQuestions(
    subject: string, 
    level: string, 
    bloomTaxonomy: string, 
    type: string, 
    totalQuestions: number, 
    content?: string
): Promise<any> {
    try {
        const bloomLevels = bloomTaxonomy.split(',').map(b => b.trim());
        const maxWorkers = 3; // Use only 3 workers
        const questions: any[] = [];
        
        // Distribute questions across workers
        const batches = [];
        for (let i = 0; i < totalQuestions; i += maxWorkers) {
            const batchSize = Math.min(maxWorkers, totalQuestions - i);
            batches.push(batchSize);
        }
        
        let questionId = 1;
        
        // Process each batch
        for (const batchSize of batches) {
            const promises = [];
            
            // Send requests to workers
            for (let j = 0; j < batchSize; j++) {
                const userPrompt = createUserPrompt(
                    subject, 
                    level || "ไม่ระบุ", 
                    type, 
                    "ยาก", 
                    bloomLevels,
                    content || ADDITIONAL_REQUIREMENTS
                );
                
                promises.push(callRunpodApi(userPrompt));
            }
            
            // Wait for all requests to be submitted
            const runIds = await Promise.all(promises);
            
            // Poll for results
            const pollPromises = runIds.map(runId => 
                runId ? pollRunpodResult(runId) : Promise.resolve(null)
            );
            
            const results = await Promise.all(pollPromises);
            console.log("Results:", results);

            // Process results
            for (const result of results) {
                if (result && result.output && Array.isArray(result.output) && result.output.length > 0) {
                    // Extract the actual response from the API structure
                    const apiResponse = result.output[0]; // First item in output array
                    console.log('API Response:', apiResponse);
                    
                    const content = extractContent(apiResponse);
                    console.log('Extracted content:', content);
                    
                    const questionData = parseXmlToJson(content);
                    console.log('Parsed question data:', questionData);
                    
                    if (questionData) {
                        questions.push({
                            id: questionId++,
                            ...questionData
                        });
                    }
                }
            }
        }
        
        // Create fallback questions if needed
        while (questions.length < totalQuestions) {
            questions.push({
                id: questionId++,
                question: `โจทย์ที่ ${questionId - 1}: กรุณาติดต่อผู้ดูแลระบบ (AI response error)`,
                question_type: "multiple_choice",
                options: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
                correct_answer: "ตัวเลือก 1",
                correct_option_index: 0,
                explanation: "เกิดข้อผิดพลาดในการสร้างโจทย์ กรุณาลองใหม่",
                score: 2,
                difficulty: "medium",
                bloom_level: "เข้าใจ"
            });
        }
        
        // Randomize choices
        const randomizedQuestions = randomizeChoices(questions.slice(0, totalQuestions));
        
        // Calculate total score
        const totalScore = randomizedQuestions.reduce((sum, q) => sum + (q.score || 2), 0);
        
        const questionsData = {
            metadata: {
                total_questions: totalQuestions,
                level: level,
                subject: subject,
                type: type,
                bloom_taxonomy: bloomTaxonomy,
                created_at: new Date().toISOString(),
                total_score: totalScore
            },
            questions: randomizedQuestions
        };
        
        return questionsData;
    } catch (error: any) {
        console.error("Error generating questions:", error.message);
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

        const bloomTaxonomies = bloomtax ? bloomtax.split(',').map(b => b.trim()).filter(b => b.length > 0) : [];

        if (!subject || !type) {
            subject = "พีชคณิต";
            type = "ปรนัย";
        }

        if (!name || !subject || bloomTaxonomies.length === 0 || !type || !totalQuestions) {
            return {
                title: "เกิดข้อผิดพลาด",
                message: "กรุณากรอกข้อมูลให้ครบถ้วน",
                type: "error",
            };
        }

        const totalQuestionsNumber = parseInt(totalQuestions);
        if (isNaN(totalQuestionsNumber) || totalQuestionsNumber <= 0) {
            return {
                title: "เกิดข้อผิดพลาด",
                message: "กรุณากรอกจำนวนข้อที่ถูกต้อง",
                type: "error",
            };
        }

        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Check if content is already processed questions data
        if (content && content.trim()) {
            try {
                const questionsData = JSON.parse(content);
                if (questionsData.questions && questionsData.metadata) {
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

        // Generate questions with RunPod
        const generatedQuestions = await generateQuestions(
            subject, 
            level || "ไม่ระบุ", 
            bloomTaxonomies.join(', '), 
            type, 
            totalQuestionsNumber, 
            content
        );
        
        if (generatedQuestions.type === "error") {
            return generatedQuestions;
        }

        // Save to database
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

        return {
            title: "สำเร็จ",
            message: "สร้างและบันทึกชุดฝึกด้วย AI เรียบร้อยแล้ว",
            type: "success",
            questionsData: generatedQuestions,
        };
    } catch (error: any) {
        console.error(`Server error: ${error.message}`);
        return { title: "เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์", message: "กรุณาลองใหม่ภายหลัง", type: "error" };
    }
}

// Update homework
async function updateHomework(homeworkId: number, questionsData: any): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Randomize choices before updating
        if (questionsData.questions && Array.isArray(questionsData.questions)) {
            questionsData.questions = randomizeChoices(questionsData.questions);
        }

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

// Get homework details form id
async function getHomeworkDetails(homeworkId: number) {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();

        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" }; // Ensure user data is available

        // Fetch homework details
        const { data: homework, error: homeworkError } = await supabase
            .from("homework")
            .select("*")
            .eq("h_id", homeworkId)
            .eq("h_temail", userData.t_email)
            .single();

        if (homeworkError) {
            console.error("Homework fetch error:", homeworkError);
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: `ไม่สามารถดึงข้อมูลชุดฝึกได้: ${homeworkError.message}`, 
                type: "error" 
            };
        }

        if (!homework) {
            return { title: "ไม่พบชุดฝึก", message: "ไม่พบข้อมูลชุดฝึกที่ต้องการ", type: "error" };
        }

        // Randomize choices each time homework is retrieved
        const homeworkContent = homework.h_content;
        if (homeworkContent && homeworkContent.questions && Array.isArray(homeworkContent.questions)) {
            homeworkContent.questions = randomizeChoices(homeworkContent.questions);
        }

        return homeworkContent;
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Delete homework with active check
async function deleteHomework(prevState: any, formData: FormData): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        const homeworkId = parseInt(formData.get("homeworkId") as string);
        
        if (isNaN(homeworkId)) {
            return { title: "เกิดข้อผิดพลาด", message: "ข้อมูลไม่ถูกต้อง", type: "error" };
        }

        // First, check if homework is being used in actives table
        const { data: actives, error: activesError } = await supabase
            .from("actives")
            .select("a_id, a_homework")
            .or(`a_homework->>id.eq.${homeworkId}`);

        // If there's an error but it's because the table doesn't exist, continue
        if (activesError && !activesError.message.includes('does not exist')) {
            console.error("Error checking actives:", activesError);
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ไม่สามารถตรวจสอบสถานะการใช้งานได้", 
                type: "error" 
            };
        }

        // Filter actives that actually contain this homework
        const filteredActives = actives?.filter(active => {
            if (typeof active.a_homework === 'number') {
                return active.a_homework === homeworkId;
            } else if (typeof active.a_homework === 'object' && active.a_homework !== null) {
                return (active.a_homework as any).id === homeworkId;
            }
            return false;
        }) || [];

        // If homework is being used, prevent deletion
        if (filteredActives.length > 0) {
            return { 
                title: "ไม่สามารถลบได้", 
                message: "ชุดฝึกนี้กำลังถูกใช้งานในห้องเรียน กรุณาเอาออกจากห้องเรียนก่อนลบ", 
                type: "error" 
            };
        }

        // Check if homework exists and belongs to teacher
        const { data: homework, error: fetchError } = await supabase
            .from("homework")
            .select("h_id, h_name")
            .eq("h_id", homeworkId)
            .eq("h_temail", userData.t_email)
            .single();
        
        if (fetchError) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบการบ้านที่ต้องการลบ", type: "error" };

        // Delete homework from database
        const { error: deleteError } = await supabase
            .from("homework")
            .delete()
            .eq("h_id", homeworkId)
            .eq("h_temail", userData.t_email);
        
        if (deleteError) return { title: "เกิดข้อผิดพลาด", message: deleteError.message, type: "error" };

        return { title: "สำเร็จ", message: `ลบชุดฝึก "${homework.h_name}" เรียบร้อยแล้ว`, type: "success" };
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Check if homework is being used in actives table
async function checkHomeworkActive(homeworkId: number) {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        
        if (!userData) {
            return { isActive: false, classNames: [] };
        }

        // Check if homework is being used in actives table
        const { data: actives, error: activesError } = await supabase
            .from('actives')
            .select(`*`)
            .or(`a_homework->>id.eq.${homeworkId}`)
            .eq('a_temail', userData.t_email);

        if (activesError) {
            console.error('Error checking actives:', activesError);
            // If table doesn't exist or other error, assume not active
            return { isActive: false, classNames: [] };
        }

        // Filter actives that actually contain this homework
        const filteredActives = actives?.filter(active => {
            if (typeof active.a_homework === 'number') {
                return active.a_homework === homeworkId;
            } else if (typeof active.a_homework === 'object' && active.a_homework !== null) {
                return (active.a_homework as any).id === homeworkId;
            }
            return false;
        }) || [];

        const isActive = filteredActives.length > 0;
        
        // Get unique class names
        const classNames = isActive 
            ? [...new Set(filteredActives.map(active => (active as any)?.c_name).filter(Boolean))]
            : [];

        return {
            isActive,
            classNames,
            activeCount: filteredActives.length
        };

    } catch (error) {
        console.error('Error in checkHomeworkActive:', error);
        return { isActive: false, classNames: [] };
    }
}

export {
    createHomework,
    getHomework,
    generateQuestions,
    updateHomework,
    getHomeworkDetails,
    deleteHomework,
    checkHomeworkActive,
    randomizeChoices
}
