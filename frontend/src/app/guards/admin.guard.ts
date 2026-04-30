import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private toast: ToastService) {}

  canActivate(): boolean {
    if (this.authService.isAdmin) return true;
    this.toast.error('Admin access required.', 'Unauthorized');
    this.router.navigate(['/admin-login']);
    return false;
  }
}
