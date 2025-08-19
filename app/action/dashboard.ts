"use server";

import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";

// Cache user data to avoid repeated calls
let cachedUserData: any = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedUserData() {
    const now = Date.now();
    if (cachedUserData && (now - cacheTime < CACHE_DURATION)) {
        return cachedUserData;
    }
    
    cachedUserData = await getUserData();
    cacheTime = now;
    return cachedUserData;
}

// Optimized dashboard statistics with single query approach
async function getDashboardStats() {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getCachedUserData();
        
        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        console.log("Fetching dashboard stats for:", userData.t_email);

        // Use Promise.allSettled to prevent one failure from breaking everything
        const [
            classResult,
            homeworkResult,
            activesResult,
            studentsResult,
            mediaResult
        ] = await Promise.allSettled([
            // Get total classes
            supabase
                .from("classs")
                .select("c_id, c_students", { count: 'exact' })
                .eq("c_tid", userData.t_id),

            // Get total homework
            supabase
                .from("homework")
                .select("h_id, h_subject, h_score, h_name", { count: 'exact' })
                .eq("h_temail", userData.t_email),

            // Get total actives (submissions) with status filter
            supabase
                .from("actives")
                .select("a_id, a_status, a_homework, a_cid", { count: 'exact' })
                .eq("a_temail", userData.t_email),

            // Get students data
            supabase
                .from("students")
                .select("s_id", { count: 'exact' })
                .eq("s_temail", userData.t_email),

            // Get media data
            supabase
                .from("medias")
                .select("m_id", { count: 'exact' })
                .eq("m_temail", userData.t_email)
        ]);

        // Extract data safely with fallbacks
        const classData = classResult.status === 'fulfilled' ? classResult.value.data : [];
        const homeworkData = homeworkResult.status === 'fulfilled' ? homeworkResult.value.data : [];
        const activesData = activesResult.status === 'fulfilled' ? activesResult.value.data : [];
        const studentsData = studentsResult.status === 'fulfilled' ? studentsResult.value.data : [];
        const mediaData = mediaResult.status === 'fulfilled' ? mediaResult.value.data : [];

        // Log any errors but don't fail completely
        [classResult, homeworkResult, activesResult, studentsResult, mediaResult].forEach((result, index) => {
            if (result.status === 'rejected') {
                const tableName = ['classes', 'homework', 'actives', 'students', 'medias'][index];
                console.warn(`Warning: Failed to fetch ${tableName}:`, result.reason);
            }
        });

        // Calculate statistics with safe fallbacks
        const totalClasses = classData?.length || 0;
        const totalHomework = homeworkData?.length || 0;
        const totalStudents = studentsData?.length || 0;
        const totalSubmissions = activesData?.length || 0;
        const totalMedia = mediaData?.length || 0;

        // Optimize homework completion calculation
        let topCompletedHomework: { subject: string; count: number }[] = [];
        
        if (activesData && homeworkData && activesData.length > 0 && homeworkData.length > 0) {
            try {
                // Filter completed submissions only
                const completedSubmissions = activesData.filter(active => active.a_status === "done");
                
                if (completedSubmissions.length > 0) {
                    // Create homework name mapping for efficiency
                    const homeworkMap = new Map(
                        homeworkData.map(hw => [hw.h_id, hw.h_name || `ชุดฝึก ${hw.h_id}`])
                    );
                    
                    // Count completions per homework
                    const completionCounts = new Map<number, number>();
                    
                    completedSubmissions.forEach(active => {
                        let homeworkId: number;
                        
                        if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                            homeworkId = active.a_homework.id;
                        } else if (typeof active.a_homework === 'number') {
                            homeworkId = active.a_homework;
                        } else {
                            return;
                        }
                        
                        completionCounts.set(homeworkId, (completionCounts.get(homeworkId) || 0) + 1);
                    });
                    
                    // Get top 5 most completed homework
                    topCompletedHomework = Array.from(completionCounts.entries())
                        .map(([homeworkId, count]) => ({
                            subject: homeworkMap.get(homeworkId) || `ชุดฝึก ${homeworkId}`,
                            count
                        }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                }
            } catch (error) {
                console.warn("Error calculating homework completion stats:", error);
                topCompletedHomework = [];
            }
        }

        console.log("Dashboard stats calculated successfully:", {
            totalClasses,
            totalHomework,
            totalStudents,
            totalSubmissions,
            totalMedia,
            topSubjectsCount: topCompletedHomework.length
        });

        return {
            type: "success",
            data: {
                totalClasses,
                totalHomework,
                totalStudents,
                totalSubmissions,
                totalMedia,
                topSubjects: topCompletedHomework,
                hasData: totalClasses > 0 || totalHomework > 0 || totalStudents > 0
            }
        };
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return { 
            title: "เกิดข้อผิดพลาด", 
            message: "เกิดข้อผิดพลาดในการดึงข้อมูล", 
            type: "error" 
        };
    }
}

// Optimized homework count per class with better error handling
async function getLowestScoringHomework() {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getCachedUserData();
        
        if (!userData) {
            console.log("No user data found");
            return [];
        }

        console.log("Fetching class homework counts for:", userData.t_email);

        // Fetch classes and actives in parallel
        const [classResult, activesResult] = await Promise.allSettled([
            supabase
                .from("classs")
                .select("c_id, c_name")
                .eq("c_tid", userData.t_id),
                
            supabase
                .from("actives")
                .select("a_id, a_cid, a_homework")
                .eq("a_temail", userData.t_email)
        ]);

        // Handle results safely
        const classData = classResult.status === 'fulfilled' ? classResult.value.data : null;
        const activesData = activesResult.status === 'fulfilled' ? activesResult.value.data : null;

        // Log warnings for failed queries
        if (classResult.status === 'rejected') {
            console.warn("Failed to fetch classes:", classResult.reason);
        }
        if (activesResult.status === 'rejected') {
            console.warn("Failed to fetch actives:", activesResult.reason);
        }

        // Return empty array if critical data is missing
        if (!classData || classData.length === 0) {
            console.log("No classes found or failed to fetch classes");
            return [];
        }

        console.log(`Found ${classData.length} classes, ${activesData?.length || 0} active assignments`);

        // Initialize class homework counts
        const classHomeworkCounts = new Map<string, { name: string, homeworkIds: Set<number> }>();
        
        classData.forEach(cls => {
            classHomeworkCounts.set(cls.c_id.toString(), {
                name: cls.c_name || `ห้องเรียน ${cls.c_id}`,
                homeworkIds: new Set()
            });
        });

        // Count unique homework assignments per class
        if (activesData && activesData.length > 0) {
            activesData.forEach(active => {
                const classId = active.a_cid?.toString();
                
                if (classId && classHomeworkCounts.has(classId)) {
                    // Extract homework ID safely
                    let homeworkId: number | null = null;
                    
                    try {
                        if (typeof active.a_homework === 'object' && active.a_homework?.id) {
                            homeworkId = active.a_homework.id;
                        } else if (typeof active.a_homework === 'number') {
                            homeworkId = active.a_homework;
                        }
                        
                        if (homeworkId !== null) {
                            const classData = classHomeworkCounts.get(classId);
                            if (classData) {
                                classData.homeworkIds.add(homeworkId);
                            }
                        }
                    } catch (error) {
                        console.warn("Error processing homework ID for active:", active.a_id);
                    }
                }
            });
        }

        // Format data for chart with better performance
        const formattedData = Array.from(classHomeworkCounts.values())
            .map(data => ({
                name: data.name,
                count: data.homeworkIds.size
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        console.log(`Returning ${formattedData.length} formatted class homework counts`);

        return formattedData;
    } catch (error) {
        console.error("Get class homework count error:", error);
        return [];
    }
}

// Lightweight database connection test
async function testDatabaseConnection() {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getCachedUserData();
        
        if (!userData) {
            return { success: false, message: "No user data" };
        }

        return { success: true, message: "Database connected", user: userData.t_email };
    } catch (error) {
        console.error("Database test error:", error);
        return { success: false, message: "Database connection failed" };
    }
}

export { getDashboardStats, getLowestScoringHomework, testDatabaseConnection };