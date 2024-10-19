import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReviewRegisterComponent } from './review-register/review-register.component';
import { ManageServicesComponent } from './manage-services/manage-services.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { RegisterAsProviderComponent } from './register-as-provider/register-as-provider.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ReviewServicesComponent } from './review-services/review-services.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { AccommodationComponent } from './accommodation/accommodation.component';
import { AccommodationDetailComponent } from './accommodation-detail/accommodation-detail.component';
import { BookingTourGuideComponent } from './booking-tour-guide/booking-tour-guide.component';
import { BookingTourGuideDetailComponent } from './booking-tour-guide-detail/booking-tour-guide-detail.component';

const routes: Routes = [
  {path: 'reviewProvider', component: ReviewRegisterComponent},
  {path: 'manage-services', component: ManageServicesComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'login', component: LoginComponent},
  {path: 'provider-registration', component: RegisterAsProviderComponent},
  {path: 'landing-page', component: LandingPageComponent},
  {path: '', redirectTo: 'landing-page', pathMatch: 'full'},
  {path: 'dashboard', component: DashboardComponent},
  {path: 'adminDashboard',component: AdminDashboardComponent },
  {path: 'reviewServices',component: ReviewServicesComponent},
  {path: 'search-results', component: SearchResultsComponent },
  {path: 'accommodation', component: AccommodationComponent },
  { path: 'accommodation/:id', component: AccommodationDetailComponent }, // Route for details page
  {path: 'booking-tour-guide', component: BookingTourGuideComponent},
  { path: 'tour-guide/:id', component: BookingTourGuideDetailComponent},
  { path: '', redirectTo: '/accommodation', pathMatch: 'full' }, // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
