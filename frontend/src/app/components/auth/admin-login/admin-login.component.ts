import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn && this.authService.isAdmin) {
      this.router.navigate(['/admin']);
      return;
    }
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role:     ['admin']
    });
  }

  get emailCtrl(): AbstractControl { return this.loginForm.get('email')!; }
  get passCtrl():  AbstractControl { return this.loginForm.get('password')!; }

  getError(ctrl: AbstractControl): string {
    if (ctrl.hasError('required')) return 'This field is required.';
    if (ctrl.hasError('email'))    return 'Please enter a valid email.';
    if (ctrl.hasError('minlength')) return 'Password must be at least 8 characters.';
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data.user.role !== 'admin') {
          this.toast.error('Access denied. Admins only.');
          this.authService.logout();
        } else {
          this.toast.success(res.message, 'Welcome, Admin!');
        }
      },
      error: () => { this.isLoading = false; }
    });
  }
}
