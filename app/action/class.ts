'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUser, getUserData } from "./getuser";
import { translateServerSupabaseErrorToThai } from "@/server/error";

// Function create new class
async function createClass(prevState: any, formData: FormData) {
    try {
        const className = formData.get("className");
        const classBG = formData.get("classBG");

        // ------------------------------------------ Check State ------------------------------------------ 

        // Check empty values
        if (!className || !classBG) {
            return { title: "กรุณากรอกข้อมูลให้ครบถ้วน", message: "กรุณากรอกข้อมูลให้ครบถ้วน", type: "error" };
        }

        const supabase = await createSupabaseServerClient(); // Call the supabase

        // Check if class name already exists
        const { data: classData, error: classCheckError } = await supabase
            .from("classs")
            .select("c_name")
            .eq("c_name", className)
            .single();
        if (classCheckError && classCheckError.code !== 'PGRST116') {
            return { title: "เกิดข้อผิดพลาด", message: classCheckError.message, type: "error" };
        }
        if (classData) return { title: "เกิดข้อผิดพลาด", message: "ชื่อห้องเรียนนี้มีอยู่แล้ว", type: "error" }; // Check class name

        // ------------------------------------------ Manage State ------------------------------------------
        
        // Get user id
        const userData = await getUserData();
        const userId = userData.t_id;
        if (!userId) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" }; // Check user id is null

        // Background management rename
        if (!(classBG instanceof File)) {
            return { title: "เกิดข้อผิดพลาด", message: "ข้อมูลรูปภาพพื้นหลังไม่ถูกต้อง", type: "error" };
        }
        const classBGExt = classBG.name.split(".").pop();
        const classBGNewName = `${Date.now()}.${classBGExt}`;
        const bg_url = `${userId}/${classBGNewName}`; // Background URL

        // Upload background image to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("classbackground")
            .upload(bg_url, classBG);
        if (uploadError) return { title: "เกิดข้อผิดพลาด", message: uploadError.message, type: "error" }; // Check error

        // Insert class data to database
        const { error: classError } = await supabase
            .from("classs")
            .insert({
                c_name: className,
                c_tid: userId,
                c_temail: userData.t_email,
                c_homework: {},
                c_medias: {},
                c_students: {},
                c_banner: bg_url,
            })
            .select()
            .single();
        if (classError) return { title: "เกิดข้อผิดพลาด", message: classError.message, type: "error" }; // Check error

        return { title: "สร้างห้องเรียนสำเร็จ", message: "สร้างห้องเรียนสำเร็จ", type: "success" }; // Success
    } catch (error: any) {
        console.log("Error creating class:", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Get class data
async function getClassData() {
    try {
        const supabase = await createSupabaseServerClient(); // Call the supabase
        const { data: classData, error } = await supabase
            .from("classs")
            .select("*")
            .eq("c_tid", (await getUserData()).t_id) // Get user id
            .order("c_id", { ascending: false });
        if (error) return { title: "เกิดข้อผิดพลาด", message: error.message, type: "error" }; // Check error
        return classData;
    } catch (error: any) {
        console.log("Error getting class data:", error.message);
    }
}

// Get class banner
async function getClassBanner(classId: number) {
    try {
        const supabase = await createSupabaseServerClient(); // Call the supabase

        // Get class data
        const { data: classData, error: classError } = await supabase
            .from("classs")
            .select("c_banner")
            .eq("c_id", classId)
            .single();
        if (classError) return { title: "เกิดข้อผิดพลาด", message: classError.message, type: "error" }; // Check error

        // Get class banner
        const { data: classBanner } = await supabase
            .storage
            .from("classbackground")
            .createSignedUrl(classData.c_banner, 60 * 60); // Get public URL
        if (!classBanner) return { title: "เกิดข้อผิดพลาด", message: "ไม่สามารถดึง URL ของแบนเนอร์ได้", type: "error" }; // Check error

        return classBanner.signedUrl;
    } catch (error: any) {
        console.log("Error getting class banner:", error.message);
    }
}

// Get class data and banner url
async function getClassDataAndBanner() {
    try {
        const classData: any = await getClassData();
        if (!classData) return null;

        // Get class banner
        for (const item of classData) {
            const bannerUrl = await getClassBanner(item.c_id);
            if (bannerUrl) {
                item.c_banner = bannerUrl;
            }
        }

        return classData;
    } catch (error: any) {
        console.log("Error getting class data and banner:", error.message);
    }
}

// Get class data by id
async function getClassDataById(classId: number) {
    try {
        const supabase = await createSupabaseServerClient(); // Call the supabase
        const { data: classData, error } = await supabase
            .from("classs")
            .select("*")
            .eq("c_id", classId)
            .single();
        if (error) return { title: "เกิดข้อผิดพลาด", message: error.message, type: "error" }; // Check error
        
        return classData;
    } catch (error: any) {
        console.log("Error getting class data by id:", error.message);
    }
}

// Update class data
async function updateClassData(prevState: any, formData: FormData) {
    try {
        const supabase = await createSupabaseServerClient(); // Call the supabase
        const classID = formData.get("classID");
        const className = formData.get("className");
        const classBG = formData.get("classBG") as File;

        // Get user
        const userData = await getUserData();
        const userId = userData.t_id;

        // ------------------------------------------ Check State ------------------------------------------

        // Check empty values
        if (!className || !classBG) {
            return { title: "กรุณากรอกข้อมูลให้ครบถ้วน", message: "กรุณากรอกข้อมูลให้ครบถ้วน", type: "error" };
        }

        // Get current class data to check if name is changed
        const { data: currentClassData, error: currentClassError } = await supabase
            .from("classs")
            .select("c_name")
            .eq("c_id", classID)
            .single();
        if (currentClassError) {
            return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(currentClassError.message), type: "error" };
        }

        // Only check for duplicate name if the name is being changed
        if (currentClassData.c_name !== className) {
            // Check class name from database
            const { data: classData, error: classCheckError } = await supabase
                .from("classs")
                .select("c_name")
                .eq("c_name", className)
                .single();
            if (classCheckError && classCheckError.code !== 'PGRST116') {
                return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(classCheckError.message), type: "error" };
            }
            
            if (classData) {
                return { title: "เกิดข้อผิดพลาด", message: "ชื่อห้องเรียนนี้มีอยู่แล้ว", type: "error" };
            }
        }

        // ------------------------------------------- Manage State ------------------------------------------

        // Check file size
        if (classBG.size <= 0) {
            const { error: classUpdateError } = await supabase
                .from("classs")
                .update({ c_name: className })
                .eq("c_id", classID)
                .select()
                .single();
            if (classUpdateError) {
                return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(classUpdateError.message), type: "error" };
            }
        } else {
            // Get old banner
            const { data: oldClassData, error: oldClassError } = await supabase
                .from("classs")
                .select("c_banner")
                .eq("c_id", classID)
                .single();
            if (oldClassError) {
                return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(oldClassError.message), type: "error" };
            }

            // Delete old banner
            const { error: deleteError } = await supabase.storage
                .from("classbackground")
                .remove([oldClassData.c_banner]);
            if (deleteError) {
                return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(deleteError.message), type: "error" };
            }

            // Background management rename
            const classBGExt = classBG.name.split(".").pop();
            const classBGNewName = `${Date.now()}.${classBGExt}`;
            const bg_url = `${userId}/${classBGNewName}`; // Background URL

            // Upload background image to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("classbackground")
                .upload(bg_url, classBG);
            if (uploadError) {
                return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(uploadError.message), type: "error" };
            }

            // Update class data
            const { error: classUpdateError } = await supabase
                .from("classs")
                .update({
                    c_name: className,
                    c_banner: bg_url,
                })
                .eq("c_id", classID)
                .select()
                .single();
            if (classUpdateError) {
                return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(classUpdateError.message), type: "error" };
            }
        }
        
        return { title: "สำเร็จ", message: "อัปเดตข้อมูลสำเร็จ", type: "success" };
    } catch (error: any) {
        console.log("Error updating class data:", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Delete class
async function deleteClass(prevState: any, formData: FormData) {
    try {
        const supabase = await createSupabaseServerClient(); // Call the supabase
        const password = formData.get("password");

        // -------------------------------------------- Check State ------------------------------------------

        // ตรวจสอบว่า password ไม่เป็นค่าว่าง และมี format เป็น "class-" หรือไม่
        if (!password || (typeof password === "string" && !password.includes("class-"))) {
            return { title: "เกิดข้อผิดพลาด", message: "รหัสชั้นเรียนไม่ถูกต้อง", type: "error" };
        }

        // แยก classID จาก password
        const classIDPart = password?.toString().split("-")[1];
        
        // ตรวจสอบว่า classID มีค่าหรือไม่
        if (!classIDPart) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลห้องเรียน", type: "error" };
        }
        
        // ตรวจสอบว่า classID เป็นตัวเลขหรือไม่
        const classID = Number(classIDPart);
        if (isNaN(classID)) {
            return { title: "เกิดข้อผิดพลาด", message: "รหัสชั้นเรียนไม่ถูกต้อง ต้องอยู่ในรูปแบบ class-[number]", type: "error" };
        }

        // Get class data
        const { data: classData, error: classDataError } = await supabase
            .from("classs")
            .select("*")
            .eq("c_id", classID)
            .single();
        
        // ตรวจสอบว่ามีข้อมูลห้องเรียนหรือไม่
        if (!classData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลห้องเรียน", type: "error" };
        }
        
        // ตรวจสอบข้อผิดพลาดจาก Supabase
        if (classDataError) {
            return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(classDataError.message), type: "error" };
        }

        // ------------------------------------------- Delete State ------------------------------------------

        // Delete class data
        const { error: deleteClassError } = await supabase
            .from("classs")
            .delete()
            .eq("c_id", classID);
        if (deleteClassError) {
            return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(deleteClassError.message), type: "error" };
        }

        // Delete class banner
        const { error: deleteBannerError } = await supabase.storage
            .from("classbackground")
            .remove([classData.c_banner]);
        if (deleteBannerError) {
            return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(deleteBannerError.message), type: "error" };
        }

        return { title: "สำเร็จ", message: "ลบห้องเรียนสำเร็จ", type: "success" }; // Success
    } catch (error: any) {
        console.log("Error deleting class:", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

export {
    createClass,
    getClassData,
    getClassBanner,
    getClassDataAndBanner,
    getClassDataById,
    updateClassData,
    deleteClass,
}