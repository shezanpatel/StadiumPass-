import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatchService } from '../../../services/match.service';
import { IMatch } from '../../../models/interfaces';
import { interval, Subject, takeUntil, switchMap, startWith } from 'rxjs';

@Component({
  selector: 'app-live-ticker',
  templateUrl: './live-ticker.component.html'
})
export class LiveTickerComponent implements OnInit, OnDestroy {
  liveMatches: IMatch[] = [];
  private destroy$ = new Subject<void>();

  constructor(private matchService: MatchService) {}

  ngOnInit(): void {
    interval(30000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() => this.matchService.getLiveScores())
    ).subscribe(res => { this.liveMatches = res.data.matches; });
  }

  get tickerText(): string {
    if (!this.liveMatches.length) return 'No live matches right now • Stay tuned for upcoming fixtures • StadiumPass — India\'s #1 Cricket Ticket Platform';
    return this.liveMatches.map(m =>
      `🏏 ${m.team1} ${m.score?.team1?.runs ?? 0}/${m.score?.team1?.wickets ?? 0} (${m.score?.team1?.overs ?? 0} ov) vs ${m.team2} ${m.score?.team2?.runs ?? 0}/${m.score?.team2?.wickets ?? 0} (${m.score?.team2?.overs ?? 0} ov)`
    ).join('    •    ');
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
