import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  template: `
    <app-live-ticker></app-live-ticker>
    <app-navbar></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-toast></app-toast>
  `
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private socketService: SocketService) {}

  ngOnInit(): void {
    // Initialize WebSocket connection if logged in
    const user = this.authService.currentUser;
    if (user) {
      this.socketService.connect(user._id);
    }

    this.authService.currentUser$.subscribe(u => {
      if (u) this.socketService.connect(u._id);
      else this.socketService.disconnect();
    });
  }
}
