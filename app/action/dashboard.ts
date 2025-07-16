"use server";

import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";

// Get dashboard statistics
async function getDashboardStats() {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        
        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        // Get total classes
        const { data: classData, error: classError } = await supabase
            .from("classs")
            .select("c_id, c_students")
            .eq("c_tid", userData.t_id);

        if (classError) {
            console.error("Class fetch error:", classError);
            return { title: "เกิดข้อผิดพลาด", message: classError.message, type: "error" };
        }

        // Get total homework
        const { data: homeworkData, error: homeworkError } = await supabase
            .from("homework")
            .select("h_id, h_subject, h_score, h_name")
            .eq("h_temail", userData.t_email);

        if (homeworkError) {
            console.error("Homework fetch error:", homeworkError);
            return { title: "เกิดข้อผิดพลาด", message: homeworkError.message, type: "error" };
        }

        // Get total actives (submissions)
        const { data: activesData, error: activesError } = await supabase
            .from("actives")
            .select("a_id, a_status, a_homework, a_cid")
            .eq("a_temail", userData.t_email);

        if (activesError) {
            console.error("Actives fetch error:", activesError);
            return { title: "เกิดข้อผิดพลาด", message: activesError.message, type: "error" };
        }

        // Get students data
        const { data: studentsData, error: studentsError } = await supabase
            .from("students")
            .select("s_id, s_name, s_email")
            .eq("s_temail", userData.t_email);

        if (studentsError) {
            console.error("Students fetch error:", studentsError);
        }

        // Get media data
        const { data: mediaData, error: mediaError } = await supabase
            .from("medias")
            .select("m_id, m_name")
            .eq("m_temail", userData.t_email);

        if (mediaError) {
            console.error("Media fetch error:", mediaError);
        }

        // Calculate statistics
        const totalClasses = classData?.length || 0;
        const totalHomework = homeworkData?.length || 0;
        const totalStudents = studentsData?.length || 0;
        const totalSubmissions = activesData?.length || 0;
        const totalMedia = mediaData?.length || 0;

        // Get subject distribution for the chart
        const subjectStats: { [key: string]: number } = {};
        if (homeworkData) {
            homeworkData.forEach(hw => {
                if (hw.h_subject) {
                    subjectStats[hw.h_subject] = (subjectStats[hw.h_subject] || 0) + 1;
                }
            });
        }

        // Get top subjects by homework count
        const topSubjects = Object.entries(subjectStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([subject, count]) => ({ subject, count }));

        // Get top 5 homework assignments that students have finished the most
        const homeworkCompletionStats: { [key: string]: { name: string, count: number } } = {};
        
        // Get completed homework submissions - using separate queries to avoid foreign key issues
        const { data: completedHomework, error: completedError } = await supabase
            .from("actives")
            .select("a_id, a_homework, a_status")
            .eq("a_temail", userData.t_email)
            .eq("a_status", "done");

        if (!completedError && completedHomework && completedHomework.length > 0) {
            // Get unique homework IDs from completed submissions
            const completedHomeworkIds = new Set<number>();
            completedHomework.forEach(active => {
                if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                    completedHomeworkIds.add(active.a_homework.id);
                } else if (typeof active.a_homework === 'number') {
                    completedHomeworkIds.add(active.a_homework);
                }
            });

            // Get homework details for completed submissions
            const { data: completedHomeworkDetails, error: homeworkDetailsError } = await supabase
                .from("homework")
                .select("h_id, h_name")
                .in("h_id", Array.from(completedHomeworkIds));

            if (!homeworkDetailsError && completedHomeworkDetails) {
                const homeworkNameMap = new Map(completedHomeworkDetails.map(hw => [hw.h_id, hw.h_name]));

                completedHomework.forEach(active => {
                    let homeworkId: number;
                    if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                        homeworkId = active.a_homework.id;
                    } else if (typeof active.a_homework === 'number') {
                        homeworkId = active.a_homework;
                    } else {
                        return;
                    }

                    const homeworkName = homeworkNameMap.get(homeworkId) || `ชุดฝึก ${homeworkId}`;
                    
                    if (!homeworkCompletionStats[homeworkId]) {
                        homeworkCompletionStats[homeworkId] = {
                            name: homeworkName,
                            count: 0
                        };
                    }
                    homeworkCompletionStats[homeworkId].count++;
                });
            }
        }

        // Get top 5 most completed homework
        const topCompletedHomework = Object.values(homeworkCompletionStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(hw => ({ subject: hw.name, count: hw.count }));

        return {
            type: "success",
            data: {
                totalClasses,
                totalHomework,
                totalStudents,
                totalSubmissions,
                totalMedia,
                topSubjects: topCompletedHomework, // Replace topSubjects with topCompletedHomework
                hasData: totalClasses > 0 || totalHomework > 0 || totalStudents > 0
            }
        };
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return { title: "เกิดข้อผิดพลาด", message: "เกิดข้อผิดพลาดในการดึงข้อมูล", type: "error" };
    }
}

// Get homework count per class
async function getLowestScoringHomework() {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        
        if (!userData) {
            console.log("No user data found");
            return [];
        }

        console.log("User data:", userData.t_email);

        // Get all classes for this teacher
        const { data: classData, error: classError } = await supabase
            .from("classs")
            .select("c_id, c_name")
            .eq("c_tid", userData.t_id);

        console.log("Class data:", classData);
        console.log("Class error:", classError);

        if (classError) {
            console.error("Class fetch error:", classError);
            return [];
        }

        if (!classData || classData.length === 0) {
            console.log("No classes found");
            return [];
        }

        // Get all actives (homework assignments) for this teacher
        const { data: activesData, error: activesError } = await supabase
            .from("actives")
            .select("a_id, a_cid, a_homework")
            .eq("a_temail", userData.t_email);

        console.log("All actives data:", activesData);
        console.log("Actives error:", activesError);

        if (activesError) {
            console.error("Actives fetch error:", activesError);
            return [];
        }

        // Count unique homework assignments per class
        const classHomeworkCounts: { [key: string]: { name: string, homeworkIds: Set<number> } } = {};

        // Initialize all classes with zero count
        classData.forEach(cls => {
            classHomeworkCounts[cls.c_id] = {
                name: cls.c_name || `ห้องเรียน ${cls.c_id}`,
                homeworkIds: new Set()
            };
        });

        // Count unique homework assignments per class
        if (activesData && activesData.length > 0) {
            activesData.forEach(active => {
                const classId = active.a_cid;
                
                if (classHomeworkCounts[classId]) {
                    // Get homework ID from activity
                    let homeworkId: number;
                    if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                        homeworkId = active.a_homework.id;
                    } else if (typeof active.a_homework === 'number') {
                        homeworkId = active.a_homework;
                    } else {
                        return; // Skip invalid entries
                    }

                    // Add homework ID to the set (automatically handles duplicates)
                    classHomeworkCounts[classId].homeworkIds.add(homeworkId);
                }
            });
        }

        console.log("Class homework counts:", classHomeworkCounts);

        // Format data for chart
        const formattedData = Object.entries(classHomeworkCounts)
            .map(([classId, data]) => ({
                name: data.name,
                count: data.homeworkIds.size // Count of unique homework assignments
            }))
            .sort((a, b) => b.count - a.count) // Sort by highest count first
            .slice(0, 10); // Get top 10 classes

        console.log("Formatted data:", formattedData);

        return formattedData;
    } catch (error) {
        console.error("Get class homework count error:", error);
        return [];
    }
}

// Test database connection
async function testDatabaseConnection() {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        
        if (!userData) {
            return { success: false, message: "No user data" };
        }

        return { success: true, message: "Database connected", user: userData };
    } catch (error) {
        console.error("Database test error:", error);
        return { success: false, message: "Database connection failed" };
    }
}

export { getDashboardStats, getLowestScoringHomework, testDatabaseConnection };
