// 全站统一 Toast 提示（基于 sonner）
import { toast } from 'sonner';

export const showSuccess = (msg: string) => toast.success(msg);
export const showError = (msg: string) => toast.error(msg);
export const showInfo = (msg: string) => toast.info(msg);
export const showLoading = (msg: string) => toast.loading(msg);

// 关闭某条（loading→结果时用）
export const dismissToast = (id?: string | number) => toast.dismiss(id);

export { toast };
