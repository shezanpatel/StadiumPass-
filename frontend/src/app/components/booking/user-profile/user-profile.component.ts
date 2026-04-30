import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { BookingService } from '../../../services/booking.service';
import { ToastService } from '../../../services/toast.service';
import { IUser, IBooking, IMatch } from '../../../models/interfaces';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  user: IUser | null = null;
  bookings: IBooking[] = [];
  isLoadingBookings = true;
  profileForm!: FormGroup;
  refundForm!: FormGroup;
  activeTab: 'bookings' | 'profile' | 'wallet' = 'bookings';
  selectedBookingForRefund: IBooking | null = null;
  isSubmitting = false;

  readonly TEAMS = ['MI', 'CSK', 'RCB', 'KKR', 'DC', 'SRH', 'PBKS', 'RR', 'GT', 'LSG', 'India', 'Pakistan', 'Australia', 'England'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private bookingService: BookingService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.buildForms();
    this.loadBookings();
  }

  buildForms(): void {
    this.profileForm = this.fb.group({
      name:  [this.user?.name ?? '', [Validators.required, Validators.minLength(2)]],
      phone: [this.user?.phone ?? '', [Validators.pattern(/^[6-9]\d{9}$/)]],
      favoriteTeams: [this.user?.favoriteTeams ?? []]
    });
    this.refundForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  loadBookings(): void {
    this.isLoadingBookings = true;
    this.bookingService.getMyBookings().subscribe({
      next: res => { this.bookings = res.data.bookings; this.isLoadingBookings = false; },
      error: () => { this.isLoadingBookings = false; }
    });
  }

  setTab(tab: 'bookings' | 'profile' | 'wallet'): void {
    this.activeTab = tab;
  }

  toggleFavoriteTeam(team: string): void {
    const teams: string[] = [...(this.profileForm.get('favoriteTeams')?.value as string[] ?? [])];
    const idx = teams.indexOf(team);
    if (idx > -1) teams.splice(idx, 1);
    else teams.push(team);
    this.profileForm.patchValue({ favoriteTeams: teams });
  }

  isFavorite(team: string): boolean {
    return ((this.profileForm.get('favoriteTeams')?.value as string[]) ?? []).includes(team);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSubmitting = true;
    this.authService.updateProfile(this.profileForm.value as Partial<IUser>).subscribe({
      next: () => { this.toast.success('Profile updated!'); this.isSubmitting = false; },
      error: () => { this.isSubmitting = false; }
    });
  }

  openRefundModal(booking: IBooking): void { this.selectedBookingForRefund = booking; }
  closeRefundModal(): void { this.selectedBookingForRefund = null; this.refundForm.reset(); }

  canRefund(booking: IBooking): boolean {
    if (booking.status !== 'confirmed') return false;
    const matchDate = new Date(this.getMatchDate(booking));
    const hoursLeft = (matchDate.getTime() - Date.now()) / 3600000;
    return hoursLeft >= 24;
  }

  hoursUntilMatch(booking: IBooking): number {
    const matchDate = new Date(this.getMatchDate(booking));
    return Math.max(0, Math.round((matchDate.getTime() - Date.now()) / 3600000));
  }

  submitRefund(): void {
    if (this.refundForm.invalid || !this.selectedBookingForRefund) return;
    this.isSubmitting = true;
    this.bookingService.requestRefund(
      this.selectedBookingForRefund._id,
      this.refundForm.get('reason')?.value as string
    ).subscribe({
      next: res => {
        this.toast.success(`Refund of ₹${res.data.refundAmount} requested!`);
        this.loadBookings();
        this.closeRefundModal();
        this.isSubmitting = false;
      },
      error: () => { this.isSubmitting = false; }
    });
  }

  getMatchTitle(booking: IBooking): string {
    const m = booking.match;
    if (typeof m === 'object') {
      const match = m as IMatch;
      return `${match.team1} vs ${match.team2}`;
    }
    return '';
  }

  getMatchDate(booking: IBooking): string {
    const m = booking.match;
    return typeof m === 'object' ? (m as IMatch).dateTime : '';
  }

  getSeatIds(booking: IBooking): string {
    return booking.seats.map(s => s.seatId).join(', ');
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      confirmed:        'text-sp-green border-sp-green/40 bg-sp-green/10',
      cancelled:        'text-sp-red border-sp-red/40 bg-sp-red/10',
      refunded:         'text-sp-blue border-sp-blue/40 bg-sp-blue/10',
      pending:          'text-sp-gold border-sp-gold/40 bg-sp-gold/10',
      refund_requested: 'text-sp-gold border-sp-gold/40 bg-sp-gold/10',
    };
    return map[status] ?? 'text-sp-muted border-sp-border bg-sp-surface';
  }

  getStatusLabel(status: string): string {
    return status.replace('_', ' ');
  }
}
