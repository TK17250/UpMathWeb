'use server'
import { createSupabaseServerClient } from "@/server/server"
import { translateServerSupabaseErrorToThai } from "@/server/error"
import { NextResponse } from "next/server"

// Login
async function login(prevState: any, formData: FormData): Promise<any> {
    try {
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        const supabase = await createSupabaseServerClient()

        // Check empty
        if (!email || !password) {
            return {
                title: "กรุณากรอกข้อมูลให้ครบ",
                message: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
                type: "warning",
            }
        }

        // ----------------------------- Login -----------------------------
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        // Check error login
        if (error) return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(error), type: "error", }

        return { title: "สำเร็จ", message: "เข้าสู่ระบบสำเร็จ", type: "success", }
    } catch (error: any) {
        console.log(`เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์: ${error.message}`)
        return { title: "เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์", message: "กรุณาลองใหม่ภายหลัง", type: "error", }
    }
}

// Register
async function register(prevState: any, formData: FormData): Promise<any> {
    try {
        const fullname = formData.get("fullname") as string
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const gender = formData.get("gender") as string
        const age = formData.get("age") as string
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmpassword") as string

        const supabase = await createSupabaseServerClient()

        // Check empty
        if (!fullname || !name || !email || !gender || !age || !password || !confirmPassword) {
            return {
                title: "กรุณากรอกข้อมูลให้ครบ",
                message: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
                type: "warning",
            }
        }

        // Check password
        if (password !== confirmPassword) {
            return {
                title: "รหัสผ่านไม่ตรงกัน",
                message: "กรุณากรอกรหัสผ่านให้ตรงกัน",
                type: "warning",
            }
        }

        // Check email
        const normalizedEmail = email.toLowerCase()
        const { data: emailCheck } = await supabase
            .from("teachers")
            .select("t_email")
            .eq("t_email", normalizedEmail)
            .single()
        if (emailCheck) return { title: "อีเมลนี้มีผู้ใช้งานแล้ว", message: "กรุณาใช้อีเมลอื่น", type: "warning", }

        // ----------------------------- Register -----------------------------
        const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: password,
        })
        //  Check error register 
        if (error) return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(error), type: "error", }

        // ------------------------- Insert user data -------------------------
        if (data["user"]) {
            // Login
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            })
            // Check error login
            if (loginError) return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(loginError), type: "error", }

            // Insert user data
            const { error: userError } = await supabase
                .from("teachers")
                .insert([{
                    t_fullname: fullname,
                    t_username: name,
                    t_email: normalizedEmail,
                    t_gender: gender,
                    t_age: age,
                }])

            // Check error insert user data
            if (userError) return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(userError), type: "error", }
        }

        return { title: "สำเร็จ", message: "เข้าสู่ระบบสำเร็จ", type: "success", }
    } catch (error: any) {
        console.log(`เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์: ${error.message}`)
        return { title: "เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์", message: "กรุณาลองใหม่ภายหลัง", type: "error", }
    }
}

// Google Login
async function googleLogin() {
    try {
        const supabase = await createSupabaseServerClient()
        
        // ตรวจสอบว่าเราใช้ URL ที่ถูกต้อง
        const getBaseUrl = () => {
            if (process.env.VERCEL_URL) {
                return `https://${process.env.VERCEL_URL}`;
            }
            return 'http://localhost:3000';
        };
        
        const baseUrl = getBaseUrl();
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${baseUrl}/auth/callback`,
                scopes: 'email profile',
            },
        })

        // Check error login
        if (error) {
            console.error('Google login error:', error);
            return { 
                title: "เกิดข้อผิดพลาด", 
                message: translateServerSupabaseErrorToThai(error), 
                type: "error", 
            }
        }

        // Check data
        if (data && data.url) {
            return { 
                title: "สำเร็จ", 
                message: "กำลังนำทางไปยัง Google...", 
                type: "success",
                url: data.url
            }
        }

        return { 
            title: "ไม่สามารถเข้าสู่ระบบได้", 
            message: "ไม่ได้รับ URL สำหรับการเข้าสู่ระบบ", 
            type: "error", 
        }
    } catch (error: any) {
        console.log(`เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์: ${error.message}`)
        return { 
            title: "เกิดข้อผิดพลาดทางฝั่งเซิร์ฟเวอร์", 
            message: "กรุณาลองใหม่ภายหลัง", 
            type: "error", 
        }
    }
}

// Logout
async function logout() {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.log(error)
        return { title: "เกิดข้อผิดพลาด", message: translateServerSupabaseErrorToThai(error), type: "error", }
    }
    return { title: "สำเร็จ", message: "ออกจากระบบเรียบร้อยแล้ว", type: "success", }
}

export {
    register,
    login,
    googleLogin,
    logout,
}