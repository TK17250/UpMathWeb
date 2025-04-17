'use server'
import { createSupabaseServerClient } from "@/server/server"
import { getUser } from "./getuser"
import { createClient } from "@/server/client"

// Update user data
async function updateSetting(prevState: any, formData: FormData) {
    try {
        const fullname = formData.get("fullname") as string
        const name = formData.get("name") as string
        const gender = formData.get("gender") as string
        const age = formData.get("age") as string

        // Check empty fields
        if (!fullname || !name || !gender || !age) {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณากรอกข้อมูลให้ครบ", type: "error" }
        }

        const user = await getUser()
        const email = user?.email

        // Check email empty
        if (!email) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบอีเมลผู้ใช้", type: "error" }
        }

        // Update data
        const supabase = await createSupabaseServerClient()
        const { error } = await supabase
                                    .from('teachers')
                                    .update({ 
                                        t_fullname: fullname,
                                        t_username: name,
                                        t_gender: gender,
                                        t_age: age,
                                    })
                                    .eq('t_email', email)
                                    .select()
        // Check error
        if (error) return { title: "เกิดข้อผิดพลาด", message: error.message, type: "error" }

        return { title: "สำเร็จ", message: "อัพเดตข้อมูลสำเร็จ", type: "success" }
    } catch (error: any) {
        console.log('Error updating setting:', error.message)
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", messages: error.message, type: "error" }
    }
}

// Update password
async function updatePassword(prevState: any, formData: FormData) {
    try {
        const oldPassword = formData.get("password") as string
        const newPassword = formData.get("newpassword") as string
        const confirmPassword = formData.get("confirmpassword") as string

        // Check empty fields
        if (!oldPassword || !newPassword || !confirmPassword) {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณากรอกข้อมูลให้ครบ", type: "error" }
        }

        // Check password match
        if (newPassword !== confirmPassword) {
            return { title: "เกิดข้อผิดพลาด", message: "รหัสผ่านใหม่ไม่ตรงกัน", type: "error" }
        }

        const user = await getUser()
        const email = user?.email

        // Check email empty
        if (!email) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบอีเมลผู้ใช้", type: "error" }
        }

        // Check old password
        const supabase = await createSupabaseServerClient()
        const { data, error: passwordError } = await supabase.auth.signInWithPassword({
            email,
            password: oldPassword,
        })
        if (passwordError) return { title: "เกิดข้อผิดพลาด", message: passwordError.message == "Invalid login credentials" ? "รหัสผ่านเก่าไม่ถูกต้อง" : passwordError.message, type: "error" } // Check error
        if (!data) return { title: "เกิดข้อผิดพลาด", message: "รหัสผ่านไม่ถูกต้อง", type: "error" } // Check user data

        // Update data
        const { error } = await supabase.auth.updateUser({
            email,
            password: newPassword,
        })
        if (error) return { title: "เกิดข้อผิดพลาด", message: error.message, type: "error" } // Check error

        return { title: "สำเร็จ", message: "อัพเดตรหัสผ่านสำเร็จ", type: "success" }
    } catch (error: any) {
        console.log('Error updating password:', error.message)
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", messages: error.message, type: "error" }
    }
}

// Delete account
async function deleteAccount() {
    try {
        // ดึงข้อมูลผู้ใช้ปัจจุบัน
        const user = await getUser();
        
        // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
        if (!user || !user.email || !user.id) {
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ไม่พบข้อมูลผู้ใช้", 
                type: "error" 
            };
        }

        const email = user.email;
        const userId = user.id;

        // สร้าง Supabase client สำหรับการดำเนินการปกติ
        const supabase = await createSupabaseServerClient();
        
        // ลบข้อมูลผู้ใช้จากตาราง teachers
        const { error: deleteError } = await supabase
            .from('teachers')
            .delete()
            .eq('t_email', email);
            
        // ตรวจสอบข้อผิดพลาดในการลบข้อมูล
        if (deleteError) {
            console.error("Error deleting user data:", deleteError);
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: "ไม่สามารถลบข้อมูลผู้ใช้ได้: " + deleteError.message, 
                type: "error" 
            };
        }

        // สร้าง Supabase admin client เพื่อลบบัญชี
        const supabaseAdmin = createClient();
        
        // ตรวจสอบว่าสร้าง admin client สำเร็จหรือไม่
        if (!supabaseAdmin) {
            console.error("Failed to create admin client");
            return {
                title: "คำเตือน",
                message: "ลบข้อมูลผู้ใช้สำเร็จ แต่ไม่สามารถสร้าง admin client เพื่อลบบัญชีได้",
                type: "warning"
            };
        }

        // ลบผู้ใช้จาก Auth - ใช้ try/catch เพื่อจับข้อผิดพลาดโดยเฉพาะ
        try {
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
            if (deleteAuthError) {
                console.error("Error deleting auth user:", deleteAuthError);
                return { 
                    title: "คำเตือน", 
                    message: "ลบข้อมูลผู้ใช้สำเร็จ แต่ไม่สามารถลบบัญชีได้: " + deleteAuthError.message, 
                    type: "warning" 
                };
            }
        } catch (adminError: any) {
            console.error("Exception in admin.deleteUser:", adminError);
            return { 
                title: "คำเตือน", 
                message: "ลบข้อมูลผู้ใช้สำเร็จ แต่เกิดข้อผิดพลาดในการลบบัญชี: " + (adminError.message || "ไม่ทราบสาเหตุ"), 
                type: "warning" 
            };
        }

        // ออกจากระบบหลังจากลบข้อมูลสำเร็จ
        const { error: signOutError } = await supabase.auth.signOut();
        
        // ตรวจสอบข้อผิดพลาดในการออกจากระบบ
        if (signOutError) {
            console.error("Error signing out:", signOutError);
            return { 
                title: "คำเตือน", 
                message: "ลบบัญชีผู้ใช้สำเร็จ แต่ไม่สามารถออกจากระบบได้: " + signOutError.message, 
                type: "warning" 
            };
        }

        // คืนค่าสำเร็จ
        return { 
            title: "สำเร็จ", 
            message: "ลบบัญชีของคุณเรียบร้อยแล้ว", 
            type: "success" 
        };
    } catch (error: any) {
        // จัดการกับข้อผิดพลาดทั่วไป
        console.error('Error in deleteAccount function:', error);
        return { 
            title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", 
            message: error.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ", 
            type: "error" 
        };
    }
}

export {
    updateSetting,
    updatePassword,
    deleteAccount,
}