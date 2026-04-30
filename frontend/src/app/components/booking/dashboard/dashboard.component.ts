import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatchService, IMatchFilters } from '../../../services/match.service';
import { IMatch, TournamentType } from '../../../models/interfaces';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  matches: IMatch[] = [];
  isLoading = true;
  totalPages = 1;
  currentPage = 1;
  filterForm!: FormGroup;

  readonly tournaments: TournamentType[] = ['IPL', 'World Cup', 'T20I', 'ODI', 'Test', 'Asia Cup', 'Champions Trophy', 'BBL'];
  readonly statuses = ['upcoming', 'live', 'completed'];

  private destroy$ = new Subject<void>();

  constructor(private matchService: MatchService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      tournament: [''], team: [''], status: ['upcoming']
    });
    this.loadMatches();
    this.filterForm.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(() => { this.currentPage = 1; this.loadMatches(); });
  }

  loadMatches(): void {
    this.isLoading = true;
    const filters: IMatchFilters = { ...this.filterForm.value, page: this.currentPage, limit: 9 };
    // Remove empty string filters
    Object.keys(filters).forEach(k => { if ((filters as Record<string, unknown>)[k] === '') delete (filters as Record<string, unknown>)[k]; });

    this.matchService.getMatches(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.matches = res.data.matches;
        this.totalPages = res.data.pagination.pages;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  clearFilters(): void { this.filterForm.reset({ tournament: '', team: '', status: 'upcoming' }); }
  changePage(page: number): void { this.currentPage = page; this.loadMatches(); }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
