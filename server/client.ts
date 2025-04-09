import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl: string = process.env.SUPABASE_URL || ''
    const supabaseKey: string = process.env.SUPABASE_ANON_KEY || ''

    // Check if SUPABASE_URL and SUPABASE_ANON_KEY is set
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')
    }
    
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}