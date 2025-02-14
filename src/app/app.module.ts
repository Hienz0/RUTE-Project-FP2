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
import { SafeUrlPipe } from './safe-url.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ManageBookingsComponent } from './manage-bookings/manage-bookings.component';
import { BookingsComponent } from './bookings/bookings.component';
import { BookingTourGuideComponent } from './booking-tour-guide/booking-tour-guide.component';
import { BookingTourGuideDetailComponent } from './booking-tour-guide-detail/booking-tour-guide-detail.component';
import { ManageTourComponent } from './manage-tour/manage-tour.component';
import { PaymentListComponent } from './payment-list/payment-list.component';
import { CustomizeProfileComponent } from './customize-profile/customize-profile.component';
import { TransportationServicesComponent } from './transportation-services/transportation-services.component';
import { BookTransportationComponent } from './book-transportation/book-transportation.component';
import { ManageTransportationComponent } from './manage-transportation/manage-transportation.component';
import { RateServicesComponent } from './rate-services/rate-services.component';
import { UserNavbarComponent } from './user-navbar/user-navbar.component';
import { ReviewListComponent } from './review-list/review-list.component';
import { ProviderNavbarComponent } from './provider-navbar/provider-navbar.component';
import { TruncateLocationPipe } from './truncate-location.pipe';
import { TruncatePipe } from './truncate.pipe';
import { WeatherWidgetComponent } from './weather-widget/weather-widget.component';
import { RequestResetPasswordComponent } from './request-reset-password/request-reset-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { FloatingWeatherWidgetComponent } from './floating-weather-widget/floating-weather-widget.component';
import { AiCustomerServiceComponent } from './ai-customer-service/ai-customer-service.component';
import { CustomerServiceComponent } from './customer-service/customer-service.component';
import { TranslatePageComponent } from './translate-page/translate-page.component';
import { ChatComponent } from './chat/chat.component';
import { PlanningItineraryComponent } from './planning-itinerary/planning-itinerary.component';

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
    AccommodationBookingDetailComponent,
    SafeUrlPipe,
    ManageBookingsComponent,
    BookingsComponent,
    BookingTourGuideComponent,
    BookingTourGuideDetailComponent,
    ManageTourComponent,
    PaymentListComponent,
    CustomizeProfileComponent,
    TransportationServicesComponent,
    BookTransportationComponent,
    ManageTransportationComponent,
    RateServicesComponent,
    UserNavbarComponent,
    ReviewListComponent,
    ProviderNavbarComponent,
    TruncateLocationPipe,
    TruncatePipe,
    WeatherWidgetComponent,
    RequestResetPasswordComponent,
    ResetPasswordComponent,
    FloatingWeatherWidgetComponent,
    AiCustomerServiceComponent,
    CustomerServiceComponent,
    TranslatePageComponent,
    ChatComponent,
    PlanningItineraryComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatSnackBarModule, // Add comma here
    MatTooltipModule,
    MatButtonModule,
    MatChipsModule,
    MatGridListModule,
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
      { path: 'restaurant-detail/:id', component: RestaurantDetailComponent },
      { path: 'booking-tour-guide', component: BookingTourGuideComponent}

    ]), BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
