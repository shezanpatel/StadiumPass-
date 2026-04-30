import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// App Routes
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// Components
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { LiveTickerComponent } from './components/shared/live-ticker/live-ticker.component';
import { ToastComponent } from './components/shared/toast/toast.component';
import { SkeletonLoaderComponent } from './components/shared/skeleton-loader/skeleton-loader.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AdminLoginComponent } from './components/auth/admin-login/admin-login.component';
import { DashboardComponent } from './components/booking/dashboard/dashboard.component';
import { MatchCardComponent } from './components/booking/match-card/match-card.component';
import { MatchDetailComponent } from './components/booking/match-detail/match-detail.component';
import { StadiumMapComponent } from './components/booking/stadium-map/stadium-map.component';
import { CheckoutComponent } from './components/booking/checkout/checkout.component';
import { ETicketComponent } from './components/booking/e-ticket/e-ticket.component';
import { UserProfileComponent } from './components/booking/user-profile/user-profile.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { MatchFormComponent } from './components/admin/match-form/match-form.component';
import { HomeComponent } from './components/shared/home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent, FooterComponent, LiveTickerComponent,
    ToastComponent, SkeletonLoaderComponent, HomeComponent,
    LoginComponent, RegisterComponent, AdminLoginComponent,
    DashboardComponent, MatchCardComponent, MatchDetailComponent,
    StadiumMapComponent, CheckoutComponent, ETicketComponent, UserProfileComponent,
    AdminDashboardComponent, MatchFormComponent,
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule,
    HttpClientModule, ReactiveFormsModule, FormsModule,
    RouterModule, AppRoutingModule,
    MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
