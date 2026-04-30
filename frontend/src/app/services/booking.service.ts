import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IBooking, IApiResponse, ISeatMapSeat, ICheckoutForm } from '../models/interfaces';

export interface ICreateBookingPayload {
  matchId: string;
  seats: ISeatMapSeat[];
  paymentMethod: string;
  paymentInfo?: { masked: string };
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly API = `${environment.apiUrl}/bookings`;

  private selectedSeatsSubject = new BehaviorSubject<ISeatMapSeat[]>([]);
  public selectedSeats$ = this.selectedSeatsSubject.asObservable();

  constructor(private http: HttpClient) {}

  get selectedSeats(): ISeatMapSeat[] { return this.selectedSeatsSubject.value; }

  setSelectedSeats(seats: ISeatMapSeat[]): void { this.selectedSeatsSubject.next(seats); }
  clearSelectedSeats(): void { this.selectedSeatsSubject.next([]); }

  createBooking(payload: ICreateBookingPayload): Observable<IApiResponse<{ booking: IBooking }>> {
    return this.http.post<IApiResponse<{ booking: IBooking }>>(this.API, payload);
  }

  getMyBookings(): Observable<IApiResponse<{ bookings: IBooking[] }>> {
    return this.http.get<IApiResponse<{ bookings: IBooking[] }>>(`${this.API}/my`);
  }

  getBookingById(id: string): Observable<IApiResponse<{ booking: IBooking }>> {
    return this.http.get<IApiResponse<{ booking: IBooking }>>(`${this.API}/${id}`);
  }

  requestRefund(id: string, reason: string): Observable<IApiResponse<{ bookingRef: string; refundAmount: number; cancellationFee: number }>> {
    return this.http.post<IApiResponse<{ bookingRef: string; refundAmount: number; cancellationFee: number }>>(`${this.API}/${id}/refund`, { reason });
  }

  processRefund(id: string, action: 'approve' | 'reject', adminNote: string): Observable<IApiResponse<{ booking: IBooking }>> {
    return this.http.put<IApiResponse<{ booking: IBooking }>>(`${this.API}/${id}/process-refund`, { action, adminNote });
  }
}
