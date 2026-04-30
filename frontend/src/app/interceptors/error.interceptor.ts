import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.message || error.message || 'An unexpected error occurred.';

        switch (error.status) {
          case 400:
            this.toast.error(message, 'Validation Error');
            break;
          case 401:
            this.toast.error('Your session has expired. Please log in again.', 'Session Expired');
            this.authService.logout();
            break;
          case 403:
            this.toast.error(message, 'Access Denied');
            this.router.navigate(['/']);
            break;
          case 404:
            this.toast.error(message, 'Not Found');
            break;
          case 409:
            this.toast.error(message, 'Conflict');
            break;
          case 429:
            this.toast.warning('Too many requests. Please slow down.', 'Rate Limited');
            break;
          case 500:
          case 503:
            this.toast.error('Server error. Please try again later.', 'Server Error');
            break;
          default:
            if (error.status === 0) {
              this.toast.error('Cannot connect to server. Check your internet connection.', 'Network Error');
            } else {
              this.toast.error(message, 'Error');
            }
        }
        return throwError(() => error);
      })
    );
  }
}
