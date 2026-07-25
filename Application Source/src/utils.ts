import Swal from 'sweetalert2';
import { getSupabase } from './lib/supabase';

export async function hashPasswordSHA256(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function handleLogout() {
  localStorage.removeItem("smart_school_user");
  window.location.href = "/login";
}

export function translateRole(role: string) {
  const roles: Record<string, string> = { 'admin': 'مدیر', 'teacher': 'معلم', 'service': 'خدمات' };
  return roles[role] || role;
}

export function translateStatus(status: string) {
  if (status === "COOLING") return "سرمایش";
  if (status === "HEATING") return "گرمایش";
  if (status === "IDEAL") return "نرمال";
  if (status === "ECO_MODE") return "صرفه‌جویی";
  if (status === "SAFE_RESET") return "ریست";
  return "خاموش";
}

export const showAlert = (title: string, text: string = '', icon: any = 'success') => {
  return Swal.fire({
    title,
    text,
    icon,
    timer: icon === 'success' ? 1000 : undefined,
    showConfirmButton: icon !== 'success',
    background: '#1e293b',
    color: '#f8fafc'
  });
};

export const showConfirm = (title: string, text: string, confirmText: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#3b82f6',
    confirmButtonText: confirmText,
    cancelButtonText: 'انصراف',
    background: '#1e293b',
    color: '#f8fafc'
  });
};
