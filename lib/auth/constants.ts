// 認證表單的長度限制。client 端 input（minLength/maxLength）與
// server 端 zod schema 共用同一組數值，避免兩邊各寫一份而漂移。
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 50;
