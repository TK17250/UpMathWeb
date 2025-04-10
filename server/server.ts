'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_ANON_KEY || ''

    // Check if SUPABASE_URL and SUPABASE_ANON_KEY is set
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
    }

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value
                },
                set(name, value, options) {
                    try {
                        cookieStore.set(name, value, options)
                    } catch (error) {
                        console.error(`Error setting cookie ${name}:`, error)
                    }
                },
                remove(name, options) {
                    try {
                        cookieStore.set(name, '', { ...options, maxAge: 0 })
                    } catch (error) {
                        console.error(`Error removing cookie ${name}:`, error)
                    }
                }
            },
        }
    )
}