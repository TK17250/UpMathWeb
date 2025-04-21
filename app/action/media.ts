'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";

// Create media
async function createMedia(prevState: any, formData: any) {
    try {
        const supabase = await createSupabaseServerClient(); // Call Supabase
        const name = formData.get("m_name");
        const media = formData.get("m_media");
        const period = formData.get("m_period");
        const description = formData.get("m_media_content");

        // ------------------------------------ Check State ------------------------------------

        // Check empty
        if (!name || !media || !period || !description) {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณากรอกข้อมูลให้ครบถ้วน", type: "error" };
        }

        // Check file type
        const fileType = media.type.split("/")[0];
        if (fileType !== "image" && fileType !== "video") {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณาอัพโหลดไฟล์รูปภาพหรือวิดีโอเท่านั้น", type: "error" };
        }

        // Check file size max 50MB
        const fileSize = media.size / 1024 / 1024;
        if (fileSize > 50) {
            return { title: "เกิดข้อผิดพลาด", message: "ขนาดไฟล์ต้องไม่เกิน 50MB", type: "error" };
        }

        // Check file name
        const fileName = media.name.split(".");
        const fileExtension = fileName[fileName.length - 1];
        const allowedExtensions = ["jpg", "jpeg", "png", "mp4", "mov"];
        if (!allowedExtensions.includes(fileExtension)) {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณาอัพโหลดไฟล์รูปภาพหรือวิดีโอเท่านั้น", type: "error" };
        }

        // Get teacher data
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Check media name form data
        const { data: mediaNameData, error: mediaNameError } = await supabase
            .from("medias")
            .select("m_name")
            .eq("m_name", name)
            .single();
        if (!mediaNameError) return { title: "เกิดข้อผิดพลาด", message: "ไม่สามารถตรวจสอบชื่อสื่อได้", type: "error" };
        if (mediaNameData) return { title: "เกิดข้อผิดพลาด", message: "มีชื่อสื่ออยู่ในระบบแล้ว", type: "error" };

        // ------------------------------------ Manage ------------------------------------

        // Rename file;
        const fileNameNew = `${userData.t_id}/${Date.now()}.${fileExtension}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
            .from("medias")
            .upload(fileNameNew, media);
        if (uploadError) return { title: "เกิดข้อผิดพลาด", message: uploadError.message, type: "error" };

        // Insert media data to database
        const { error: mediaError } = await supabase
            .from("medias")
            .insert({
                m_name: name,
                m_tid: userData.t_id,
                m_temail: userData.t_email,
                m_period: period,
                m_media: {
                    file_name: fileNameNew,
                    description: description,
                },
            })
            .select()
            .single();
        if (mediaError) return { title: "เกิดข้อผิดพลาด", message: mediaError.message, type: "error" };

        return { title: "สำเร็จ", message: "อัพโหลดสื่อเรียบร้อยแล้ว", type: "success" };
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Read media
async function getMedia() {
    try {
        const supabase = await createSupabaseServerClient(); // Call Supabase
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Get media data
        const { data: mediaData, error: mediaError } = await supabase
            .from("medias")
            .select("*")
            .eq("m_temail", userData.t_email)
            .order("m_id", { ascending: false });
        if (mediaError) return { title: "เกิดข้อผิดพลาด", message: mediaError.message, type: "error" };

        return mediaData;
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

export {
    createMedia,
    getMedia,
}