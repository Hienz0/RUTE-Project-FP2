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
import { CustomizeProfileComponent } from './customize-profile/customize-profile.component';
import { TransportationServicesComponent } from './transportation-services/transportation-services.component';

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
  { path: 'search-results', component: SearchResultsComponent },
  {path:'customizeProfile', component: CustomizeProfileComponent},
  {path: 'transportationServices', component: TransportationServicesComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
