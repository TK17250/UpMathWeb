import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/server/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const supabase = await createSupabaseServerClient()

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found after login');
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
      }
      
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("t_email")
        .eq("t_email", user.email?.toLowerCase())
      
      if ((!teacherData || teacherData.length === 0) && user.email) {
        const { error: insertError } = await supabase
          .from('teachers')
          .insert([{
            t_fullname: user.user_metadata?.full_name || user.email,
            t_username: user.user_metadata?.name || user.email.split('@')[0],
            t_email: user.email,
            t_gender: 'ไม่ระบุ',
            t_age: '0',
          }])
        
        if (insertError) {
          console.error('Error inserting teacher data:', insertError);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}