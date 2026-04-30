import { Component } from '@angular/core';
import { ToastService, IToast } from '../../../services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html'
})
export class ToastComponent {
  toasts$: Observable<IToast[]>;
  constructor(public toastService: ToastService) {
    this.toasts$ = toastService.toasts$;
  }
  trackById(_: number, t: IToast): string { return t.id; }
}
