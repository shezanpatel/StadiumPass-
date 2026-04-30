import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ISeatStatusUpdate {
  matchId: string;
  seatId: string;
  status: 'available' | 'locked' | 'booked';
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT = 5;

  public seatUpdates$ = new Subject<ISeatStatusUpdate>();
  public connected$ = new Subject<boolean>();

  // Simulated real-time for environments without Socket.IO client installed
  private simulatedUpdates: Map<string, ReturnType<typeof setInterval>> = new Map();

  connect(userId: string): void {
    // In a real app, use socket.io-client:
    // this.socket = io(environment.wsUrl, { auth: { token } });
    // this.socket.on('seat_status_update', (data) => this.seatUpdates$.next(data));
    console.log(`WebSocket simulated connection for user: ${userId}`);
    this.connected$.next(true);
  }

  lockSeat(matchId: string, seatId: string, userId: string): void {
    // this.socket?.emit('lock_seat', { matchId, seatId, userId });
    // Simulate: broadcast locked status
    this.seatUpdates$.next({ matchId, seatId, status: 'locked', userId });
  }

  unlockSeat(matchId: string, seatId: string, userId: string): void {
    // this.socket?.emit('unlock_seat', { matchId, seatId, userId });
    this.seatUpdates$.next({ matchId, seatId, status: 'available' });
  }

  disconnect(): void {
    // this.socket?.disconnect();
    this.connected$.next(false);
    this.simulatedUpdates.forEach(interval => clearInterval(interval));
  }

  ngOnDestroy(): void { this.disconnect(); }
}
