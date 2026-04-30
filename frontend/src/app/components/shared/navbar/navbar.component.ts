import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { IUser } from '../../../models/interfaces';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  currentUser$: Observable<IUser | null>;
  menuOpen = false;

  constructor(public authService: AuthService) {
    this.currentUser$ = authService.currentUser$;
  }

  logout(): void { this.authService.logout(); this.menuOpen = false; }
}
