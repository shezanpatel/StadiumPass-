import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

export const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
};

export const strongPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val = control.value as string;
  if (!val) return null;
  const hasUpper = /[A-Z]/.test(val);
  const hasLower = /[a-z]/.test(val);
  const hasNum = /\d/.test(val);
  return hasUpper && hasLower && hasNum ? null : { weakPassword: true };
};

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private toast: ToastService) {}

  ngOnInit(): void { this.buildForm(); }

  buildForm(): void {
    this.registerForm = this.fb.group({
      name:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
      password:        ['', [Validators.required, Validators.minLength(8), strongPasswordValidator]],
      confirmPassword: ['', Validators.required],
      role:            ['client']
    }, { validators: passwordMatchValidator });
  }

  field(name: string): AbstractControl { return this.registerForm.get(name)!; }

  getError(name: string): string {
    const c = this.field(name);
    if (c.hasError('required')) return 'Required.';
    if (c.hasError('email')) return 'Invalid email.';
    if (c.hasError('minlength')) return `Min ${c.errors?.['minlength']?.requiredLength} characters.`;
    if (c.hasError('maxlength')) return 'Too long.';
    if (c.hasError('pattern')) return 'Invalid format.';
    if (c.hasError('weakPassword')) return 'Must include uppercase, lowercase, and number.';
    return '';
  }

  get passwordMismatch(): boolean {
    return !!this.registerForm.errors?.['passwordMismatch'] && this.field('confirmPassword').touched;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => { this.toast.success(res.message); this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }
}
