'use server'
import { createSupabaseServerClient } from "@/server/server"

// Get user
async function getUser() {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        return user
    } catch (error) {
        console.log(error)
    }
}

// Get user data from table
async function getUserData() {
    try {
        const supabase = await createSupabaseServerClient()

        const { data: { user } } = await supabase.auth.getUser()
        const email = user?.email

        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .eq("t_email", email)
            .single()

        if (error) {
            console.log("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ", error.message)
            return null
        }
        
        return data
    } catch (error: any) {
        console.log("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ", error.message)
    }
}

export {
    getUser,
    getUserData,
}