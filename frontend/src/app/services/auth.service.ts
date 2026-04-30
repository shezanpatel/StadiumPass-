import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { IUser, IAuthResponse, ILoginForm, IRegisterForm, IApiResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'sp_token';
  private readonly USER_KEY = 'sp_user';

  private currentUserSubject = new BehaviorSubject<IUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getUserFromStorage(): IUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private setSession(token: string, user: IUser): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  login(credentials: ILoginForm): Observable<IAuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http.post<IAuthResponse>(`${this.API}/login`, credentials).pipe(
      tap(response => {
        if (response.success) {
          this.setSession(response.data.token, response.data.user);
          const redirect = '/matches';
          this.router.navigate([redirect]);
        }
      }),
      catchError(err => { this.isLoadingSubject.next(false); return throwError(() => err); }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  register(data: IRegisterForm): Observable<IAuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http.post<IAuthResponse>(`${this.API}/register`, data).pipe(
      tap(response => {
        if (response.success) {
          this.setSession(response.data.token, response.data.user);
          const redirect = '/matches';
          this.router.navigate([redirect]);
        }
      }),
      catchError(err => { this.isLoadingSubject.next(false); return throwError(() => err); }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  logout(): void {
    const wasAdmin = this.isAdmin;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate([wasAdmin ? '/admin-login' : '/login']);
  }

  getMe(): Observable<IApiResponse<{ user: IUser }>> {
    return this.http.get<IApiResponse<{ user: IUser }>>(`${this.API}/me`).pipe(
      tap(res => { if (res.success) this.currentUserSubject.next(res.data.user); })
    );
  }

  updateProfile(data: Partial<IUser>): Observable<IApiResponse<{ user: IUser }>> {
    return this.http.put<IApiResponse<{ user: IUser }>>(`${this.API}/profile`, data).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.data.user));
          this.currentUserSubject.next(res.data.user);
        }
      })
    );
  }
}
