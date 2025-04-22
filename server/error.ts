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
  const details = error?.details || '';
  const hint = error?.hint || '';
  
  // For debugging purposes
  console.error('Server Error details:', { errorCode, errorMessage, statusCode, details, hint });
  
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
      
    case errorMessage.includes('Email link is invalid or has expired'):
      return 'ลิงก์อีเมลไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่';
      
    case errorMessage.includes('User not found'):
      return 'ไม่พบบัญชีผู้ใช้นี้ในระบบ';
      
    case errorMessage.includes('New password should be different'):
      return 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม';
      
    case errorMessage.includes('Password recovery'):
      return 'ระบบได้ส่งลิงก์สำหรับกู้คืนรหัสผ่านไปยังอีเมลของคุณแล้ว';
      
    case errorMessage.includes('Password is too weak'):
      return 'รหัสผ่านไม่ปลอดภัยเพียงพอ ควรประกอบด้วยตัวอักษร ตัวเลข และอักขระพิเศษ';
      
    case errorMessage.includes('Password is too common'):
      return 'รหัสผ่านนี้ง่ายเกินไป กรุณาใช้รหัสผ่านที่ซับซ้อนกว่านี้';
      
    case errorMessage.includes('Phone verification'):
      return 'กรุณายืนยันหมายเลขโทรศัพท์ของคุณ';
      
    case errorMessage.includes('Invalid phone'):
      return 'หมายเลขโทรศัพท์ไม่ถูกต้อง';
      
    case errorMessage.includes('Invalid verification code'):
      return 'รหัสยืนยันไม่ถูกต้อง';
      
    case errorMessage.includes('Provider account linked to multiple users'):
      return 'บัญชีผู้ให้บริการนี้ถูกเชื่อมโยงกับผู้ใช้หลายคน กรุณาติดต่อผู้ดูแลระบบ';
      
    case errorMessage.includes('Identity provider already linked'):
      return 'บัญชีนี้ได้เชื่อมโยงกับผู้ให้บริการนี้แล้ว';
      
    case errorMessage.includes('No account linked with this identity provider'):
      return 'ไม่มีบัญชีที่เชื่อมโยงกับผู้ให้บริการนี้';

    // Database errors
    case errorCode === '23505' || errorMessage.includes('unique constraint'):
      return 'ข้อมูลนี้มีอยู่ในระบบแล้ว ไม่สามารถสร้างซ้ำได้';
      
    case errorCode === '23503' || errorMessage.includes('foreign key constraint'):
      return 'ไม่สามารถดำเนินการได้เนื่องจากข้อมูลนี้ถูกใช้งานอยู่';
      
    case (errorCode === '42P01' || (errorMessage.includes('relation') && errorMessage.includes('does not exist'))):
      return 'ไม่พบตารางข้อมูลที่ต้องการ กรุณาติดต่อผู้ดูแลระบบ';
      
    case (errorCode === '42703' || (errorMessage.includes('column') && errorMessage.includes('does not exist'))):
      return 'ไม่พบคอลัมน์ที่ต้องการ กรุณาติดต่อผู้ดูแลระบบ';
      
    case errorCode === '22P02' || (errorMessage.includes('invalid input syntax')):
      return 'รูปแบบข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและแก้ไขข้อมูลของคุณ';
      
    case errorCode === '22003' || (errorMessage.includes('numeric field overflow')):
      return 'ค่าตัวเลขเกินขอบเขตที่กำหนด';
      
    case errorCode === '42P02' || (errorMessage.includes('parameter does not exist')):
      return 'พารามิเตอร์ที่ระบุไม่มีอยู่ กรุณาตรวจสอบการกรอกข้อมูล';
      
    case errorCode === '22007' || (errorMessage.includes('invalid date/time')):
      return 'รูปแบบวันที่หรือเวลาไม่ถูกต้อง';
      
    case errorCode === '42701' || (errorMessage.includes('duplicate column')):
      return 'มีคอลัมน์ซ้ำกันในคำสั่ง SQL';
      
    case errorCode === '23514' || (errorMessage.includes('check constraint')):
      return 'ข้อมูลไม่ผ่านเงื่อนไขการตรวจสอบ กรุณาตรวจสอบความถูกต้อง';
      
    case errorCode === '55P03' || (errorMessage.includes('lock not available')):
      return 'ไม่สามารถล็อคข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
      
    case errorCode === '40001' || (errorMessage.includes('serialization failure')):
      return 'เกิดข้อขัดแย้งในการประมวลผลธุรกรรม กรุณาลองใหม่อีกครั้ง';
      
    case errorCode === '57014' || (errorMessage.includes('query canceled')):
      return 'คำสั่งถูกยกเลิก อาจใช้เวลานานเกินไป';
      
    case errorCode === '42601' || (errorMessage.includes('syntax error')):
      return 'คำสั่ง SQL มีข้อผิดพลาดทางไวยากรณ์ กรุณาติดต่อผู้ดูแลระบบ';
      
    case errorCode === '42P03' || (errorMessage.includes('undefined table')):
      return 'ไม่พบตารางที่ระบุในคำสั่ง';
      
    case errorCode === '0A000' || (errorMessage.includes('not supported')):
      return 'คำสั่งนี้ไม่รองรับในฐานข้อมูล';

    // RLS (Row Level Security) errors
    case errorMessage.includes('Row level security'):
      return 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้';
      
    case errorMessage.includes('new row violates row-level security'):
      return 'ไม่สามารถเพิ่มข้อมูลเนื่องจากขัดกับนโยบายความปลอดภัยระดับแถว';
      
    case errorMessage.includes('RLS'):
      return 'การดำเนินการถูกจำกัดโดยนโยบายความปลอดภัยของระบบ';
      
    // Storage errors
    case (errorMessage.includes('storage') && errorMessage.includes('permission')):
      return 'คุณไม่มีสิทธิ์ในการอัปโหลดหรือเข้าถึงไฟล์นี้';
      
    case (errorMessage.includes('storage') && errorMessage.includes('not found')):
      return 'ไม่พบไฟล์ที่คุณต้องการ';
      
    case (errorMessage.includes('storage') && errorMessage.includes('bucket')):
      return 'ไม่พบที่เก็บข้อมูลที่ระบุ';
      
    case (errorMessage.includes('storage') && errorMessage.includes('exceeded')):
      return 'พื้นที่จัดเก็บข้อมูลเต็ม หรือขนาดไฟล์เกินกำหนด';
      
    case (errorMessage.includes('storage') && errorMessage.includes('format')):
      return 'รูปแบบไฟล์ไม่ถูกต้องหรือไม่รองรับ';
      
    case (errorMessage.includes('storage') && errorMessage.includes('already exists')):
      return 'มีไฟล์ชื่อนี้อยู่ในระบบแล้ว';
      
    // API and rate limiting errors
    case (statusCode === 429 || errorMessage.includes('rate limit')):
      return 'คุณใช้งานระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
      
    case statusCode >= 500:
      return 'เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ในภายหลัง';
      
    case statusCode === 404:
      return 'ไม่พบข้อมูลที่คุณต้องการ';
      
    case statusCode === 403:
      return 'คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้';
      
    case statusCode === 400:
      return 'คำขอไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่ส่ง';
      
    case statusCode === 401:
      return 'กรุณาเข้าสู่ระบบก่อนดำเนินการ';
      
    case statusCode === 405:
      return 'ไม่อนุญาตให้ใช้วิธีการเรียก API นี้';
      
    case statusCode === 413:
      return 'ข้อมูลที่ส่งมีขนาดใหญ่เกินไป';
      
    case statusCode === 422:
      return 'ไม่สามารถประมวลผลข้อมูลได้ กรุณาตรวจสอบความถูกต้อง';
      
    // JWT token errors
    case errorMessage.includes('JWT'):
      return 'เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง';
      
    case errorMessage.includes('token'):
      return 'โทเคนไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่';
      
    case errorMessage.includes('expired'):
      return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
      
    case errorMessage.includes('invalid signature'):
      return 'ลายเซ็นดิจิทัลไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่';
      
    case errorMessage.includes('invalid claims'):
      return 'ข้อมูลสิทธิ์ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่';
      
    // Network errors
    case (errorMessage.includes('network') || errorMessage.includes('Failed to fetch')):
      return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      
    case errorMessage.includes('timeout'):
      return 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
      
    case errorMessage.includes('CORS'):
      return 'เกิดข้อผิดพลาดในการเข้าถึงทรัพยากร กรุณาติดต่อผู้ดูแลระบบ';
      
    case errorMessage.includes('aborted'):
      return 'การเชื่อมต่อถูกยกเลิก กรุณาลองใหม่อีกครั้ง';
      
    // Realtime subscription errors
    case errorMessage.includes('subscription'):
      return 'เกิดข้อผิดพลาดในการติดตามข้อมูลแบบเรียลไทม์';
      
    case errorMessage.includes('channel'):
      return 'ไม่สามารถเชื่อมต่อกับช่องสัญญาณข้อมูลได้';
      
    // Edge function errors
    case errorMessage.includes('Edge function'):
      return 'เกิดข้อผิดพลาดในการเรียกใช้ฟังก์ชัน Edge';
      
    case errorMessage.includes('function timed out'):
      return 'ฟังก์ชันใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
      
    // Webhook errors
    case errorMessage.includes('webhook'):
      return 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง webhook';
      
    // Configuration errors
    case errorMessage.includes('configuration'):
      return 'เกิดข้อผิดพลาดในการตั้งค่าระบบ กรุณาติดต่อผู้ดูแลระบบ';
      
    case errorMessage.includes('project'):
      return 'เกิดข้อผิดพลาดกับโปรเจกต์ Supabase กรุณาติดต่อผู้ดูแลระบบ';
      
    // GoTrue specific errors
    case errorMessage.includes('gotrue'):
      return 'เกิดข้อผิดพลาดในระบบยืนยันตัวตน กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ';
      
    // PostgREST specific errors
    case errorMessage.includes('postgrest'):
      return 'เกิดข้อผิดพลาดในการเข้าถึงฐานข้อมูล กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ';
      
    // Quota/limit errors
    case errorMessage.includes('quota'):
      return 'คุณใช้งานเกินโควต้าที่กำหนด กรุณารอหรือพิจารณาอัปเกรดแพคเกจ';
      
    case errorMessage.includes('limit'):
      return 'การดำเนินการนี้เกินขีดจำกัดที่กำหนด';
      
    // Data validation errors
    case errorMessage.includes('validation'):
      return 'ข้อมูลไม่ผ่านการตรวจสอบความถูกต้อง กรุณาตรวจสอบและแก้ไข';
      
    case errorMessage.includes('invalid input'):
      return 'ข้อมูลที่ป้อนไม่ถูกต้อง กรุณาตรวจสอบและแก้ไข';
      
    case errorMessage.includes('constraint violation'):
      return 'ข้อมูลขัดกับข้อจำกัดในฐานข้อมูล';
      
    // Policy errors
    case errorMessage.includes('policy'):
      return 'การดำเนินการขัดกับนโยบายความปลอดภัยของระบบ';
      
    // Role errors
    case errorMessage.includes('role'):
      return 'บทบาทของผู้ใช้ไม่มีสิทธิ์ในการดำเนินการนี้';
      
    // Transaction errors
    case errorMessage.includes('transaction'):
      return 'เกิดข้อผิดพลาดในการประมวลผลธุรกรรม กรุณาลองใหม่อีกครั้ง';
      
    // Fallback
    default:
      return `เกิดข้อผิดพลาด: ${errorMessage || 'ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง'}`;
  }
}