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
            check_type: aiCheck === "true" ? "AI" : "manual",
            content: homeworkContentForStudents,
            time_assignment: new Date().toISOString(),
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
                    checkType: active.a_homework?.check_type || 'AI',
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
                check_type: assignment.checkType,
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
            .or(`a_homework->>id.eq.${homeworkId}`);

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

// Get activities for teacher's history page - homework marked as done
async function getActivities(): Promise<any> {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        
        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        // Get completed homework from history table
        const { data: historyData, error: historyError } = await supabase
            .from("history")
            .select("*")
            .eq("his_temail", userData.t_email)
            .order("his_time", { ascending: false })
            .limit(100);

        console.log("History data fetched:", historyData);
        console.log("History fetch error:", historyError);

        // Also check if there's any data in history table at all
        const { data: allHistoryData, error: allHistoryError } = await supabase
            .from("history")
            .select("*")
            .limit(5);

        // Let's also check if we can find any actives data for this teacher
        const { data: activesCheck, error: activesCheckError } = await supabase
            .from("actives")
            .select("*")
            .eq("a_temail", userData.t_email)
            .limit(5);

        if (historyError) {
            console.error("History fetch error:", historyError);
            return {
                type: "success",
                data: []
            };
        }

        if (!historyData || historyData.length === 0) {
            console.log("No history data found, checking actives table for completed homework...");
            
            // Fallback: Check actives table for completed homework
            const { data: activesData, error: activesError } = await supabase
                .from("actives")
                .select("a_id, a_sid, a_cid, a_homework, a_status, a_temail")
                .eq("a_temail", userData.t_email)
                .eq("a_status", "done")
                .order("a_id", { ascending: false })
                .limit(100);

            console.log("Actives fallback query result:", { activesData, activesError });

            if (activesError || !activesData || activesData.length === 0) {
                return {
                    type: "success",
                    data: []
                };
            }

            // Process actives data
            const homeworkIds = new Set<number>();
            const classIds = new Set<number>();
            const studentIds = new Set<number>();

            activesData.forEach(active => {
                let homeworkId;
                if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                    homeworkId = active.a_homework.id;
                } else if (typeof active.a_homework === 'number') {
                    homeworkId = active.a_homework;
                }
                
                if (homeworkId) {
                    homeworkIds.add(homeworkId);
                }
                classIds.add(active.a_cid);
                studentIds.add(active.a_sid);
            });

            // Fetch homework details
            const { data: homeworkData } = await supabase
                .from("homework")
                .select("h_id, h_name, h_subject")
                .in("h_id", Array.from(homeworkIds));

            // Fetch class details
            const { data: classData } = await supabase
                .from("classs")
                .select("c_id, c_name")
                .in("c_id", Array.from(classIds));

            // Fetch student details
            const { data: studentData } = await supabase
                .from("students")
                .select("s_id, s_username, s_email, s_fullname")
                .in("s_id", Array.from(studentIds));

            // Create lookup maps
            const homeworkMap = new Map(homeworkData?.map(hw => [hw.h_id, hw]) || []);
            const classMap = new Map(classData?.map(cls => [cls.c_id, cls]) || []);
            const studentMap = new Map(studentData?.map(std => [std.s_id, std]) || []);

            // Format the data for display
            const formattedActivities = activesData.map(active => {
                let homeworkId;
                if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                    homeworkId = active.a_homework.id;
                } else if (typeof active.a_homework === 'number') {
                    homeworkId = active.a_homework;
                }

                const homework = homeworkMap.get(homeworkId);
                const classs = classMap.get(active.a_cid);
                const student = studentMap.get(active.a_sid);

                return {
                    a_id: active.a_id,
                    a_cid: active.a_cid,
                    a_sid: active.a_sid,
                    a_status: active.a_status,
                    a_date: new Date().toISOString(), // Use current date as fallback
                    a_time: new Date().toISOString(),
                    homework_name: homework?.h_name || `ชุดฝึก ${homeworkId}`,
                    homework_subject: homework?.h_subject || 'ไม่ระบุวิชา',
                    class_name: classs?.c_name || `ห้องเรียน ${active.a_cid}`,
                    student_name: student?.s_fullname || 'ไม่ระบุชื่อ',
                    student_username: student?.s_username || 'ไม่ระบุ username',
                    student_id: student?.s_id || active.a_sid,
                    student_email: student?.s_email || 'ไม่ระบุอีเมล'
                };
            });

            console.log("Formatted activities from actives:", formattedActivities);

            return {
                type: "success",
                data: formattedActivities
            };
        }

        // Get unique homework IDs, class IDs, and student identifiers
        const activesIds = new Set<number>();
        const classIds = new Set<number>();
        const studentIdentifiers = new Set<string>();

        historyData.forEach(history => {
            console.log("History entry:", history);
            // Use his_aid to find actives
            if (history.his_aid) {
                activesIds.add(history.his_aid);
            }
            classIds.add(history.his_cid);
            studentIdentifiers.add(history.his_semail);
        });

        // Fetch actives data using his_aid
        const { data: activesData, error: activesError } = await supabase
            .from("actives")
            .select("a_id, a_homework")
            .in("a_id", Array.from(activesIds));

        console.log("Actives IDs to search:", Array.from(activesIds));
        console.log("Fetched actives data:", activesData);
        console.log("Actives fetch error:", activesError);

        // Extract homework IDs from actives data
        const homeworkIds = new Set<number>();
        const activesMap = new Map();

        activesData?.forEach(active => {
            let homeworkId;
            if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                homeworkId = active.a_homework.id;
            } else if (typeof active.a_homework === 'number') {
                homeworkId = active.a_homework;
            }
            
            if (homeworkId) {
                homeworkIds.add(homeworkId);
                activesMap.set(active.a_id, homeworkId);
            }
        });

        // Fetch homework details using homework IDs from actives
        const { data: homeworkData, error: homeworkError } = await supabase
            .from("homework")
            .select("h_id, h_name, h_subject, h_score, h_type, h_bloom_taxonomy, h_temail")
            .in("h_id", Array.from(homeworkIds));

        console.log("Homework IDs to search:", Array.from(homeworkIds));
        console.log("Fetched homework data:", homeworkData);
        console.log("Homework fetch error:", homeworkError);

        // Fetch class details
        const { data: classData } = await supabase
            .from("classs")
            .select("c_id, c_name")
            .in("c_id", Array.from(classIds));

        // Try to fetch student details by both email and ID since his_semail might contain either
        const studentIdentifierArray = Array.from(studentIdentifiers);
        
        // First try by email
        const { data: studentDataByEmail } = await supabase
            .from("students")
            .select("s_id, s_username, s_email, s_fullname")
            .in("s_email", studentIdentifierArray);

        // Then try by ID (convert string IDs to numbers)
        const numericIds = studentIdentifierArray.filter(id => !isNaN(Number(id))).map(id => Number(id));
        const { data: studentDataById } = await supabase
            .from("students")
            .select("s_id, s_username, s_email, s_fullname")
            .in("s_id", numericIds);

        // Combine both results
        const studentData = [...(studentDataByEmail || []), ...(studentDataById || [])];

        // Create lookup maps
        const homeworkMap = new Map(homeworkData?.map(hw => [hw.h_id, hw]) || []);
        const classMap = new Map(classData?.map(cls => [cls.c_id, cls]) || []);
        
        // Create student maps for both email and ID lookups
        const studentMapByEmail = new Map(studentData?.map(std => [std.s_email, std]) || []);
        const studentMapById = new Map(studentData?.map(std => [std.s_id.toString(), std]) || []);

        // Format the data for display
        const formattedActivities = historyData.map(history => {
            // Get homework ID from actives using his_aid
            const homeworkId = activesMap.get(history.his_aid);
            const homework = homeworkMap.get(homeworkId);
            const classs = classMap.get(history.his_cid);
            
            // Try to find student by email first, then by ID
            let student = studentMapByEmail.get(history.his_semail);
            if (!student) {
                student = studentMapById.get(history.his_semail);
            }

            console.log("========================================================================================")
            console.log("Active ID (his_aid):", history.his_aid, "Homework ID from actives:", homeworkId, "Homework found:", homework)
            console.log("========================================================================================")

            return {
                a_id: history.his_id,
                a_cid: history.his_cid,
                a_semail: history.his_semail,
                a_status: "done",
                h_date: history.his_time,
                h_time: history.his_time,
                homework_name: homework?.h_name || `ชุดฝึก ${homeworkId || 'ไม่ทราบ'}`,
                homework_subject: homework?.h_subject || 'ไม่ระบุวิชา',
                homework_score: homework?.h_score || 0,
                homework_type: homework?.h_type || 'ไม่ระบุประเภท',
                homework_bloom_taxonomy: homework?.h_bloom_taxonomy || 'ไม่ระบุ',
                homework_teacher_email: homework?.h_temail || 'ไม่ระบุ',
                class_name: classs?.c_name || `ห้องเรียน ${history.his_cid}`,
                student_name: student?.s_fullname || 'ไม่ระบุชื่อ',
                student_username: student?.s_username || 'ไม่ระบุ username',
                student_id: student?.s_id || 'ไม่ระบุ ID',
                student_email: student?.s_email || history.his_semail
            };
        });

        console.log("Formatted activities:", formattedActivities);

        return {
            type: "success",
            data: formattedActivities
        };
    } catch (error) {
        console.error("Get activities error:", error);
        return {
            type: "success",
            data: []
        };
    }
}

export {
    addHomeworkToClass,
    getActivesByClassId,
    getHomeworkProgress,
    removeHomeworkFromClass,
    getActivities,
};
