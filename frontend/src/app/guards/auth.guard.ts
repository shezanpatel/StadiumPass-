import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private toast: ToastService) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn) return true;
    this.toast.warning('Please log in to continue.', 'Authentication Required');
    this.router.navigate(['/login']);
    return false;
  }
}
