import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
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
    if (this.authService.isLoggedIn) {
      this.router.navigate([this.authService.isAdmin ? '/admin' : '/matches']);
      return;
    }
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role:     ['client']
    });
  }

  get emailControl(): AbstractControl { return this.loginForm.get('email')!; }
  get passwordControl(): AbstractControl { return this.loginForm.get('password')!; }

  getError(control: AbstractControl): string {
    if (control.hasError('required')) return 'This field is required.';
    if (control.hasError('email')) return 'Please enter a valid email.';
    if (control.hasError('minlength')) return 'Password must be at least 8 characters.';
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.toast.success(res.message, 'Welcome Back!');
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }
}
