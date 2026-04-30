import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../../services/match.service';
import { BookingService } from '../../../services/booking.service';
import { ToastService } from '../../../services/toast.service';
import { IMatch, ISeatMapSeat } from '../../../models/interfaces';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.component.html'
})
export class MatchDetailComponent implements OnInit {
  match: IMatch | null = null;
  bookedSeatIds: string[] = [];
  selectedSeats: ISeatMapSeat[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchService: MatchService,
    private bookingService: BookingService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.matchService.getMatchById(id).subscribe({
      next: res => {
        this.match = res.data.match;
        this.bookedSeatIds = res.data.bookedSeatIds;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSeatsSelected(seats: ISeatMapSeat[]): void {
    this.selectedSeats = seats;
  }

  proceedToCheckout(): void {
    if (this.selectedSeats.length === 0) {
      this.toast.warning('Please select at least one seat.', 'No Seats Selected');
      return;
    }
    this.bookingService.setSelectedSeats(this.selectedSeats);
    this.router.navigate(['/checkout', this.match!._id]);
  }

  get venueName(): string {
    return typeof this.match?.venue === 'object' ? this.match.venue.name : '';
  }

  get totalPrice(): number {
    return this.selectedSeats.reduce((sum, s) => sum + s.price, 0);
  }

  getDynamicPercent(multiplier: number): number {
    return Math.round((multiplier - 1) * 100);
  }

  getPlayerIcon(role: string): string {
    const icons: Record<string, string> = {
      batsman: '🏏', bowler: '⚡', allrounder: '🌟', wicketkeeper: '🧤'
    };
    return icons[role] ?? '🌟';
  }
}
