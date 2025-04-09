'use server'
import { createSupabaseServerClient } from "@/server/server"

// Get user
export async function getUser() {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        return user
    } catch (error) {
        console.log(error)
    }
}