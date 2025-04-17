'use server'
import { createSupabaseServerClient } from "@/server/server"
import { getUser } from "./getuser"

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

export {
    updateSetting,
    updatePassword,
}