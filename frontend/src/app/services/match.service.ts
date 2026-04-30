// match.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { IMatch, IApiResponse } from '../models/interfaces';

export interface IMatchFilters {
  tournament?: string;
  team?: string;
  venue?: string;
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly API = `${environment.apiUrl}/matches`;

  private filtersSubject = new BehaviorSubject<IMatchFilters>({});
  public filters$ = this.filtersSubject.asObservable();

  constructor(private http: HttpClient) {}

  getMatches(filters: IMatchFilters = {}): Observable<IApiResponse<{ matches: IMatch[]; pagination: { total: number; page: number; pages: number } }>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, val]) => { if (val) params = params.set(key, String(val)); });
    return this.http.get<IApiResponse<{ matches: IMatch[]; pagination: { total: number; page: number; pages: number } }>>(this.API, { params });
  }

  getMatchById(id: string): Observable<IApiResponse<{ match: IMatch; bookedSeatIds: string[] }>> {
    return this.http.get<IApiResponse<{ match: IMatch; bookedSeatIds: string[] }>>(`${this.API}/${id}`);
  }

  getLiveScores(): Observable<IApiResponse<{ matches: IMatch[] }>> {
    return this.http.get<IApiResponse<{ matches: IMatch[] }>>(`${this.API}/live-scores`);
  }

  createMatch(data: Partial<IMatch>): Observable<IApiResponse<{ match: IMatch }>> {
    return this.http.post<IApiResponse<{ match: IMatch }>>(this.API, data);
  }

  updateMatch(id: string, data: Partial<IMatch>): Observable<IApiResponse<{ match: IMatch }>> {
    return this.http.put<IApiResponse<{ match: IMatch }>>(`${this.API}/${id}`, data);
  }

  deleteMatch(id: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(`${this.API}/${id}`);
  }

  getAnalytics(): Observable<IApiResponse<{ revenueData: unknown[]; topMatches: unknown[] }>> {
    return this.http.get<IApiResponse<{ revenueData: unknown[]; topMatches: unknown[] }>>(`${this.API}/analytics`);
  }

  updateFilters(filters: IMatchFilters): void {
    this.filtersSubject.next(filters);
  }
}
