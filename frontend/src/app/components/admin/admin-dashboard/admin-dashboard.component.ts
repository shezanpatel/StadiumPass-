import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatchService } from '../../../services/match.service';
import { BookingService } from '../../../services/booking.service';
import { ToastService } from '../../../services/toast.service';
import { IMatch, IBooking, IUser, IApiResponse } from '../../../models/interfaces';
import { environment } from '../../../../environments/environment';

type AdminTab = 'matches' | 'bookings' | 'users' | 'refunds' | 'analytics';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  matches: IMatch[] = [];
  bookings: IBooking[] = [];
  filteredBookings: IBooking[] = [];
  users: IUser[] = [];
  refundRequests: IBooking[] = [];
  revenueData: { _id: string; revenue: number; bookings: number; tickets: number }[] = [];
  activeTab: AdminTab = 'matches';

  // Booking filters
  bookingSearch = '';
  bookingStatusFilter = 'all';

  constructor(
    private http: HttpClient,
    private matchService: MatchService,
    private bookingService: BookingService,
    private toast: ToastService
  ) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loadMatches();
    this.loadBookings();
    this.loadUsers();
    this.loadRefunds();
    this.loadAnalytics();
  }

  setTab(tab: AdminTab): void { this.activeTab = tab; }

  loadMatches(): void {
    this.matchService.getMatches({ limit: 50 }).subscribe(res => this.matches = res.data.matches);
  }

  loadBookings(): void {
    this.http.get<IApiResponse<{ bookings: IBooking[] }>>(`${environment.apiUrl}/admin/bookings`)
      .subscribe(res => {
        this.bookings = res.data.bookings;
        this.applyBookingFilters();
      });
  }

  loadUsers(): void {
    this.http.get<IApiResponse<{ users: IUser[] }>>(`${environment.apiUrl}/admin/users`)
      .subscribe(res => this.users = res.data.users);
  }

  loadRefunds(): void {
    this.http.get<IApiResponse<{ bookings: IBooking[] }>>(`${environment.apiUrl}/admin/refund-requests`)
      .subscribe(res => this.refundRequests = res.data.bookings);
  }

  loadAnalytics(): void {
    this.matchService.getAnalytics().subscribe(res => {
      this.revenueData = res.data.revenueData as typeof this.revenueData;
    });
  }

  // ── Booking filter logic ──
  applyBookingFilters(): void {
    let result = [...this.bookings];
    if (this.bookingStatusFilter !== 'all') {
      result = result.filter(b => b.status === this.bookingStatusFilter);
    }
    if (this.bookingSearch.trim()) {
      const q = this.bookingSearch.toLowerCase();
      result = result.filter(b =>
        b.bookingRef?.toLowerCase().includes(q) ||
        this.getUserName(b).toLowerCase().includes(q) ||
        this.getUserEmail(b).toLowerCase().includes(q) ||
        this.getMatchTitle(b).toLowerCase().includes(q)
      );
    }
    this.filteredBookings = result;
  }

  onBookingSearch(): void { this.applyBookingFilters(); }
  onStatusFilter(status: string): void {
    this.bookingStatusFilter = status;
    this.applyBookingFilters();
  }

  deleteMatch(id: string): void {
    if (!confirm('Cancel this match?')) return;
    this.matchService.deleteMatch(id).subscribe({
      next: () => { this.toast.success('Match cancelled.'); this.loadMatches(); }
    });
  }

  toggleUserStatus(user: IUser): void {
    this.http.put<IApiResponse<{ user: IUser }>>(`${environment.apiUrl}/admin/users/${user._id}/toggle-status`, {})
      .subscribe({
        next: res => {
          this.toast.success(`User ${res.data.user.isActive ? 'activated' : 'deactivated'}.`);
          this.loadUsers();
        }
      });
  }

  processRefund(bookingId: string, action: 'approve' | 'reject'): void {
    const note = action === 'reject' ? (prompt('Reason for rejection:') ?? '') : 'Approved by admin';
    this.bookingService.processRefund(bookingId, action, note).subscribe({
      next: () => {
        this.toast.success(`Refund ${action}d.`);
        this.loadRefunds();
        this.loadBookings(); // refresh bookings tab too
      }
    });
  }

  // ── Helpers ──
  getUserName(booking: IBooking): string {
    return typeof booking.user === 'object' ? (booking.user as IUser).name : '';
  }
  getUserEmail(booking: IBooking): string {
    return typeof booking.user === 'object' ? (booking.user as IUser).email : '';
  }
  getMatchTitle(booking: IBooking): string {
    return typeof booking.match === 'object' ? (booking.match as IMatch).title : '';
  }
  getMatchDate(booking: IBooking): string {
    return typeof booking.match === 'object' ? (booking.match as IMatch).dateTime as unknown as string : '';
  }
  getRefundAmount(booking: IBooking): number { return booking.refund?.amount ?? 0; }
  getRefundRequestedAt(booking: IBooking): string { return booking.refund?.requestedAt ?? ''; }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      confirmed:        'text-sp-green border-sp-green/40 bg-sp-green/10',
      pending:          'text-sp-gold border-sp-gold/40 bg-sp-gold/10',
      refund_requested: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
      refunded:         'text-sp-blue border-sp-blue/40 bg-sp-blue/10',
      cancelled:        'text-sp-red border-sp-red/40 bg-sp-red/10',
    };
    return map[status] ?? 'text-sp-muted border-sp-border';
  }

  get totalRevenue(): number { return this.revenueData.reduce((s, d) => s + d.revenue, 0); }
  get totalBookings(): number { return this.revenueData.reduce((s, d) => s + d.bookings, 0); }

  getRevenuePercent(revenue: number): number {
    return this.totalRevenue > 0 ? Math.round((revenue / this.totalRevenue) * 100) : 0;
  }
}
