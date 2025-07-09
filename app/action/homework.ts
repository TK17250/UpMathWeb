'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";

// Create homework
async function createHomework(prevState: any, formData: any) {
    try {
        const supabase = await createSupabaseServerClient(); // Call Supabase
        const name = formData.get("h_name");
        const subject = formData.get("h_subject");
        const level = formData.get("h_level");
        const bloomtax = formData.get("h_bloomtax");
        const type = formData.get("h_type");
        const score = formData.get("h_score");
        const content = formData.get("h_content");

        // ------------------------------------ Check State ------------------------------------

        // Check required fields
        if (!name || !subject || !level || !bloomtax || !type || !score) {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณากรอกข้อมูลให้ครบถ้วน", type: "error" };
        }

        // Validate score is a number
        const scoreNumber = parseFloat(score);
        if (isNaN(scoreNumber) || scoreNumber < 0) {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณากรอกคะแนนเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0", type: "error" };
        }

        // Get teacher data
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // ------------------------------------ Manage ------------------------------------

        // Insert homework data to database
        const { error: homeworkError } = await supabase
            .from("homework")
            .insert({
                h_name: name,
                h_temail: userData.t_email,
                h_subject: subject,
                h_level: level,
                h_bloom_taxonomy: bloomtax,
                h_type: type,
                h_score: scoreNumber,
                h_content: content,
            })
            .select()
            .single();
        if (homeworkError) return { title: "เกิดข้อผิดพลาด", message: homeworkError.message, type: "error" };

        return { title: "สำเร็จ", message: "เพิ่มการบ้านเรียบร้อยแล้ว", type: "success" };
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Get homework list
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

// Delete homework
async function deleteHomework(homeworkId: number) {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // First, get the homework to check if it exists
        const { data: homework, error: fetchError } = await supabase
            .from("homework")
            .select("h_id")
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

        return { title: "สำเร็จ", message: "ลบการบ้านเรียบร้อยแล้ว", type: "success" };
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

export {
    createHomework,
    getHomework,
    deleteHomework,
}
