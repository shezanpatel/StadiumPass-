import { Component, Input } from '@angular/core';
import { IMatch } from '../../../models/interfaces';

@Component({
  selector: 'app-match-card',
  templateUrl: './match-card.component.html'
})
export class MatchCardComponent {
  @Input() match!: IMatch;

  get availabilityPercent(): number {
    if (!this.match.totalSeats) return 100;
    return Math.round(((this.match.totalSeats - this.match.bookedSeats) / this.match.totalSeats) * 100);
  }

  get availabilityColor(): string {
    if (this.availabilityPercent > 50) return '#22c55e';
    if (this.availabilityPercent > 20) return '#eab308';
    return '#ef4444';
  }

  get minPrice(): number {
    return Math.round(this.match.ticketPricing.general * this.match.ticketPricing.dynamicMultiplier);
  }

  get statusBadgeClass(): string {
    const classes: Record<string, string> = {
      upcoming:  'bg-sp-blue/20 text-sp-blue border-sp-blue/40',
      live:      'bg-sp-red/20 text-sp-red border-sp-red/40 animate-pulse-slow',
      completed: 'bg-sp-muted/20 text-sp-muted border-sp-muted/40',
      cancelled: 'bg-sp-red/10 text-sp-red/60 border-sp-red/20',
      postponed: 'bg-sp-gold/20 text-sp-gold border-sp-gold/40',
    };
    return classes[this.match.status] ?? classes['upcoming'];
  }

  get venueName(): string {
    return typeof this.match.venue === 'object' ? this.match.venue.name : '';
  }

  get venueCity(): string {
    return typeof this.match.venue === 'object' ? this.match.venue.city : '';
  }
}
