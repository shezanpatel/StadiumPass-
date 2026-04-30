import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { IBooking, IMatch, IUser, IStadium } from '../../../models/interfaces';

@Component({
  selector: 'app-e-ticket',
  templateUrl: './e-ticket.component.html'
})
export class ETicketComponent implements OnInit {
  booking: IBooking | null = null;
  isLoading = true;

  constructor(private route: ActivatedRoute, private bookingService: BookingService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.bookingService.getBookingById(id).subscribe({
      next: res => { this.booking = res.data.booking; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get match(): IMatch | null {
    return typeof this.booking?.match === 'object' ? this.booking.match as IMatch : null;
  }

  get venueName(): string {
    const venue = this.match?.venue;
    return typeof venue === 'object' ? (venue as IStadium).name : '';
  }

  get venueCity(): string {
    const venue = this.match?.venue;
    return typeof venue === 'object' ? (venue as IStadium).city : '';
  }

  get userName(): string {
    const user = this.booking?.user;
    return typeof user === 'object' ? (user as IUser).name : '';
  }

  get userEmail(): string {
    const user = this.booking?.user;
    return typeof user === 'object' ? (user as IUser).email : '';
  }

  printTicket(): void { window.print(); }

  get totalSeats(): number { return this.booking?.seats.length ?? 0; }

  get seatSummary(): string {
    return this.booking?.seats.map(s => s.seatId).join(', ') ?? '';
  }
}
