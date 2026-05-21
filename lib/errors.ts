// File: lib/errors.ts

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials':        'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'Email not confirmed':              'กรุณายืนยันอีเมลก่อนเข้าใช้งาน',
  'User already registered':          'อีเมลนี้มีบัญชีอยู่แล้ว',
  'email rate limit exceeded':        'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
  'Email address is invalid':         'รูปแบบอีเมลไม่ถูกต้อง',
  'Password should be at least':      'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
  'Password should contain':          'รหัสผ่านต้องมีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลขอย่างน้อย 1 ตัว',
  'weak_password':                    'รหัสผ่านไม่ปลอดภัยพอ กรุณาตั้งให้ซับซ้อนขึ้น',
  'signup_disabled':                  'ปิดการสมัครสมาชิกชั่วคราว',
  'over_email_send_rate_limit':       'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่',
  'Too many requests':                'คำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
  'Network request failed':           'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  'Failed to fetch':                  'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  'Invalid API key':                  'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง',
  'Not authenticated':                'เซสชันหมดอายุ กรุณา login ใหม่',
};

const SAVE_ERRORS: Record<string, string> = {
  'กรุณาเพิ่มอย่างน้อย 1 รายการ':   'กรุณาเพิ่มอย่างน้อย 1 รายการ',
  'Not authenticated':                'เซสชันหมดอายุ กรุณา login ใหม่',
  'Network request failed':           'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  'Failed to fetch':                  'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  'check constraint':                 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบจำนวนและราคา',
};

export function toAuthError(message: string): string {
  for (const [key, thai] of Object.entries(AUTH_ERRORS)) {
    if (message.includes(key)) return thai;
  }
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

export function toSaveError(message: string): string {
  for (const [key, thai] of Object.entries(SAVE_ERRORS)) {
    if (message.includes(key)) return thai;
  }
  return 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}
