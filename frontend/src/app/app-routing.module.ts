import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ClientGuard } from './guards/client.guard';
import { HomeComponent } from './components/shared/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AdminLoginComponent } from './components/auth/admin-login/admin-login.component';
import { DashboardComponent } from './components/booking/dashboard/dashboard.component';
import { MatchDetailComponent } from './components/booking/match-detail/match-detail.component';
import { CheckoutComponent } from './components/booking/checkout/checkout.component';
import { ETicketComponent } from './components/booking/e-ticket/e-ticket.component';
import { UserProfileComponent } from './components/booking/user-profile/user-profile.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { MatchFormComponent } from './components/admin/match-form/match-form.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin-login', component: AdminLoginComponent },

  // Client-only routes (admins blocked)
  { path: 'matches',      component: DashboardComponent,   canActivate: [AuthGuard, ClientGuard] },
  { path: 'matches/:id',  component: MatchDetailComponent, canActivate: [AuthGuard, ClientGuard] },
  { path: 'checkout/:id', component: CheckoutComponent,    canActivate: [AuthGuard, ClientGuard] },
  { path: 'ticket/:id',   component: ETicketComponent,     canActivate: [AuthGuard, ClientGuard] },
  { path: 'profile',      component: UserProfileComponent, canActivate: [AuthGuard, ClientGuard] },

  // Admin-only routes
  { path: 'admin',                   component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'admin/matches/new',       component: MatchFormComponent,      canActivate: [AuthGuard, AdminGuard] },
  { path: 'admin/matches/:id/edit',  component: MatchFormComponent,      canActivate: [AuthGuard, AdminGuard] },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
