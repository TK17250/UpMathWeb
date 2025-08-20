"use server";
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";
import axios from "axios";
import fs from "fs";
import path from "path";


// Environment detection
const IS_VERCEL = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

// RunPod Configuration
const RUNPOD_URL = "https://api.runpod.ai/v2/57uty6p5a5zfdt";
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
};

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 30 * 1000; // Reduced to 30 seconds for debugging

// Empty dependency array - runs once on mount
function withErrorHandling(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      console.error(`[${fn.name}] Server Error:`, {
        message: error.message,
        stack: IS_DEVELOPMENT ? error.stack : undefined,
        environment: IS_VERCEL ? "vercel" : "local",
        timestamp: new Date().toISOString(),
      });

      // Return consistent error format
      return {
        type: "error",
        title: "เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์",
        message: IS_DEVELOPMENT
          ? error.message
          : "กรุณาลองใหม่ภายหลังหรือติดต่อผู้ดูแลระบบ",
      };
    }
  };
}

interface BatchTaskResult {
  success: boolean;
  task: {
    difficulty: string;
    bloomLevels: string[];
    taskId: number;
    retryCount: number;
    priority: number;
  };
  questionData?: QuestionData;
  error?: string;
}

// Safe file reading with fallback
function getSystemPrompt(): string {
  try {
    if (IS_VERCEL) {
      // In production, use a fallback system prompt
      return `You are an AI assistant that creates high-quality mathematics questions in Thai language. 

Generate questions in the following XML format:
<questions>
<question>
<text>[Question text in Thai]</text>
<type>multiple_choice</type>
<options>
<option>[Option 1]</option>
<option>[Option 2]</option>
<option>[Option 3]</option>
<option>[Option 4]</option>
</options>
<correct_answer>[Correct answer text]</correct_answer>
<explanation>[Detailed explanation in Thai]</explanation>
<score>2</score>
<difficulty>[Easy/Medium/Hard in Thai]</difficulty>
<bloom_levels>
<level>[Bloom taxonomy level in Thai]</level>
</bloom_levels>
</question>
</questions>

Requirements:
- Questions must be in Thai language
- Multiple choice questions must have exactly 4 options
- Include detailed explanations
- Follow specified difficulty and Bloom taxonomy levels`;
    } else {
      // In development, try to read the file
      return fs.readFileSync(
        path.join(process.cwd(), "system_prompt.txt"),
        "utf8"
      );
    }
  } catch (error) {
    console.warn("Failed to load system prompt file, using fallback");
    return `You are an AI assistant that creates high-quality mathematics questions in Thai language. Generate questions in XML format with proper structure.`;
  }
}

const SYSTEM_PROMPT = getSystemPrompt();

const ADDITIONAL_REQUIREMENTS =
  "โจทย์จำเป็นต้องมีคำตอบ และถ้าโจทย์เป็นแบบ multiple choice (ปรนัย) ต้องมีคำตอบหลอกจำนวน 3 ข้อ (ทั้งหมด หลอก + จริง มี 4 ข้อ) โดยมาจากการคำนวนที่ผิดพลาด";

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
  return questions.map((question) => {
    if (
      question.question_type === "multiple_choice" &&
      question.options &&
      Array.isArray(question.options) &&
      question.options.length > 0 &&
      typeof question.correct_option_index === "number" &&
      question.correct_option_index >= 0
    ) {
      const correctAnswer = question.options[question.correct_option_index];
      const shuffledOptions = shuffleArray(question.options);
      const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

      return {
        ...question,
        options: shuffledOptions,
        correct_option_index: newCorrectIndex,
        correct_answer: correctAnswer,
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
async function callRunpodApi(
  userPrompt: string,
  systemPrompt: string = SYSTEM_PROMPT,
  retries: number = 2
): Promise<string | null> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = {
        input: {
          prompt: `${systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`,
          sampling_params: { max_tokens: 9216 },
        },
      };

      console.log(
        `API attempt ${attempt + 1}/${retries + 1}: System prompt length: ${
          systemPrompt.length
        } chars`
      );

      const response = await axios.post(`${RUNPOD_URL}/runsync`, data, {
        headers: HEADERS,
        timeout: 420000, // Increased to 7 minutes
      });

      if (response.status === 200 && response.data?.id) {
        console.log(
          `✅ RunPod API call successful (attempt ${attempt + 1}), run ID: ${
            response.data.id
          }`
        );
        return response.data.id;
      }

      console.warn(
        `⚠️ RunPod API returned status ${response.status} on attempt ${
          attempt + 1
        }`
      );
      lastError = new Error(`API returned status ${response.status}`);
    } catch (error: any) {
      lastError = error;
      console.error(
        `❌ RunPod API error on attempt ${attempt + 1}:`,
        error.message
      );

      // Don't retry on authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
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
  if (typeof outputStr === "object" && outputStr !== null) {
    const apiResponse = outputStr as RunpodOutput;
    if (
      apiResponse.choices &&
      apiResponse.choices[0] &&
      apiResponse.choices[0].tokens
    ) {
      const tokens = apiResponse.choices[0].tokens;
      if (Array.isArray(tokens) && tokens.length > 0) {
        content = tokens[0];
      }
    }
  } else if (typeof outputStr === "string") {
    content = outputStr;
  }

  // Remove <think> blocks completely
  content = content.replace(/<think>[\s\S]*?<\/think>/g, "");

  // Extract questions section
  if (content.includes("<questions>")) {
    const questionsStart = content.indexOf("<questions>");
    const questionsEnd =
      content.indexOf("</questions>") + "</questions>".length;
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
    console.log("Parsing XML content length:", xmlContent.length);

    const questionMatch = xmlContent.match(/<question>([\s\S]*?)<\/question>/);
    if (!questionMatch) {
      console.error("No question tag found in XML");
      return null;
    }

    const questionContent = questionMatch[1];

    // Extract fields with better defaults
    const text =
      questionContent.match(/<text>([\s\S]*?)<\/text>/)?.[1]?.trim() || "";
    const type =
      questionContent.match(/<type>([\s\S]*?)<\/type>/)?.[1]?.trim() ||
      "multiple_choice";

    // Extract options
    const optionsMatch = questionContent.match(
      /<options>([\s\S]*?)<\/options>/
    );
    const options: string[] = [];

    if (optionsMatch) {
      const optionMatches = optionsMatch[1].match(
        /<option>([\s\S]*?)<\/option>/g
      );
      if (optionMatches) {
        optionMatches.forEach((match) => {
          const option = match.replace(/<\/?option>/g, "").trim();
          if (option) options.push(option);
        });
      }
    }

    const correctAnswer =
      questionContent
        .match(/<correct_answer>([\s\S]*?)<\/correct_answer>/)?.[1]
        ?.trim() || "";
    let correctOptionIndex = -1;
    if (correctAnswer && options.length > 0) {
      correctOptionIndex = options.findIndex((opt) => opt === correctAnswer);
    }

    let explanation =
      questionContent
        .match(/<explanation>([\s\S]*?)<\/explanation>/)?.[1]
        ?.trim() || "";
    if (
      explanation.includes("<br>") ||
      explanation.includes("<br />") ||
      explanation.includes("<br/>")
    ) {
      explanation = explanation.replace(/<br\s*\/?>/g, "\n");
    }

    const score = parseInt(
      questionContent.match(/<score>([\s\S]*?)<\/score>/)?.[1]?.trim() || "2"
    );
    const difficulty =
      questionContent
        .match(/<difficulty>([\s\S]*?)<\/difficulty>/)?.[1]
        ?.trim() || "ปานกลาง";

    // Extract bloom levels
    const bloomLevelsMatch = questionContent.match(
      /<bloom_levels>([\s\S]*?)<\/bloom_levels>/
    );
    let bloomLevel = "เข้าใจ";
    if (bloomLevelsMatch) {
      const levelMatch = bloomLevelsMatch[1].match(
        /<level>([\s\S]*?)<\/level>/
      );
      if (levelMatch) {
        bloomLevel = levelMatch[1].trim();
      }
    }

    // Validate required fields
    if (
      !text ||
      options.length === 0 ||
      !correctAnswer ||
      correctOptionIndex === -1
    ) {
      console.error("Invalid question data:", {
        text: !!text,
        optionsCount: options.length,
        correctAnswer: !!correctAnswer,
        correctOptionIndex,
      });
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
      bloom_level: bloomLevel,
    };
  } catch (error: any) {
    console.error("Error parsing XML to JSON:", error.message);
    return null;
  }
}

// Helper function to create fallback question
function createFallbackQuestion(
  id: number,
  difficulty: string,
  bloomLevels: string[]
) {
  return {
    id,
    question: `โจทย์ที่ ${id}: กรุณาติดต่อผู้ดูแลระบบ (AI response error)`,
    question_type: "multiple_choice",
    options: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
    correct_answer: "ตัวเลือก 1",
    correct_option_index: 0,
    explanation: "เกิดข้อผิดพลาดในการสร้างโจทย์ กรุณาลองใหม่",
    score: 2,
    difficulty: difficulty,
    bloom_level: bloomLevels.join(", "),
  };
}

// Update the processBatchWithTimeout function signature and implementation
async function processBatchWithTimeout(
  tasks: Array<{
    difficulty: string;
    bloomLevels: string[];
    taskId: number;
    retryCount: number;
    priority: number;
  }>,
  subject: string,
  level: string,
  type: string,
  content?: string
): Promise<BatchTaskResult[]> {
  const BATCH_TIMEOUT = 10 * 60 * 1000; // 10 minutes per batch

  const batchPromise = Promise.all(
    tasks.map(async (task, index): Promise<BatchTaskResult> => {
      try {
        // Stagger requests
        await new Promise((resolve) => setTimeout(resolve, index * 200));

        const userPrompt = createUserPrompt(
          subject,
          level,
          type,
          task.difficulty,
          task.bloomLevels,
          content
        );

        const runId = await callRunpodApi(userPrompt);
        if (!runId) {
          return { success: false, task, error: "API call failed" };
        }

        const result = await pollRunpodResult(runId, 300); // 5 minute timeout per request
        if (!result || !result.output) {
          return { success: false, task, error: "Polling failed" };
        }

        const extractedContent = extractContent(result.output[0]);
        const questionData = parseXmlToJson(extractedContent);

        if (!questionData) {
          return { success: false, task, error: "Parsing failed" };
        }

        return { success: true, task, questionData };
      } catch (error) {
        return { success: false, task, error: "Processing error" };
      }
    })
  );

  const timeoutPromise = new Promise<BatchTaskResult[]>((resolve) => {
    setTimeout(() => {
      resolve(
        tasks.map((task) => ({ success: false, task, error: "Batch timeout" }))
      );
    }, BATCH_TIMEOUT);
  });

  return Promise.race([batchPromise, timeoutPromise]);
}

// Improved polling function with better timeout handling
async function pollRunpodResult(
  runId: string,
  timeout: number = 600
): Promise<any | null> {
  const url = `${RUNPOD_URL}/status/${runId}`;
  const start = Date.now();
  let attemptCount = 0;
  let pollInterval = 3; // Start with 3 seconds

  console.log(`🔍 Starting to poll result for run ID: ${runId}`);

  while (true) {
    attemptCount++;
    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: HEADERS,
          timeout: 600000,
        }
      );

      if (response.status === 200) {
        const result = response.data;
        const status = result?.status;

        console.log(`Poll attempt ${attemptCount} for ${runId}: ${status}`);

        if (status === "COMPLETED") {
          console.log(
            `✅ Run ${runId} completed successfully after ${attemptCount} attempts`
          );
          return result;
        }
        if (status === "FAILED" || status === "CANCELLED") {
          console.error(`❌ Run ${runId} failed with status: ${status}`);
          return null;
        }

        // Log progress for IN_QUEUE and IN_PROGRESS
        if (status === "IN_QUEUE" && attemptCount % 5 === 0) {
          console.log(
            `⏳ Run ${runId} still in queue after ${attemptCount} attempts`
          );
        }
        if (status === "IN_PROGRESS" && attemptCount % 3 === 0) {
          console.log(`⚙️ Run ${runId} processing... (${attemptCount} polls)`);
        }
      }

      // Check timeout
      const elapsed = Date.now() - start;
      if (elapsed > timeout * 1000) {
        console.error(
          `⏰ Timeout reached for run ID: ${runId} after ${
            elapsed / 1000
          }s (${attemptCount} attempts)`
        );
        return null;
      }

      // Adaptive polling interval
      if (attemptCount <= 5) pollInterval = 3; // First 5 attempts: 3s
      else if (attemptCount <= 15) pollInterval = 5; // Next 10 attempts: 5s
      else pollInterval = 8; // After that: 8s

      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    } catch (error: any) {
      console.error(
        `❌ Error polling run ID ${runId} (attempt ${attemptCount}):`,
        error.message
      );

      // Check overall timeout
      if (Date.now() - start > timeout * 1000) {
        console.error(
          `⏰ Overall timeout reached for run ID: ${runId} after ${attemptCount} attempts`
        );
        return null;
      }

      // Wait longer on error
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  }
}

// Optimized generateQuestions with better worker management and circuit breaker
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
    const bloomLevels = bloomTaxonomy
      .split(",")
      .map((b) => b.trim())
      .filter((b) => b);
    const difficulties = difficultyLevels
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d);

    if (bloomLevels.length === 0 || difficulties.length === 0) {
      return {
        type: "error",
        title: "ข้อมูลไม่ถูกต้อง",
        message: "กรุณาระบุระดับความยากและระดับขั้นโจทย์",
      };
    }

    // Optimized worker configuration for better performance
    const MAX_CONCURRENT_REQUESTS = Math.min(3, totalQuestions); // Reduced from 5 to 3 for stability
    const MAX_RETRIES_PER_BATCH = 2; // Reduced retries

    const questions: QuestionData[] = [];
    let questionId = 1;
    let totalAttempts = 0;
    const maxAttempts = totalQuestions * 3; // Reduced from 4 to 3

    console.log(
      `🚀 Optimized generation: ${totalQuestions} questions with max ${MAX_CONCURRENT_REQUESTS} concurrent requests`
    );

    // Pre-generate task queue with better distribution
    const taskQueue: Array<{
      difficulty: string;
      bloomLevels: string[];
      taskId: number;
      retryCount: number;
      priority: number; // Add priority for better scheduling
    }> = [];

    for (let i = 0; i < totalQuestions; i++) {
      const selectedDifficulty = difficulties[i % difficulties.length];
      taskQueue.push({
        difficulty: selectedDifficulty,
        bloomLevels: bloomLevels,
        taskId: i + 1,
        retryCount: 0,
        priority: Math.random(), // Random priority for better distribution
      });
    }

    // Sort by priority for better load balancing
    taskQueue.sort((a, b) => b.priority - a.priority);

    const failureTracker = new Map<string, number>();
    const MAX_GLOBAL_FAILURES = 3; // Reduced from 5
    const MAX_TASK_RETRIES = 2; // Reduced from 3

    // Main generation loop with circuit breaker
    while (
      questions.length < totalQuestions &&
      totalAttempts < maxAttempts &&
      taskQueue.length > 0
    ) {
      const remainingQuestions = totalQuestions - questions.length;
      const batchSize = Math.min(
        MAX_CONCURRENT_REQUESTS,
        remainingQuestions,
        taskQueue.length
      );

      console.log(
        `📦 Batch processing: ${batchSize} tasks (${questions.length}/${totalQuestions} completed)`
      );

      // Take tasks from queue with priority consideration
      const currentBatch = taskQueue.splice(0, batchSize);

      // Filter valid tasks with circuit breaker logic
      const validTasks = currentBatch.filter((task) => {
        const failures = failureTracker.get(task.difficulty) || 0;
        return (
          failures < MAX_GLOBAL_FAILURES && task.retryCount < MAX_TASK_RETRIES
        );
      });

      if (validTasks.length === 0) {
        console.warn("⚠️ Circuit breaker activated - no valid tasks remaining");
        break;
      }

      // Process batch with staggered timing and better error handling
      const batchResults = await processBatchWithTimeout(
        validTasks,
        subject,
        level,
        type,
        content
      );

      let batchSuccessCount = 0;
      const failedTasks: any[] = [];

      // Process batch results
      for (const result of batchResults) {
        if (result.success && result.questionData) {
          result.questionData.id = questionId++;
          questions.push(result.questionData);
          batchSuccessCount++;
          console.log(
            `✅ Generated question ${result.questionData.id} (${result.task.difficulty})`
          );
        } else {
          // Handle failed task
          const failedTask = result.task;
          failedTask.retryCount++;
          failedTask.priority = Math.random(); // Re-randomize priority

          const failures = failureTracker.get(failedTask.difficulty) || 0;
          failureTracker.set(failedTask.difficulty, failures + 1);

          // Re-queue if within limits
          if (
            failedTask.retryCount < MAX_TASK_RETRIES &&
            failures < MAX_GLOBAL_FAILURES
          ) {
            failedTasks.push(failedTask);
          }

          console.warn(
            `❌ Task ${failedTask.taskId} failed (retry ${failedTask.retryCount}/${MAX_TASK_RETRIES})`
          );
        }
      }

      // Re-queue failed tasks with priority sorting
      failedTasks.sort((a, b) => b.priority - a.priority);
      taskQueue.unshift(...failedTasks);

      totalAttempts += validTasks.length;

      // Adaptive delay with success rate consideration
      const successRate = batchSuccessCount / validTasks.length;
      let delayMs = 1000; // Base delay reduced from 1500

      if (successRate > 0.8) delayMs = 500; // Faster if doing well
      else if (successRate < 0.5) delayMs = 2000; // Slower if struggling
      else if (successRate < 0.3) delayMs = 3000; // Much slower if really struggling

      if (questions.length < totalQuestions && taskQueue.length > 0) {
        console.log(
          `⏳ Adaptive delay: ${delayMs}ms (success rate: ${(
            successRate * 100
          ).toFixed(1)}%)`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(
      `🏁 Generation completed: ${questions.length}/${totalQuestions} questions after ${totalAttempts} attempts`
    );

    // Create minimal fallback questions if needed
    while (questions.length < totalQuestions) {
      const fallbackDifficulty =
        difficulties[questions.length % difficulties.length];
      questions.push(
        createFallbackQuestion(questionId++, fallbackDifficulty, bloomLevels)
      );
    }

    // Randomize choices and calculate final stats
    const randomizedQuestions = randomizeChoices(
      questions.slice(0, totalQuestions)
    );
    const totalScore = randomizedQuestions.reduce(
      (sum, q) => sum + (q.score || 2),
      0
    );

    return {
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
          max_concurrent_requests: MAX_CONCURRENT_REQUESTS,
          total_attempts: totalAttempts,
          success_rate:
            (
              (questions.filter(
                (q) => !q.question.includes("กรุณาติดต่อผู้ดูแลระบบ")
              ).length /
                totalQuestions) *
              100
            ).toFixed(1) + "%",
        },
      },
      questions: randomizedQuestions,
    };
  } catch (error: any) {
    console.error("❌ Optimized generation error:", error.message);
    return {
      title: "เกิดข้อผิดพลาด",
      message: `ไม่สามารถสร้างโจทย์ได้: ${error.message}`,
      type: "error",
    };
  }
}

// Helper function to handle task failures with proper retry logic
function handleTaskFailure(
  task: any,
  combinationKey: string,
  failureTracker: Map<string, number>,
  taskQueue: any[],
  maxRetryPerTask: number
) {
  task.retryCount++;
  failureTracker.set(
    combinationKey,
    (failureTracker.get(combinationKey) || 0) + 1
  );

  // Re-queue if not exceeded retry limits
  if (
    task.retryCount < maxRetryPerTask &&
    (failureTracker.get(combinationKey) || 0) < 5
  ) {
    taskQueue.push(task);
    console.log(
      `🔄 Re-queued task ${task.taskId} (retry ${task.retryCount}/${maxRetryPerTask})`
    );
  } else {
    console.log(
      `❌ Task ${task.taskId} exceeded retry limits and will not be re-queued`
    );
  }
}

// Clear homework cache helper function
function clearHomeworkCache(userEmail: string) {
  // Clear all cache entries that match homework pattern for this user
  for (const [key, value] of cache.entries()) {
    if (key.includes(`homework_${userEmail}`)) {
      cache.delete(key);
    }
  }
  console.log(`🧹 Cleared homework cache for user: ${userEmail}`);
}

// Optimized createHomework function with better error handling and timeout
async function createHomeworkInternal(
  prevState: any,
  formData: FormData
): Promise<any> {
  try {
    const supabase = await createSupabaseServerClient();

    // Extract form data efficiently
    const name = formData.get("h_name") as string;
    let subject = formData.get("h_subject") as string;
    const bloomtax = formData.get("h_bloomtax") as string;
    const difficulty = formData.get("h_difficulty") as string;
    let type = formData.get("h_type") as string;
    const totalQuestions = formData.get("h_total_questions") as string;
    const level = formData.get("h_level") as string;
    const content = formData.get("h_content") as string;

    // Set defaults to prevent undefined issues
    if (!subject || !type) {
      subject = subject || "พีชคณิต";
      type = type || "ปรนัย";
    }

    const bloomTaxonomies = bloomtax
      ? bloomtax
          .split(",")
          .map((b) => b.trim())
          .filter((b) => b.length > 0)
      : [];
    const difficultyLevels = difficulty
      ? difficulty
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d.length > 0)
      : [];

    // Validate required fields early
    if (
      !name ||
      !subject ||
      bloomTaxonomies.length === 0 ||
      difficultyLevels.length === 0 ||
      !type ||
      !totalQuestions
    ) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "กรุณากรอกข้อมูลให้ครบถ้วน รวมถึงระดับความยาก",
        type: "error",
      };
    }

    const totalQuestionsNumber = parseInt(totalQuestions);
    if (
      isNaN(totalQuestionsNumber) ||
      totalQuestionsNumber <= 0 ||
      totalQuestionsNumber > 50
    ) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "จำนวนข้อต้องอยู่ระหว่าง 1-50 ข้อ",
        type: "error",
      };
    }

    // Get user data with better error handling
    let userData;
    try {
      userData = await getUserData();
    } catch (error) {
      console.error("Failed to get user data:", error);
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้",
        type: "error",
      };
    }

    if (!userData) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่พบข้อมูลผู้ใช้",
        type: "error",
      };
    }

    // Check if content is pre-processed questions data (optimization for quick saves)
    if (content && content.trim()) {
      try {
        const questionsData = JSON.parse(content);
        if (questionsData.questions && questionsData.metadata) {
          // Direct save without regeneration
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

          if (homeworkError) {
            return {
              title: "เกิดข้อผิดพลาด",
              message: homeworkError.message,
              type: "error",
            };
          }

          // Clear cache after successful creation
          clearHomeworkCache(userData.t_email);

          return {
            title: "สำเร็จ",
            message: "บันทึกชุดฝึกเรียบร้อยแล้ว",
            type: "success",
          };
        }
      } catch (e) {
        // Content is not JSON, continue with generation
        console.log(
          "Content is not pre-processed JSON, proceeding with generation"
        );
      }
    }

    // Generate questions with timeout and better error handling
    console.log(
      `🚀 Starting optimized question generation: ${totalQuestionsNumber} questions`
    );

    const generationPromise = generateQuestions(
      subject,
      level || "ไม่ระบุ",
      bloomTaxonomies.join(", "),
      difficultyLevels.join(", "),
      type,
      totalQuestionsNumber,
      content
    );

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Generation timeout after 15 minutes")),
        15 * 60 * 1000
      );
    });

    const generatedQuestions = await Promise.race([
      generationPromise,
      timeoutPromise,
    ]);

    if (generatedQuestions.type === "error") {
      return generatedQuestions;
    }

    console.log(`💾 Saving homework to database...`);

    // Save to database with optimized insert
    const { error: homeworkError } = await supabase
      .from("homework")
      .insert({
        h_name: name,
        h_temail: userData.t_email,
        h_subject: subject,
        h_bloom_taxonomy: bloomTaxonomies.join(", "),
        h_type: type,
        h_score: Math.round(generatedQuestions.metadata.total_score),
        h_content: generatedQuestions,
      })
      .select()
      .single();

    if (homeworkError) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: homeworkError.message,
        type: "error",
      };
    }

    // Clear cache after successful creation
    clearHomeworkCache(userData.t_email);

    console.log(`✅ Homework created and saved successfully`);

    return {
      title: "สำเร็จ",
      message: "สร้างและบันทึกชุดฝึกด้วย AI เรียบร้อยแล้ว",
      type: "success",
      questionsData: generatedQuestions,
    };
  } catch (error: any) {
    console.error(`Server error in createHomework: ${error.message}`);
    return {
      title: "เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์",
      message: error.message.includes("timeout")
        ? "การสร้างโจทย์ใช้เวลานานเกินไป กรุณาลองใหม่หรือลดจำนวนข้อ"
        : "กรุณาลองใหม่ภายหลัง",
      type: "error",
    };
  }
}

// Update homework
async function updateHomeworkInternal(
  homeworkId: number,
  questionsData: any
): Promise<any> {
  try {
    // Validate input
    if (!homeworkId || !questionsData) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ข้อมูลไม่ถูกต้อง",
        type: "error",
      };
    }

    const supabase = await createSupabaseServerClient();
    
    // Get user data with better error handling
    let userData;
    try {
      userData = await getUserData();
    } catch (error) {
      console.error("Failed to get user data:", error);
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้",
        type: "error",
      };
    }

    if (!userData) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่พบข้อมูลผู้ใช้",
        type: "error",
      };
    }

    // Randomize choices before updating
    if (questionsData.questions && Array.isArray(questionsData.questions)) {
      questionsData.questions = randomizeChoices(questionsData.questions);
    }

    // Update homework in database
    const { error: updateError } = await supabase
      .from("homework")
      .update({
        h_content: questionsData,
        h_score: Math.round(questionsData.metadata?.total_score || 0),
        // Update difficulty using metadata
        ...(questionsData.metadata?.difficulty_levels && {
          h_difficulty: questionsData.metadata.difficulty_levels,
        }),
      })
      .eq("h_id", homeworkId)
      .eq("h_temail", userData.t_email);

    if (updateError) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: updateError.message,
        type: "error",
      };
    }

    // Clear cache after successful update
    clearHomeworkCache(userData.t_email);

    return {
      title: "สำเร็จ",
      message: "อัพเดตชุดฝึกเรียบร้อยแล้ว",
      type: "success",
    };
  } catch (error: any) {
    console.error("Server error in updateHomework: ", error.message);
    return {
      title: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์",
      message: error.message,
      type: "error",
    };
  }
}

// FIXED: Better error handling for getHomework - main function causing the 500 error
async function getHomeworkInternal() {
  try {
    // Initialize Supabase client with error handling
    let supabase;
    try {
      supabase = await createSupabaseServerClient();
    } catch (supabaseError: any) {
      console.error("Failed to create Supabase client:", supabaseError);
      throw new Error("Database connection failed");
    }

    // Get user data with comprehensive error handling
    let userData;
    try {
      userData = await getUserData();
    } catch (userError: any) {
      console.error("Failed to get user data:", userError);
      // Return empty array instead of null to prevent UI crashes
      return [];
    }

    if (!userData) {
      console.warn("No user data found, returning empty array");
      return [];
    }

    console.log(`Fetching homework for user: ${userData.t_email}`);

    // Fetch homework with comprehensive error handling
    let homeworkData;
    try {
      const { data, error: homeworkError } = await supabase
        .from("homework")
        .select("*")
        .eq("h_temail", userData.t_email)
        .order("h_id", { ascending: false });

      if (homeworkError) {
        console.error("Database error fetching homework:", homeworkError);
        // Return empty array instead of throwing to prevent crashes
        return [];
      }

      homeworkData = data;
    } catch (dbError: any) {
      console.error("Database query failed:", dbError);
      return [];
    }

    console.log(`Found ${homeworkData?.length || 0} homework records`);

    // Ensure we always return an array, even if empty
    const result = homeworkData || [];
    
    // Validate each homework record to prevent rendering errors
    const validatedHomework = result.filter((homework) => {
      if (!homework || typeof homework !== 'object') {
        console.warn("Invalid homework record found, skipping:", homework);
        return false;
      }
      
      // Ensure required fields exist
      if (!homework.h_id || !homework.h_name) {
        console.warn("Homework missing required fields, skipping:", homework.h_id);
        return false;
      }
      
      return true;
    });

    console.log(`Validated ${validatedHomework.length} homework records`);
    return validatedHomework;

  } catch (error: any) {
    console.error("Critical error in getHomework:", {
      message: error.message,
      stack: IS_DEVELOPMENT ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Always return empty array to prevent UI crashes
    return [];
  }
}

// Get homework details form id
async function getHomeworkDetails(homeworkId: number) {
  try {
    // Validate input
    if (!homeworkId || isNaN(homeworkId)) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ข้อมูลไม่ถูกต้อง",
        type: "error",
      };
    }

    const supabase = await createSupabaseServerClient();
    
    // Get user data with error handling
    let userData;
    try {
      userData = await getUserData();
    } catch (error) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้",
        type: "error",
      };
    }

    if (!userData) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่พบข้อมูลผู้ใช้",
        type: "error",
      };
    }

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
        type: "error",
      };
    }

    if (!homework) {
      return {
        title: "ไม่พบชุดฝึก",
        message: "ไม่พบข้อมูลชุดฝึกที่ต้องการ",
        type: "error",
      };
    }

    // Randomize choices each time homework is retrieved
    const homeworkContent = homework.h_content;
    if (
      homeworkContent &&
      homeworkContent.questions &&
      Array.isArray(homeworkContent.questions)
    ) {
      homeworkContent.questions = randomizeChoices(homeworkContent.questions);
    }

    return homeworkContent;
  } catch (error: any) {
    console.error("Server error in getHomeworkDetails: ", error.message);
    return {
      title: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์",
      message: error.message,
      type: "error",
    };
  }
}

// Delete homework with active check
async function deleteHomework(
  prevState: any,
  formData: FormData
): Promise<any> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get user data with error handling
    let userData;
    try {
      userData = await getUserData();
    } catch (error) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้",
        type: "error",
      };
    }

    if (!userData) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่พบข้อมูลผู้ใช้",
        type: "error",
      };
    }

    const homeworkId = parseInt(formData.get("homeworkId") as string);

    if (isNaN(homeworkId)) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ข้อมูลไม่ถูกต้อง",
        type: "error",
      };
    }

    // First, check if homework is being used in actives table
    try {
      const { data: actives, error: activesError } = await supabase
        .from("actives")
        .select("a_id, a_homework")
        .or(`a_homework->>id.eq.${homeworkId}`);

      // If there's an error but it's because the table doesn't exist, continue
      if (activesError && !activesError.message.includes("does not exist")) {
        console.error("Error checking actives:", activesError);
        return {
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถตรวจสอบสถานะการใช้งานได้",
          type: "error",
        };
      }

      // Filter actives that actually contain this homework
      const filteredActives =
        actives?.filter((active) => {
          if (typeof active.a_homework === "number") {
            return active.a_homework === homeworkId;
          } else if (
            typeof active.a_homework === "object" &&
            active.a_homework !== null
          ) {
            return (active.a_homework as any).id === homeworkId;
          }
          return false;
        }) || [];

      // If homework is being used, prevent deletion
      if (filteredActives.length > 0) {
        return {
          title: "ไม่สามารถลบได้",
          message:
            "ชุดฝึกนี้กำลังถูกใช้งานในห้องเรียน กรุณาเอาออกจากห้องเรียนก่อนลบ",
          type: "error",
        };
      }
    } catch (activesCheckError) {
      console.warn("Could not check actives table, proceeding with deletion:", activesCheckError);
      // Continue with deletion if actives check fails
    }

    // Check if homework exists and belongs to teacher
    const { data: homework, error: fetchError } = await supabase
      .from("homework")
      .select("h_id, h_name")
      .eq("h_id", homeworkId)
      .eq("h_temail", userData.t_email)
      .single();

    if (fetchError) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: "ไม่พบการบ้านที่ต้องการลบ",
        type: "error",
      };
    }

    // Delete homework from database
    const { error: deleteError } = await supabase
      .from("homework")
      .delete()
      .eq("h_id", homeworkId)
      .eq("h_temail", userData.t_email);

    if (deleteError) {
      return {
        title: "เกิดข้อผิดพลาด",
        message: deleteError.message,
        type: "error",
      };
    }

    // Clear cache after successful deletion
    clearHomeworkCache(userData.t_email);

    return {
      title: "สำเร็จ",
      message: `ลบชุดฝึก "${homework.h_name}" เรียบร้อยแล้ว`,
      type: "success",
    };
  } catch (error: any) {
    console.error("Server error in deleteHomework: ", error.message);
    return {
      title: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์",
      message: error.message,
      type: "error",
    };
  }
}

// Check if homework is being used in actives table
async function checkHomeworkActive(homeworkId: number) {
  try {
    // Validate input
    if (!homeworkId || isNaN(homeworkId)) {
      return { isActive: false, classNames: [] };
    }

    const supabase = await createSupabaseServerClient();
    
    // Get user data with error handling
    let userData;
    try {
      userData = await getUserData();
    } catch (error) {
      return { isActive: false, classNames: [] };
    }

    if (!userData) {
      return { isActive: false, classNames: [] };
    }

    // Check if homework is being used in actives table
    try {
      const { data: actives, error: activesError } = await supabase
        .from("actives")
        .select(`*`)
        .or(`a_homework->>id.eq.${homeworkId}`)
        .eq("a_temail", userData.t_email);

      if (activesError) {
        console.error("Error checking actives:", activesError);
        // If table doesn't exist or other error, assume not active
        return { isActive: false, classNames: [] };
      }

      // Filter actives that actually contain this homework
      const filteredActives =
        actives?.filter((active) => {
          if (typeof active.a_homework === "number") {
            return active.a_homework === homeworkId;
          } else if (
            typeof active.a_homework === "object" &&
            active.a_homework !== null
          ) {
            return (active.a_homework as any).id === homeworkId;
          }
          return false;
        }) || [];

      const isActive = filteredActives.length > 0;

      // Get unique class names
      const classNames = isActive
        ? [
            ...new Set(
              filteredActives
                .map((active) => (active as any)?.c_name)
                .filter(Boolean)
            ),
          ]
        : [];

      return {
        isActive,
        classNames,
        activeCount: filteredActives.length,
      };
    } catch (activesError) {
      console.warn("Could not check actives table:", activesError);
      return { isActive: false, classNames: [] };
    }
  } catch (error) {
    console.error("Error in checkHomeworkActive:", error);
    return { isActive: false, classNames: [] };
  }
}

export const createHomework = withErrorHandling(createHomeworkInternal);
export const getHomework = withErrorHandling(getHomeworkInternal);
export const updateHomework = withErrorHandling(updateHomeworkInternal);

export {
  generateQuestions,
  getHomeworkDetails,
  deleteHomework,
  checkHomeworkActive,
  randomizeChoices,
};