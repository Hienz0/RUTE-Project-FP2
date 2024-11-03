import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { RouterModule } from '@angular/router'; // Import RouterModule
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ManageServicesComponent } from './manage-services/manage-services.component';
import { SwitchAccountComponent } from './switch-account/switch-account.component';
import { ReviewRegisterComponent } from './review-register/review-register.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { RegisterAsProviderComponent } from './register-as-provider/register-as-provider.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ReviewServicesComponent } from './review-services/review-services.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SearchComponent } from './search/search.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { AccommodationComponent } from './accommodation/accommodation.component';
import { AccommodationDetailComponent } from './accommodation-detail/accommodation-detail.component';
import { RestaurantComponent } from './restaurant/restaurant.component';
import { RestaurantDetailComponent } from './restaurant-detail/restaurant-detail.component';
import { ManageAccommodationComponent } from './manage-accommodation/manage-accommodation.component';
import { ManageRestaurantComponent } from './manage-restaurant/manage-restaurant.component';
import { AccommodationBookingDetailComponent } from './accommodation-booking-detail/accommodation-booking-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ManageServicesComponent,
    SwitchAccountComponent,
    ReviewRegisterComponent,
    LandingPageComponent,
    RegisterAsProviderComponent,
    DashboardComponent,
    AdminDashboardComponent,
    ReviewServicesComponent,
    SearchComponent,
    SearchResultsComponent,
    AccommodationComponent,
    AccommodationDetailComponent,
    RestaurantComponent,
    RestaurantDetailComponent,
    ManageAccommodationComponent,
    ManageRestaurantComponent,
    AccommodationBookingDetailComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatSnackBarModule, // Add comma here
    RouterModule.forRoot([
      { path: 'manage-services', component: ManageServicesComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'login', component: LoginComponent },
      { path: 'provider-registration', component: RegisterAsProviderComponent },
      { path: 'landing-page', component: LandingPageComponent },
      { path: '', redirectTo: 'landing-page', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'reviewProvider', component: ReviewRegisterComponent },
      { path: 'search-results', component: SearchResultsComponent },
      { path: 'accommodation', component: AccommodationComponent },
      {path: 'restaurant', component: RestaurantComponent },
      { path: 'restaurant-detail/:id', component: RestaurantDetailComponent }

    ]), BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
