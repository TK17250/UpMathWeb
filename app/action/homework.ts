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

interface QuestionData {
    id: number;
    question: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    correct_option_index: number;
    explanation: string;
    score: number;
    difficulty: string;
    bloom_level: string;
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
function randomizeChoices(questions: QuestionData[]): QuestionData[] {
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

// Modified createUserPrompt function to use all bloom levels in each question
function createUserPrompt(
    topic: string, 
    gradeLevel: string, 
    questionType: string, 
    difficulty: string, 
    bloomLevels: string[], // This will now contain ALL selected bloom levels
    additionalRequirements: string = ADDITIONAL_REQUIREMENTS
): string {
    const bloomStr = bloomLevels.join(", ");
    const prompt = `จงสร้างโจทย์คณิตศาสตร์คุณภาพสูงโดยกำหนดให้
1. หัวข้อ: ${topic}
2. สำหรับนักเรียน: ${gradeLevel}
3. รูปแบบ: ${questionType}
4. ระดับความยาก: ${difficulty}
5. bloom level: ${bloomStr} (ใช้ทุกระดับที่กำหนดในโจทย์นี้)
6. จำนวน: 1 ข้อ
7. เพิ่มเติม: ${additionalRequirements}

หมายเหตุ: โจทย์ที่สร้างต้องครอบคลุมทุกระดับ bloom taxonomy ที่กำหนด (${bloomStr}) ในคำถามเดียว`;

    return prompt;
}

// Call RunPod API with better error handling and circuit breaker pattern
async function callRunpodApi(userPrompt: string, systemPrompt: string = SYSTEM_PROMPT, retries: number = 2): Promise<string | null> {
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const data = {
                input: {
                    prompt: `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`,
                    sampling_params: { max_tokens: 9216 }
                }
            };

            console.log(`API attempt ${attempt + 1}/${retries + 1}: System prompt length: ${systemPrompt.length} chars`);

            const response = await axios.post(`${RUNPOD_URL}/runsync`, data, { 
                headers: HEADERS,
                timeout: 420000 // Increased to 7 minutes
            });
            
            if (response.status === 200 && response.data?.id) {
                console.log(`✅ RunPod API call successful (attempt ${attempt + 1}), run ID: ${response.data.id}`);
                return response.data.id;
            }
            
            console.warn(`⚠️ RunPod API returned status ${response.status} on attempt ${attempt + 1}`);
            lastError = new Error(`API returned status ${response.status}`);
        } catch (error: any) {
            lastError = error;
            console.error(`❌ RunPod API error on attempt ${attempt + 1}:`, error.message);
            
            // Don't retry on authentication errors
            if (error.response?.status === 401 || error.response?.status === 403) {
                break;
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < retries) {
                const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    console.error(`❌ All RunPod API attempts failed:`, lastError?.message);
    return null;
}

// Extract content and remove thinking
function extractContent(outputStr: string | RunpodOutput): string {
    let content = "";
    
    // Handle the case where outputStr is from the API response structure
    if (typeof outputStr === 'object' && outputStr !== null) {
        const apiResponse = outputStr as RunpodOutput;
        if (apiResponse.choices && apiResponse.choices[0] && apiResponse.choices[0].tokens) {
            const tokens = apiResponse.choices[0].tokens;
            if (Array.isArray(tokens) && tokens.length > 0) {
                content = tokens[0];
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
            content = content.substring(questionsStart);
            if (!content.includes("</questions>")) {
                content += "</questions>";
            }
        }
        content = content.replace(/\n/g, " ").trim();
    }
    
    return content;
}

// Parse XML to JSON with better error handling
function parseXmlToJson(xmlContent: string): QuestionData | null {
    try {
        console.log('Parsing XML content length:', xmlContent.length);
        
        const questionMatch = xmlContent.match(/<question>([\s\S]*?)<\/question>/);
        if (!questionMatch) {
            console.error('No question tag found in XML');
            return null;
        }

        const questionContent = questionMatch[1];
        
        // Extract fields with better defaults
        const text = questionContent.match(/<text>([\s\S]*?)<\/text>/)?.[1]?.trim() || "";
        const type = questionContent.match(/<type>([\s\S]*?)<\/type>/)?.[1]?.trim() || "multiple_choice";
        
        // Extract options
        const optionsMatch = questionContent.match(/<options>([\s\S]*?)<\/options>/);
        const options: string[] = [];
        
        if (optionsMatch) {
            const optionMatches = optionsMatch[1].match(/<option>([\s\S]*?)<\/option>/g);
            if (optionMatches) {
                optionMatches.forEach(match => {
                    const option = match.replace(/<\/?option>/g, '').trim();
                    if (option) options.push(option);
                });
            }
        }
        
        const correctAnswer = questionContent.match(/<correct_answer>([\s\S]*?)<\/correct_answer>/)?.[1]?.trim() || "";
        let correctOptionIndex = -1;
        if (correctAnswer && options.length > 0) {
            correctOptionIndex = options.findIndex(opt => opt === correctAnswer);
        }
        
        let explanation = questionContent.match(/<explanation>([\s\S]*?)<\/explanation>/)?.[1]?.trim() || "";
        if (explanation.includes('<br>') || explanation.includes('<br />') || explanation.includes('<br/>')) {
            explanation = explanation.replace(/<br\s*\/?>/g, '\n');
        }
        
        const score = parseInt(questionContent.match(/<score>([\s\S]*?)<\/score>/)?.[1]?.trim() || "2");
        const difficulty = questionContent.match(/<difficulty>([\s\S]*?)<\/difficulty>/)?.[1]?.trim() || "ปานกลาง";
        
        // Extract bloom levels
        const bloomLevelsMatch = questionContent.match(/<bloom_levels>([\s\S]*?)<\/bloom_levels>/);
        let bloomLevel = "เข้าใจ";
        if (bloomLevelsMatch) {
            const levelMatch = bloomLevelsMatch[1].match(/<level>([\s\S]*?)<\/level>/);
            if (levelMatch) {
                bloomLevel = levelMatch[1].trim();
            }
        }

        // Validate required fields
        if (!text || options.length === 0 || !correctAnswer || correctOptionIndex === -1) {
            console.error('Invalid question data:', { text: !!text, optionsCount: options.length, correctAnswer: !!correctAnswer, correctOptionIndex });
            return null;
        }

        return {
            id: 0, // Will be set later
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
    } catch (error: any) {
        console.error('Error parsing XML to JSON:', error.message);
        return null;
    }
}

// Improved polling function with better timeout handling
async function pollRunpodResult(runId: string, timeout: number = 600): Promise<any | null> {
    const url = `${RUNPOD_URL}/status/${runId}`;
    const start = Date.now();
    let attemptCount = 0;
    let pollInterval = 3; // Start with 3 seconds
    
    console.log(`🔍 Starting to poll result for run ID: ${runId}`);
    
    while (true) {
        attemptCount++;
        try {
            const response = await axios.post(url, {}, { 
                headers: HEADERS,
                timeout: 600000
            });

            if (response.status === 200) {
                const result = response.data;
                const status = result?.status;
                
                console.log(`Poll attempt ${attemptCount} for ${runId}: ${status}`);
                
                if (status === "COMPLETED") {
                    console.log(`✅ Run ${runId} completed successfully after ${attemptCount} attempts`);
                    return result;
                }
                if (status === "FAILED" || status === "CANCELLED") {
                    console.error(`❌ Run ${runId} failed with status: ${status}`);
                    return null;
                }
                
                // Log progress for IN_QUEUE and IN_PROGRESS
                if (status === "IN_QUEUE" && attemptCount % 5 === 0) {
                    console.log(`⏳ Run ${runId} still in queue after ${attemptCount} attempts`);
                }
                if (status === "IN_PROGRESS" && attemptCount % 3 === 0) {
                    console.log(`⚙️ Run ${runId} processing... (${attemptCount} polls)`);
                }
            }

            // Check timeout
            const elapsed = Date.now() - start;
            if (elapsed > timeout * 1000) {
                console.error(`⏰ Timeout reached for run ID: ${runId} after ${elapsed/1000}s (${attemptCount} attempts)`);
                return null;
            }

            // Adaptive polling interval
            if (attemptCount <= 5) pollInterval = 3;        // First 5 attempts: 3s
            else if (attemptCount <= 15) pollInterval = 5;  // Next 10 attempts: 5s
            else pollInterval = 8;                          // After that: 8s
            
            await new Promise(resolve => setTimeout(resolve, pollInterval * 1000));
            
        } catch (error: any) {
            console.error(`❌ Error polling run ID ${runId} (attempt ${attemptCount}):`, error.message);
            
            // Check overall timeout
            if (Date.now() - start > timeout * 1000) {
                console.error(`⏰ Overall timeout reached for run ID: ${runId} after ${attemptCount} attempts`);
                return null;
            }
            
            // Wait longer on error
            await new Promise(resolve => setTimeout(resolve, 8000));
        }
    }
}

// Improved parallel question generation with better worker distribution
async function generateQuestions(
    subject: string, 
    level: string, 
    bloomTaxonomy: string, 
    difficultyLevels: string,
    type: string, 
    totalQuestions: number, 
    content?: string
): Promise<any> {
    try {
        const bloomLevels = bloomTaxonomy.split(',').map(b => b.trim()).filter(b => b);
        const difficulties = difficultyLevels.split(',').map(d => d.trim()).filter(d => d);
        
        if (bloomLevels.length === 0 || difficulties.length === 0) {
            return {
                type: "error",
                title: "ข้อมูลไม่ถูกต้อง",
                message: "กรุณาระบุระดับความยากและระดับขั้นโจทย์"
            };
        }

        // Fixed: Better worker calculation and distribution
        const MAX_WORKERS = 5; // Your RunPod setup
        const OPTIMAL_CONCURRENT_REQUESTS = Math.min(5, totalQuestions); // Limit to 5 concurrent API calls
        
        const questions: QuestionData[] = [];
        let questionId = 1;
        let totalAttempts = 0;
        const maxAttempts = totalQuestions * 4; // Increased retry limit
        
        console.log(`🚀 Starting generation: ${totalQuestions} questions with max ${OPTIMAL_CONCURRENT_REQUESTS} concurrent requests`);
        console.log(`📊 Difficulties: [${difficulties.join(', ')}], All Bloom levels per question: [${bloomLevels.join(', ')}]`);
        
        // Track failed attempts per difficulty
        const failureTracker = new Map<string, number>();
        
        // Create a queue of all question generation tasks
        const taskQueue: Array<{
            difficulty: string;
            bloomLevels: string[];
            taskId: number;
            retryCount: number; // Track individual task retries
        }> = [];
        
        // Pre-populate task queue with balanced distribution
        for (let i = 0; i < totalQuestions; i++) {
            const selectedDifficulty = difficulties[i % difficulties.length];
            taskQueue.push({
                difficulty: selectedDifficulty,
                bloomLevels: bloomLevels, // Use ALL bloom levels for each question
                taskId: i + 1,
                retryCount: 0
            });
        }
        
        // Shuffle task queue for better distribution
        for (let i = taskQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [taskQueue[i], taskQueue[j]] = [taskQueue[j], taskQueue[i]];
        }
        
        // Worker pool management
        const activeWorkers = new Set<number>();
        const maxRetryPerTask = 3;
        
        while (questions.length < totalQuestions && totalAttempts < maxAttempts && taskQueue.length > 0) {
            // Calculate how many tasks to process in this batch
            const remainingQuestions = totalQuestions - questions.length;
            const availableWorkers = OPTIMAL_CONCURRENT_REQUESTS;
            const tasksToProcess = Math.min(
                availableWorkers,
                remainingQuestions,
                taskQueue.length
            );
            
            console.log(`📦 Batch ${Math.floor(totalAttempts / OPTIMAL_CONCURRENT_REQUESTS) + 1}: Processing ${tasksToProcess} tasks (${questions.length}/${totalQuestions} completed, ${taskQueue.length} in queue)`);
            
            // Take tasks from the front of the queue
            const currentBatch = taskQueue.splice(0, tasksToProcess);
            
            // Filter out tasks that have failed too many times
            const validTasks = currentBatch.filter(task => {
                const combinationKey = task.difficulty;
                const globalFailures = failureTracker.get(combinationKey) || 0;
                
                if (globalFailures >= 5 || task.retryCount >= maxRetryPerTask) {
                    console.warn(`⚠️ Skipping task ${task.taskId} (${combinationKey}) - Global failures: ${globalFailures}, Task retries: ${task.retryCount}`);
                    return false;
                }
                return true;
            });
            
            if (validTasks.length === 0) {
                console.warn('⚠️ No valid tasks in this batch, trying next batch');
                break; // Exit if no valid tasks remain
            }
            
            // Create worker assignments
            const workerTasks = validTasks.map((task, index) => {
                const workerId = index + 1;
                activeWorkers.add(workerId);
                
                const userPrompt = createUserPrompt(
                    subject, 
                    level || "ไม่ระบุ", 
                    type, 
                    task.difficulty,
                    task.bloomLevels,
                    content || ADDITIONAL_REQUIREMENTS
                );
                
                return {
                    workerId,
                    task,
                    userPrompt
                };
            });
            
            console.log(`👥 Assigning ${workerTasks.length} tasks to workers: [${Array.from(activeWorkers).join(', ')}]`);
            
            // Execute API calls with proper error handling
            const apiResults = await Promise.allSettled(
                workerTasks.map(async (workerTask, index) => {
                    // Stagger API calls by 100ms to reduce server load
                    await new Promise(resolve => setTimeout(resolve, index * 100));
                    
                    console.log(`🔄 Worker ${workerTask.workerId} starting task ${workerTask.task.taskId} (${workerTask.task.difficulty} ${workerTask.task.bloomLevels.join(', ')}, attempt ${workerTask.task.retryCount + 1})`);
                    
                    const runId = await callRunpodApi(workerTask.userPrompt);
                    return {
                        runId,
                        workerId: workerTask.workerId,
                        task: workerTask.task
                    };
                })
            );
            
            // Collect valid run IDs and handle failed API calls
            const validRunTasks: Array<{runId: string, workerId: number, task: any}> = [];
            const failedTasks: Array<any> = [];
            
            apiResults.forEach((result, index) => {
                const workerTask = workerTasks[index];
                activeWorkers.delete(workerTask.workerId);
                
                if (result.status === 'fulfilled' && result.value.runId !== null) {
                    validRunTasks.push({
                        runId: result.value.runId,
                        workerId: result.value.workerId,
                        task: result.value.task
                    });
                } else {
                    // Handle failed API call
                    const failedTask = workerTask.task;
                    failedTask.retryCount++;
                    
                    const combinationKey = failedTask.difficulty;
                    failureTracker.set(combinationKey, (failureTracker.get(combinationKey) || 0) + 1);
                    
                    // Re-queue if not exceeded retry limits
                    if (failedTask.retryCount < maxRetryPerTask && (failureTracker.get(combinationKey) || 0) < 5) {
                        failedTasks.push(failedTask);
                    }
                    
                    console.warn(`❌ Worker ${workerTask.workerId} API call failed for task ${failedTask.taskId} (retry ${failedTask.retryCount}/${maxRetryPerTask})`);
                }
            });
            
            // Re-queue failed tasks
            taskQueue.push(...failedTasks);
            
            if (validRunTasks.length === 0) {
                console.error('❌ No valid run IDs received from batch');
                totalAttempts += tasksToProcess;
                continue;
            }
            
            console.log(`🔄 Received ${validRunTasks.length}/${tasksToProcess} valid run IDs, polling results...`);
            
            // Poll results with staggered timing
            const pollResults = await Promise.allSettled(
                validRunTasks.map(async (runTask, index) => {
                    // Stagger polling start by 300ms intervals
                    await new Promise(resolve => setTimeout(resolve, index * 300));
                    
                    console.log(`🔍 Worker ${runTask.workerId} polling task ${runTask.task.taskId}...`);
                    const result = await pollRunpodResult(runTask.runId, 600); // 10 minute timeout
                    
                    return {
                        result,
                        workerId: runTask.workerId,
                        task: runTask.task,
                        runId: runTask.runId
                    };
                })
            );
            
            // Process results
            let successCount = 0;
            let failureCount = 0;
            
            for (const pollResult of pollResults) {
                if (pollResult.status === 'fulfilled') {
                    const { result, workerId, task, runId } = pollResult.value;
                    const combinationKey = task.difficulty;
                    
                    if (result && result.output && Array.isArray(result.output) && result.output.length > 0) {
                        try {
                            const apiResponse = result.output[0];
                            const extractedContent = extractContent(apiResponse);
                            const questionData = parseXmlToJson(extractedContent);
                            
                            if (questionData) {
                                questionData.id = questionId++;
                                questionData.difficulty = task.difficulty;
                                questionData.bloom_level = task.bloomLevels.join(', ');
                                
                                questions.push(questionData);
                                successCount++;
                                console.log(`✅ Worker ${workerId} completed task ${task.taskId}: question ${questionData.id} (${task.difficulty}, ${task.bloomLevels.join(', ')})`);
                            } else {
                                console.warn(`❌ Worker ${workerId} failed to parse task ${task.taskId}`);
                                handleTaskFailure(task, combinationKey, failureTracker, taskQueue, maxRetryPerTask);
                                failureCount++;
                            }
                        } catch (error: any) {
                            console.error(`❌ Worker ${workerId} error processing task ${task.taskId}:`, error.message);
                            handleTaskFailure(task, combinationKey, failureTracker, taskQueue, maxRetryPerTask);
                            failureCount++;
                        }
                    } else {
                        console.warn(`❌ Worker ${workerId} got invalid result for task ${task.taskId}`);
                        handleTaskFailure(task, combinationKey, failureTracker, taskQueue, maxRetryPerTask);
                        failureCount++;
                    }
                } else {
                    console.error(`❌ Polling failed:`, pollResult.reason);
                    failureCount++;
                }
            }
            
            console.log(`📈 Batch completed: ${successCount} success, ${failureCount} failed (${questions.length}/${totalQuestions} total, ${taskQueue.length} remaining)`);
            totalAttempts += tasksToProcess;
            
            // Dynamic delay based on success rate and server load
            if (questions.length < totalQuestions && totalAttempts < maxAttempts && taskQueue.length > 0) {
                const successRate = successCount / (successCount + failureCount);
                const batchNumber = Math.floor(totalAttempts / OPTIMAL_CONCURRENT_REQUESTS);
                
                let delayMs = 1500; // Base delay
                
                // Adjust delay based on success rate
                if (successRate > 0.8) {
                    delayMs = 800; // Faster if doing well
                } else if (successRate < 0.5) {
                    delayMs = 3000; // Slower if struggling
                } else if (successRate < 0.3) {
                    delayMs = 5000; // Much slower if really struggling
                }
                
                // Progressive increase with reasonable cap
                delayMs = Math.min(delayMs + (batchNumber * 150), 8000);
                
                console.log(`⏳ Waiting ${delayMs}ms before next batch (success rate: ${(successRate * 100).toFixed(1)}%, active workers reset)...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        
        console.log(`🏁 Generation completed: ${questions.length}/${totalQuestions} questions generated after ${totalAttempts} attempts`);
        
        // Create fallback questions for any that failed
        while (questions.length < totalQuestions) {
            const fallbackDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
            
            console.log(`🔧 Creating fallback question ${questions.length + 1}/${totalQuestions}`);
            
            questions.push({
                id: questionId++,
                question: `โจทย์ที่ ${questionId - 1}: กรุณาติดต่อผู้ดูแลระบบ (AI response error)`,
                question_type: "multiple_choice",
                options: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
                correct_answer: "ตัวเลือก 1",
                correct_option_index: 0,
                explanation: "เกิดข้อผิดพลาดในการสร้างโจทย์ กรุณาลองใหม่",
                score: 2,
                difficulty: fallbackDifficulty,
                bloom_level: bloomLevels.join(', ')
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
                difficulty_levels: difficultyLevels,
                created_at: new Date().toISOString(),
                total_score: totalScore,
                generation_stats: {
                    max_concurrent_requests: OPTIMAL_CONCURRENT_REQUESTS,
                    total_attempts: totalAttempts,
                    success_rate: (questions.length / totalAttempts * 100).toFixed(1) + '%',
                    fallback_questions: totalQuestions - (questions.filter(q => !q.question.includes('กรุณาติดต่อผู้ดูแลระบบ')).length)
                }
            },
            questions: randomizedQuestions
        };
        
        return questionsData;
    } catch (error: any) {
        console.error("❌ Error generating questions:", error.message);
        return {
            title: "เกิดข้อผิดพลาด",
            message: `ไม่สามารถสร้างโจทย์ได้: ${error.message}`,
            type: "error"
        };
    }
}

// Helper function to handle task failures with proper retry logic
function handleTaskFailure(task: any, combinationKey: string, failureTracker: Map<string, number>, taskQueue: any[], maxRetryPerTask: number) {
    task.retryCount++;
    failureTracker.set(combinationKey, (failureTracker.get(combinationKey) || 0) + 1);
    
    // Re-queue if not exceeded retry limits
    if (task.retryCount < maxRetryPerTask && (failureTracker.get(combinationKey) || 0) < 5) {
        taskQueue.push(task);
        console.log(`🔄 Re-queued task ${task.taskId} (retry ${task.retryCount}/${maxRetryPerTask})`);
    } else {
        console.log(`❌ Task ${task.taskId} exceeded retry limits and will not be re-queued`);
    }
}

// Updated createHomework function
async function createHomework(prevState: any, formData: FormData): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const name = formData.get("h_name") as string;
        let subject = formData.get("h_subject") as string;
        const bloomtax = formData.get("h_bloomtax") as string;
        const difficulty = formData.get("h_difficulty") as string;
        let type = formData.get("h_type") as string;
        const totalQuestions = formData.get("h_total_questions") as string;
        const level = formData.get("h_level") as string;
        const content = formData.get("h_content") as string;

        const bloomTaxonomies = bloomtax ? bloomtax.split(',').map(b => b.trim()).filter(b => b.length > 0) : [];
        const difficultyLevels = difficulty ? difficulty.split(',').map(d => d.trim()).filter(d => d.length > 0) : [];

        if (!subject || !type) {
            subject = "พีชคณิต";
            type = "ปรนัย";
        }

        if (!name || !subject || bloomTaxonomies.length === 0 || difficultyLevels.length === 0 || !type || !totalQuestions) {
            return {
                title: "เกิดข้อผิดพลาด",
                message: "กรุณากรอกข้อมูลให้ครบถ้วน รวมถึงระดับความยาก",
                type: "error",
            };
        }

        const totalQuestionsNumber = parseInt(totalQuestions);
        if (isNaN(totalQuestionsNumber) || totalQuestionsNumber <= 0 || totalQuestionsNumber > 50) {
            return {
                title: "เกิดข้อผิดพลาด",
                message: "จำนวนข้อต้องอยู่ระหว่าง 1-50 ข้อ",
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

        // Generate questions
        console.log(`🚀 Starting question generation: ${totalQuestionsNumber} questions`);
        const generatedQuestions = await generateQuestions(
            subject, 
            level || "ไม่ระบุ", 
            bloomTaxonomies.join(', '), 
            difficultyLevels.join(', '),
            type, 
            totalQuestionsNumber, 
            content
        );
        
        if (generatedQuestions.type === "error") {
            return generatedQuestions;
        }

        console.log(`💾 Saving homework to database...`);

        // Save to database - use difficulty_levels from metadata
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

        console.log(`✅ Homework created and saved successfully`);

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
                // Update difficulty using metadata
                ...(questionsData.metadata.difficulty_levels && {
                    h_difficulty: questionsData.metadata.difficulty_levels
                })
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

// Get homework list
async function getHomework() {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

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
