import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchService } from '../../../services/match.service';
import { ToastService } from '../../../services/toast.service';
import { TournamentType } from '../../../models/interfaces';

// Custom validator: date must be in the future
function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selected = new Date(control.value);
  const now = new Date();
  return selected > now ? null : { pastDate: true };
}

@Component({
  selector: 'app-match-form',
  templateUrl: './match-form.component.html'
})
export class MatchFormComponent implements OnInit {
  matchForm!: FormGroup;
  isEditing = false;
  matchId: string | null = null;
  isLoading = false;

  readonly tournaments: TournamentType[] = ['IPL', 'World Cup', 'T20I', 'ODI', 'Test', 'Asia Cup', 'Champions Trophy', 'BBL'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private matchService: MatchService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.matchId && this.matchId !== 'new';
    this.buildForm();
    if (this.isEditing && this.matchId) {
      this.matchService.getMatchById(this.matchId).subscribe(res => {
        const m = res.data.match;
        this.matchForm.patchValue({
          title: m.title,
          team1: m.team1,
          team2: m.team2,
          tournament: m.tournament,
          dateTime: new Date(m.dateTime).toISOString().slice(0, 16),
          venue: typeof m.venue === 'object' ? m.venue._id : m.venue,
          totalSeats: m.totalSeats,
          isFeatured: m.isFeatured,
          general: m.ticketPricing.general,
          premium: m.ticketPricing.premium,
          vip: m.ticketPricing.vip,
          corporate: m.ticketPricing.corporate,
          weatherCondition: m.weather?.condition ?? 'Clear',
          weatherTemperature: m.weather?.temperature ?? 28,
        });
      });
    }
  }

  buildForm(): void {
    this.matchForm = this.fb.group({
      title:      ['', Validators.required],
      team1:      ['', Validators.required],
      team2:      ['', Validators.required],
      tournament: ['IPL', Validators.required],
      venue:      ['', Validators.required],
      dateTime:   ['', [Validators.required, futureDateValidator]],
      totalSeats: [50000, [Validators.required, Validators.min(1000)]],
      isFeatured: [false],
      general:    [500,   [Validators.required, Validators.min(0)]],
      premium:    [1500,  [Validators.required, Validators.min(0)]],
      vip:        [5000,  [Validators.required, Validators.min(0)]],
      corporate:  [10000, [Validators.required, Validators.min(0)]],
      weatherCondition:   ['Clear'],
      weatherTemperature: [28],
    });
  }

  // Returns current datetime in the format required by datetime-local input
  get minDateTime(): string {
    return new Date().toISOString().slice(0, 16);
  }

  get dateTimeControl(): AbstractControl {
    return this.matchForm.get('dateTime')!;
  }

  getDateError(): string {
    if (this.dateTimeControl.hasError('required')) return 'Date and time is required.';
    if (this.dateTimeControl.hasError('pastDate')) return 'Match date must be in the future.';
    return '';
  }

  onSubmit(): void {
    if (this.matchForm.invalid) { this.matchForm.markAllAsTouched(); return; }
    this.isLoading = true;
    const v = this.matchForm.value as {
      title: string; team1: string; team2: string; tournament: TournamentType;
      venue: string; dateTime: string; totalSeats: number; isFeatured: boolean;
      general: number; premium: number; vip: number; corporate: number;
      weatherCondition: string; weatherTemperature: number;
    };

    const payload = {
      title: v.title,
      team1: v.team1,
      team2: v.team2,
      tournament: v.tournament,
      venue: v.venue,
      dateTime: new Date(v.dateTime).toISOString(),
      totalSeats: v.totalSeats,
      isFeatured: v.isFeatured,
      ticketPricing: {
        general: v.general,
        premium: v.premium,
        vip: v.vip,
        corporate: v.corporate,
        dynamicMultiplier: 1
      },
      weather: {
        condition: v.weatherCondition,
        temperature: v.weatherTemperature,
        icon: '☀️',
        humidity: 60,
        windSpeed: 10
      }
    };

    const req$ = this.isEditing && this.matchId
      ? this.matchService.updateMatch(this.matchId, payload)
      : this.matchService.createMatch(payload);

    req$.subscribe({
      next: () => {
        this.toast.success(`Match ${this.isEditing ? 'updated' : 'created'}!`);
        this.router.navigate(['/admin']);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }
}
