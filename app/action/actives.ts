'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";

// Add homework to class (actives)
async function addHomeworkToClass(prevState: any, formData: FormData): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const homeworkId = formData.get("homeworkId") as string;
        const classId = formData.get("classId") as string;
        const aiCheck = formData.get("aiCheck") as string; // "true" หรือ "false"
        
        // Get teacher data
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Validate input
        if (!homeworkId || !classId) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ข้อมูลไม่ครบถ้วน", 
                type: "error" 
            };
        }

        const homeworkIdNum = parseInt(homeworkId);
        const classIdNum = parseInt(classId);

        if (isNaN(homeworkIdNum) || isNaN(classIdNum)) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ข้อมูลไม่ถูกต้อง", 
                type: "error" 
            };
        }

        // Check if homework exists and belongs to teacher
        const { data: homework, error: homeworkError } = await supabase
            .from("homework")
            .select("*")
            .eq("h_id", homeworkIdNum)
            .eq("h_temail", userData.t_email)
            .single();

        if (homeworkError || !homework) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ไม่พบชุดฝึกหรือไม่มีสิทธิ์เข้าถึง", 
                type: "error" 
            };
        }

        // Check if class exists and belongs to teacher
        const { data: classData, error: classError } = await supabase
            .from("classs")
            .select("c_students")
            .eq("c_id", classIdNum)
            .eq("c_tid", userData.t_id)
            .single();

        if (classError || !classData) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ไม่พบห้องเรียนหรือไม่มีสิทธิ์เข้าถึง", 
                type: "error" 
            };
        }

        // Get all students in the class
        const students = classData.c_students || {};
        const studentList = Object.values(students) as Array<{ s_id: number; [key: string]: any }>;

        if (studentList.length === 0) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ไม่มีนักเรียนในห้องเรียนนี้", 
                type: "error" 
            };
        }

        // Check if this homework is already assigned to this class
        const { data: existingActives, error: checkError } = await supabase
            .from("actives")
            .select("a_id")
            .eq("a_cid", classIdNum)
            .or(`a_homework.eq.${homeworkIdNum},a_homework->>id.eq.${homeworkIdNum}`)
            .limit(1);

        if (checkError) {
            console.error("Check existing actives error:", checkError);
            // If table doesn't exist, continue with insertion (first time setup)
            if (checkError.code === 'PGRST116' || checkError.message.includes('does not exist')) {
                console.log("Actives table might not exist or no data found, continuing...");
            } else {
                return { 
                    title: "เกิดข้อผิดพลาด", 
                    message: `เกิดข้อผิดพลาดในการตรวจสอบข้อมูล: ${checkError.message}`, 
                    type: "error" 
                };
            }
        }

        if (existingActives && existingActives.length > 0) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ชุดฝึกนี้ถูกเพิ่มในห้องเรียนแล้ว", 
                type: "error" 
            };
        }

        // Function to remove answers and explanations from homework content
        function removeAnswersFromContent(originalContent: any) {
            if (!originalContent || !originalContent.questions) {
                return originalContent;
            }

            const contentWithoutAnswers = {
                ...originalContent,
                questions: originalContent.questions.map((question: any) => {
                    const { correct_answer, correct_option_index, explanation, ...questionWithoutAnswers } = question;
                    return questionWithoutAnswers;
                })
            };

            return contentWithoutAnswers;
        }

        // Prepare homework content without answers for students
        const homeworkContentForStudents = removeAnswersFromContent(homework.h_content);

        // Prepare the homework data structure for a_homework field
        const homeworkDataForClass = {
            id: homeworkIdNum,
            time_assignment: new Date().toISOString(),
            content: homeworkContentForStudents
        };

        // Add homework to actives for all students in the class
        const activesToInsert = studentList.map(student => ({
            a_sid: student.s_id,
            a_cid: classIdNum,
            a_homework: homeworkDataForClass,
            a_status: "not_started",
            a_temail: userData.t_email
        }));

        const { error: insertError } = await supabase
            .from("actives")
            .insert(activesToInsert);

        if (insertError) {
            console.error("Insert actives error:", insertError);
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: `ไม่สามารถเพิ่มชุดฝึกให้นักเรียนได้: ${insertError.message}`, 
                type: "error" 
            };
        }

        return {
            title: "สำเร็จ",
            message: `เพิ่มชุดฝึก "${homework.h_name}" ให้นักเรียน ${studentList.length} คนเรียบร้อยแล้ว`,
            type: "success"
        };

    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Get actives by class id
async function getActivesByClassId(classId: number): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Get actives first
        const { data: actives, error: activesError } = await supabase
            .from("actives")
            .select("*")
            .eq("a_cid", classId)
            .eq("a_temail", userData.t_email);

        if (activesError) {
            console.error("Actives fetch error:", activesError);
            // If table doesn't exist or no data, return empty array
            if (activesError.code === 'PGRST116' || activesError.message.includes('does not exist')) {
                return [];
            }
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: `ไม่สามารถดึงข้อมูลชุดฝึกได้: ${activesError.message}`, 
                type: "error" 
            };
        }

        if (!actives || actives.length === 0) {
            return [];
        }

        // Group actives by homework ID to get unique homework assignments
        const homeworkMap = new Map();
        
        actives.forEach(active => {
            let homeworkId;
            
            // Handle both old and new data structures
            if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                // New structure
                homeworkId = active.a_homework.id;
            } else if (typeof active.a_homework === 'number') {
                // Old structure (for backward compatibility)
                homeworkId = active.a_homework;
            } else {
                return; // Skip invalid entries
            }

            if (!homeworkMap.has(homeworkId)) {
                homeworkMap.set(homeworkId, {
                    homeworkId,
                    assignedAt: active.a_homework?.time_assignment || new Date().toISOString(),
                    checkType: active.a_status || 'AI',
                    studentCount: 0,
                    content: active.a_homework?.content || null
                });
            }
            
            homeworkMap.get(homeworkId).studentCount++;
        });

        // Get homework IDs for fetching homework details
        const homeworkIds = Array.from(homeworkMap.keys());

        // Get homework details from homework table
        const { data: homework, error: homeworkError } = await supabase
            .from("homework")
            .select("h_id, h_name, h_subject, h_score, h_type, h_bloom_taxonomy")
            .in("h_id", homeworkIds);

        if (homeworkError) {
            console.error("Homework fetch error:", homeworkError);
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: `ไม่สามารถดึงข้อมูลชุดฝึกได้: ${homeworkError.message}`, 
                type: "error" 
            };
        }

        // Combine homework data with assignment info
        const result = Array.from(homeworkMap.values()).map(assignment => {
            const homeworkDetails = homework?.find(hw => hw.h_id === assignment.homeworkId);
            
            return {
                h_id: assignment.homeworkId,
                h_name: homeworkDetails?.h_name || 'ไม่ทราบชื่อ',
                h_subject: homeworkDetails?.h_subject || '',
                h_score: homeworkDetails?.h_score || 0,
                h_type: homeworkDetails?.h_type || '',
                h_bloom_taxonomy: homeworkDetails?.h_bloom_taxonomy || '',
                h_content: assignment.content,
                assignedAt: assignment.assignedAt,
                checkType: assignment.checkType,
                studentCount: assignment.studentCount
            };
        });

        return result;
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Get homework progress for a class
async function getHomeworkProgress(classId: number, homeworkId: number): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Get all actives for this homework in this class
        const { data: actives, error: activesError } = await supabase
            .from("actives")
            .select("a_id, a_sid, a_homework, a_status")
            .eq("a_cid", classId)
            .eq("a_temail", userData.t_email);

        if (activesError) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: activesError.message, 
                type: "error" 
            };
        }

        if (!actives || actives.length === 0) {
            return [];
        }

        // Filter actives for the specific homework (handle both old and new data structures)
        const homeworkActives = actives.filter(active => {
            if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                // New structure
                return active.a_homework.id === homeworkId;
            } else if (typeof active.a_homework === 'number') {
                // Old structure (for backward compatibility)
                return active.a_homework === homeworkId;
            }
            return false;
        });

        if (homeworkActives.length === 0) {
            return [];
        }

        // Get student emails from actives
        const studentIds = homeworkActives.map(active => active.a_sid);

        // Get student details
        const { data: students, error: studentsError } = await supabase
            .from("students")
            .select("s_fullname, s_email, s_username, s_gender, s_age, s_id")
            .in("s_id", studentIds);

        if (studentsError) {
            console.error("Students fetch error:", studentsError);
        }

        // Combine all data
        const result = homeworkActives.map(active => {
            const studentData = students?.find(student => student.s_id === active.a_sid);
            
            return {
                ...active,
                students: studentData || { s_id: active.a_sid, s_fullname: null, s_email: null },
            };
        });

        return result;

    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message, 
            type: "error" 
        };
    }
}

// Remove homework from class (delete from actives)
async function removeHomeworkFromClass(classId: number, homeworkId: number): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Validate input
        if (!classId || !homeworkId) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ข้อมูลไม่ครบถ้วน", 
                type: "error" 
            };
        }

        // Check if class belongs to teacher
        const { data: classData, error: classError } = await supabase
            .from("classs")
            .select("c_id")
            .eq("c_id", classId)
            .eq("c_tid", userData.t_id)
            .single();

        if (classError || !classData) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ไม่พบห้องเรียนหรือไม่มีสิทธิ์เข้าถึง", 
                type: "error" 
            };
        }

        // Delete all actives for this homework in this class
        const { error: deleteError } = await supabase
            .from("actives")
            .delete()
            .eq("a_cid", classId)
            .eq("a_temail", userData.t_email)
            .or(`a_homework.eq.${homeworkId},a_homework->>id.eq.${homeworkId}`);

        if (deleteError) {
            console.error("Delete actives error:", deleteError);
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: `ไม่สามารถลบชุดฝึกจากห้องเรียนได้: ${deleteError.message}`, 
                type: "error" 
            };
        }

        return {
            title: "สำเร็จ",
            message: "ลบชุดฝึกจากห้องเรียนเรียบร้อยแล้ว",
            type: "success"
        };

    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message, 
            type: "error" 
        };
    }
}

export {
    addHomeworkToClass,
    getActivesByClassId,
    getHomeworkProgress,
    removeHomeworkFromClass,
};
