import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { IMatch, ISeatMapSeat, SeatStatus, SectionType } from '../../../models/interfaces';
import { SocketService, ISeatStatusUpdate } from '../../../services/socket.service';
import { AuthService } from '../../../services/auth.service';

interface ISvgSection {
  name: SectionType;
  displayName: string;
  color: string;
  pathD: string;
  labelX: number;
  labelY: number;
  seats: ISeatMapSeat[];
}

const SECTION_CONFIG: Record<SectionType, { displayName: string; startAngle: number; endAngle: number; color: string }> = {
  north: { displayName: 'North Stand', startAngle: 225, endAngle: 315, color: '#22c55e' },
  east:  { displayName: 'East Stand',  startAngle: 315, endAngle: 45,  color: '#3b82f6' },
  south: { displayName: 'South Stand', startAngle: 45,  endAngle: 135, color: '#a855f7' },
  west:  { displayName: 'West Stand',  startAngle: 135, endAngle: 225, color: '#f97316' },
};

@Component({
  selector: 'app-stadium-map',
  templateUrl: './stadium-map.component.html',
  styleUrls: ['./stadium-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StadiumMapComponent implements OnInit, OnChanges, OnDestroy {
  @Input() match!: IMatch;
  @Input() bookedSeatIds: string[] = [];
  @Output() seatsSelected = new EventEmitter<ISeatMapSeat[]>();

  svgSections: ISvgSection[] = [];
  selectedSeats: ISeatMapSeat[] = [];
  hoveredSeat: ISeatMapSeat | null = null;
  tooltipX = 0;
  tooltipY = 0;

  readonly SVG_WIDTH = 600;
  readonly SVG_HEIGHT = 600;
  readonly CX = 300;
  readonly CY = 300;
  readonly PITCH_RADIUS = 55;
  readonly MIN_RADIUS = 95;
  readonly ROW_GAP = 18;
  readonly ROWS_PER_SECTION = 6;
  readonly SEATS_PER_ROW_BASE = 12;
  readonly SEAT_RADIUS = 6;

  private destroy$ = new Subject<void>();

  constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildSvgMap();
    this.listenToSeatUpdates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bookedSeatIds'] || changes['match']) {
      this.buildSvgMap();
    }
  }

  private buildSvgMap(): void {
    this.svgSections = (Object.keys(SECTION_CONFIG) as SectionType[]).map(sectionKey => {
      const config = SECTION_CONFIG[sectionKey];
      const seats = this.generateSeatsForSection(sectionKey, config.startAngle, config.endAngle, config.color);
      const midAngle = this.midAngleDeg(config.startAngle, config.endAngle);
      const midRad = (midAngle * Math.PI) / 180;
      const labelR = this.MIN_RADIUS + this.ROWS_PER_SECTION * this.ROW_GAP + 30;

      return {
        name: sectionKey,
        displayName: config.displayName,
        color: config.color,
        pathD: this.buildArcPath(config.startAngle, config.endAngle),
        labelX: this.CX + labelR * Math.cos(midRad),
        labelY: this.CY + labelR * Math.sin(midRad),
        seats
      };
    });
    this.cdr.markForCheck();
  }

  private generateSeatsForSection(
    section: SectionType,
    startAngle: number,
    endAngle: number,
    _color: string
  ): ISeatMapSeat[] {
    const seats: ISeatMapSeat[] = [];
    let end = endAngle;
    if (end <= startAngle) end += 360;
    const spanDeg = end - startAngle;

    for (let row = 0; row < this.ROWS_PER_SECTION; row++) {
      const radius = this.MIN_RADIUS + row * this.ROW_GAP;
      const seatsInRow = this.SEATS_PER_ROW_BASE + row * 2;
      const angleStep = spanDeg / (seatsInRow + 1);

      for (let s = 0; s < seatsInRow; s++) {
        const angleDeg = startAngle + angleStep * (s + 1);
        const angleRad = (angleDeg * Math.PI) / 180;
        const cx = this.CX + radius * Math.cos(angleRad);
        const cy = this.CY + radius * Math.sin(angleRad);
        const seatId = `${section[0].toUpperCase()}-${String.fromCharCode(65 + row)}-${s + 1}`;

        const tier = row < 2 ? 'vip' : row < 4 ? 'premium' : 'general';
        const basePrice = this.getBasePrice(tier);
        const dynamicMultiplier = (this.match as IMatch & { ticketPricing: { dynamicMultiplier: number } })
          ?.ticketPricing?.dynamicMultiplier ?? 1;

        const isBooked = this.bookedSeatIds.includes(seatId);
        const status: SeatStatus = isBooked ? 'booked'
          : (tier === 'vip' && row === 0) ? 'vip' : 'available';

        seats.push({
          seatId,
          row: String.fromCharCode(65 + row),
          number: s + 1,
          section,
          tier: tier as ISeatMapSeat['tier'],
          basePrice,
          price: Math.round(basePrice * dynamicMultiplier),
          svgX: cx, svgY: cy, cx, cy,
          status,
          angle: angleDeg
        });
      }
    }
    return seats;
  }

  private getBasePrice(tier: string): number {
    const prices: Record<string, number> = { general: 500, premium: 1500, vip: 5000, corporate: 10000 };
    return prices[tier] ?? 500;
  }

  private buildArcPath(startAngle: number, endAngle: number): string {
    let end = endAngle;
    if (end <= startAngle) end += 360;
    const innerR = this.MIN_RADIUS - 10;
    const outerR = this.MIN_RADIUS + this.ROWS_PER_SECTION * this.ROW_GAP + 10;
    const large = (end - startAngle) > 180 ? 1 : 0;

    const s1 = this.polarToCart(this.CX, this.CY, innerR, startAngle);
    const e1 = this.polarToCart(this.CX, this.CY, innerR, end);
    const s2 = this.polarToCart(this.CX, this.CY, outerR, end);
    const e2 = this.polarToCart(this.CX, this.CY, outerR, startAngle);

    return [
      `M ${s1.x} ${s1.y}`,
      `A ${innerR} ${innerR} 0 ${large} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${outerR} ${outerR} 0 ${large} 0 ${e2.x} ${e2.y}`,
      'Z'
    ].join(' ');
  }

  private polarToCart(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: +(cx + r * Math.cos(rad)).toFixed(2), y: +(cy + r * Math.sin(rad)).toFixed(2) };
  }

  private midAngleDeg(start: number, end: number): number {
    let e = end;
    if (e <= start) e += 360;
    return start + (e - start) / 2;
  }

  onSeatClick(seat: ISeatMapSeat, event: MouseEvent): void {
    event.stopPropagation();
    if (seat.status === 'booked' || seat.status === 'locked') return;

    if (seat.status === 'selected') {
      seat.status = seat.tier === 'vip' ? 'vip' : 'available';
      this.selectedSeats = this.selectedSeats.filter(s => s.seatId !== seat.seatId);
      const userId = this.authService.currentUser?._id ?? '';
      this.socketService.unlockSeat(this.match._id, seat.seatId, userId);
    } else if (this.selectedSeats.length < 10) {
      seat.status = 'selected';
      this.selectedSeats = [...this.selectedSeats, seat];
      const userId = this.authService.currentUser?._id ?? '';
      this.socketService.lockSeat(this.match._id, seat.seatId, userId);
    }

    this.seatsSelected.emit([...this.selectedSeats]);
    this.cdr.markForCheck();
  }

  onSeatHover(seat: ISeatMapSeat, event: MouseEvent): void {
    if (seat.status !== 'booked' && seat.status !== 'locked') {
      this.hoveredSeat = seat;
      const target = event.target as SVGElement;
      const rect = target.getBoundingClientRect();
      this.tooltipX = rect.left + 20;
      this.tooltipY = rect.top - 60;
    }
  }

  onSeatLeave(): void { this.hoveredSeat = null; }

  getSeatColor(seat: ISeatMapSeat): string {
    const colors: Record<SeatStatus, string> = {
      available: '#22c55e',
      selected:  '#3b82f6',
      booked:    '#ef4444',
      locked:    '#f97316',
      vip:       '#eab308',
    };
    return colors[seat.status] ?? '#22c55e';
  }

  getSeatOpacity(seat: ISeatMapSeat): number {
    return seat.status === 'booked' ? 0.4 : 1;
  }

  getSeatCursor(seat: ISeatMapSeat): string {
    return seat.status === 'booked' || seat.status === 'locked' ? 'not-allowed' : 'pointer';
  }

  get totalPrice(): number {
    return this.selectedSeats.reduce((sum, s) => sum + s.price, 0);
  }

  clearSelection(): void {
    const userId = this.authService.currentUser?._id ?? '';
    this.selectedSeats.forEach(s => {
      s.status = s.tier === 'vip' ? 'vip' : 'available';
      this.socketService.unlockSeat(this.match._id, s.seatId, userId);
    });
    this.selectedSeats = [];
    this.seatsSelected.emit([]);
    this.cdr.markForCheck();
  }

  private listenToSeatUpdates(): void {
    this.socketService.seatUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe((update: ISeatStatusUpdate) => {
        if (update.matchId !== this.match._id) return;
        const userId = this.authService.currentUser?._id ?? '';
        if (update.userId === userId) return;

        for (const section of this.svgSections) {
          const seat = section.seats.find(s => s.seatId === update.seatId);
          if (seat) {
            if (update.status === 'locked') seat.status = 'locked';
            else if (update.status === 'booked') seat.status = 'booked';
            else seat.status = 'available';
            this.cdr.markForCheck();
            break;
          }
        }
      });
  }

  trackBySection(_: number, s: ISvgSection): string { return s.name; }
  trackBySeat(_: number, s: ISeatMapSeat): string { return s.seatId; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
