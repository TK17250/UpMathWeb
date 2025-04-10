'use server';

/**
 * Translates Supabase error messages to Thai language (Server Action)
 * @param {Error} error - The error object from Supabase
 * @returns {string} Translated error message in Thai
 */
export async function translateServerSupabaseErrorToThai(error: any): Promise<string> {
  // Extract error code or message from various Supabase error formats
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';
  const statusCode = error?.status || error?.statusCode || '';
  
  // For debugging purposes
  console.error('Server Error details:', { errorCode, errorMessage, statusCode });
  
  // Handle common Supabase error patterns
  switch (true) {
    // Authentication errors
    case errorMessage.includes('Invalid login credentials'):
      return 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง กรุณาตรวจสอบอีเมลและรหัสผ่านของคุณ';
      
    case errorMessage.includes('Email not confirmed'):
      return 'อีเมลยังไม่ได้รับการยืนยัน กรุณาตรวจสอบอีเมลของคุณและทำการยืนยัน';
      
    case errorMessage.includes('User already registered'):
      return 'อีเมลนี้ได้ลงทะเบียนไว้แล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ';
      
    case errorMessage.includes('Password should be at least'):
      return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    
    case errorMessage.includes('Email format is invalid'):
      return 'รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';

    // Database errors  
    case errorCode === '23505' || errorMessage.includes('unique constraint'):
      return 'ข้อมูลนี้มีอยู่ในระบบแล้ว ไม่สามารถสร้างซ้ำได้';
      
    case errorCode === '23503' || errorMessage.includes('foreign key constraint'):
      return 'ไม่สามารถดำเนินการได้เนื่องจากข้อมูลนี้ถูกใช้งานอยู่';
      
    case (errorCode === '42P01' || (errorMessage.includes('relation') && errorMessage.includes('does not exist'))):
      return 'ไม่พบตารางข้อมูลที่ต้องการ กรุณาติดต่อผู้ดูแลระบบ';
      
    case (errorCode === '42703' || (errorMessage.includes('column') && errorMessage.includes('does not exist'))):
      return 'ไม่พบคอลัมน์ที่ต้องการ กรุณาติดต่อผู้ดูแลระบบ';

    // RLS (Row Level Security) errors
    case errorMessage.includes('Row level security'):
      return 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้';
      
    // Storage errors
    case (errorMessage.includes('storage') && errorMessage.includes('permission')):
      return 'คุณไม่มีสิทธิ์ในการอัปโหลดหรือเข้าถึงไฟล์นี้';
      
    case (errorMessage.includes('storage') && errorMessage.includes('not found')):
      return 'ไม่พบไฟล์ที่คุณต้องการ';
      
    // API and rate limiting errors
    case (statusCode === 429 || errorMessage.includes('rate limit')):
      return 'คุณใช้งานระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
      
    case statusCode >= 500:
      return 'เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ในภายหลัง';
      
    case statusCode === 404:
      return 'ไม่พบข้อมูลที่คุณต้องการ';
      
    case statusCode === 403:
      return 'คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้';
      
    // JWT token errors
    case errorMessage.includes('JWT'):
      return 'เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
      
    // Network errors
    case (errorMessage.includes('network') || errorMessage.includes('Failed to fetch')):
      return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      
    // Fallback
    default:
      return `เกิดข้อผิดพลาด: ${errorMessage || 'ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง'}`;
  }
}