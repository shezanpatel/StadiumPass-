import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../../services/match.service';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { IMatch, ISeatMapSeat, PaymentMethod } from '../../../models/interfaces';

// Custom validator: Luhn algorithm for credit card
const luhnValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val = (control.value as string)?.replace(/\s/g, '') ?? '';
  if (!val || val.length < 13) return null;
  let sum = 0;
  let isEven = false;
  for (let i = val.length - 1; i >= 0; i--) {
    let digit = parseInt(val[i], 10);
    if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit; isEven = !isEven;
  }
  return sum % 10 === 0 ? null : { invalidCard: true };
};

// Expiry validator MM/YY
const expiryValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val = control.value as string;
  if (!val) return null;
  const [mm, yy] = val.split('/');
  const month = parseInt(mm, 10), year = parseInt(`20${yy}`, 10);
  const now = new Date();
  if (month < 1 || month > 12) return { invalidExpiry: true };
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return { cardExpired: true };
  return null;
};

@Component({ selector: 'app-checkout', templateUrl: './checkout.component.html' })
export class CheckoutComponent implements OnInit {
  match: IMatch | null = null;
  selectedSeats: ISeatMapSeat[] = [];
  paymentForm!: FormGroup;
  selectedPayment: PaymentMethod = 'credit_card';
  isLoading = false;
  step: 1 | 2 | 3 = 1; // 1=review, 2=payment, 3=confirmation

  readonly CONVENIENCE_RATE = 0.02;
  readonly GST_RATE = 0.18;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private matchService: MatchService,
    private bookingService: BookingService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.selectedSeats = this.bookingService.selectedSeats;
    if (this.selectedSeats.length === 0) { this.router.navigate(['/matches']); return; }
    const matchId = this.route.snapshot.paramMap.get('id')!;
    this.matchService.getMatchById(matchId).subscribe(res => this.match = res.data.match);
    this.buildPaymentForm();
  }

  buildPaymentForm(): void {
    this.paymentForm = this.fb.group({
      method: ['credit_card'],
      cardName:   ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/), luhnValidator]],
      cardExpiry: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/), expiryValidator]],
      cardCvv:    ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      upiId:      [''],
    });
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.selectedPayment = method;
    this.paymentForm.patchValue({ method });
    // Reset validators based on method
    ['cardName','cardNumber','cardExpiry','cardCvv','upiId'].forEach(f => {
      this.paymentForm.get(f)?.clearValidators();
      this.paymentForm.get(f)?.updateValueAndValidity();
    });
    if (method === 'credit_card' || method === 'debit_card') {
      this.paymentForm.get('cardName')?.setValidators(Validators.required);
      this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/), luhnValidator]);
      this.paymentForm.get('cardExpiry')?.setValidators([Validators.required, expiryValidator]);
      this.paymentForm.get('cardCvv')?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
    } else if (method === 'upi') {
      this.paymentForm.get('upiId')?.setValidators([Validators.required, Validators.pattern(/^[\w.-]+@[\w]+$/)]);
    }
    Object.keys(this.paymentForm.controls).forEach(k => this.paymentForm.get(k)?.updateValueAndValidity());
  }

  field(name: string): AbstractControl { return this.paymentForm.get(name)!; }

  getCardError(name: string): string {
    const c = this.field(name);
    if (c.hasError('required')) return 'Required.';
    if (c.hasError('pattern')) return 'Invalid format.';
    if (c.hasError('invalidCard')) return 'Invalid card number.';
    if (c.hasError('cardExpired')) return 'Card has expired.';
    if (c.hasError('invalidExpiry')) return 'Invalid expiry date.';
    return '';
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 16);
    this.paymentForm.patchValue({ cardNumber: input.value });
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2)}`;
    input.value = val;
    this.paymentForm.patchValue({ cardExpiry: val });
  }

  get subtotal(): number { return this.selectedSeats.reduce((s, seat) => s + seat.price, 0); }
  get convenienceFee(): number { return Math.round(this.subtotal * this.CONVENIENCE_RATE); }
  get taxes(): number { return Math.round(this.subtotal * this.GST_RATE); }
  get total(): number { return this.subtotal + this.convenienceFee + this.taxes; }
  get walletBalance(): number { return this.authService.currentUser?.walletBalance ?? 0; }

  onSubmit(): void {
    if (this.paymentForm.invalid) { this.paymentForm.markAllAsTouched(); return; }
    if (this.selectedPayment === 'wallet' && this.walletBalance < this.total) {
      this.toast.error('Insufficient wallet balance.'); return;
    }
    this.isLoading = true;
    const maskedInfo = this.selectedPayment === 'credit_card' || this.selectedPayment === 'debit_card'
      ? `**** **** **** ${(this.field('cardNumber').value as string).slice(-4)}`
      : this.field('upiId').value as string || 'Wallet';

    this.bookingService.createBooking({
      matchId: this.match!._id,
      seats: this.selectedSeats,
      paymentMethod: this.selectedPayment,
      paymentInfo: { masked: maskedInfo }
    }).subscribe({
      next: res => {
        this.isLoading = false;
        this.bookingService.clearSelectedSeats();
        this.toast.success('Booking confirmed! 🎉');
        this.router.navigate(['/ticket', res.data.booking._id]);
      },
      error: () => { this.isLoading = false; }
    });
  }
}
