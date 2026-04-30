// toast.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface IToast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<IToast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private show(type: ToastType, title: string, message: string, duration = 4000): void {
    const toast: IToast = { id: `toast-${Date.now()}`, type, title, message, duration };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.remove(toast.id), duration);
  }

  success(message: string, title = 'Success'): void { this.show('success', title, message); }
  error(message: string, title = 'Error'): void { this.show('error', title, message, 6000); }
  warning(message: string, title = 'Warning'): void { this.show('warning', title, message); }
  info(message: string, title = 'Info'): void { this.show('info', title, message); }

  remove(id: string): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
