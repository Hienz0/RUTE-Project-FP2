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
import { RestaurantComponent } from './restaurant/restaurant.component';
import { RestaurantDetailComponent } from './restaurant-detail/restaurant-detail.component';
import { ManageAccommodationComponent } from './manage-accommodation/manage-accommodation.component';
import { ManageRestaurantComponent } from './manage-restaurant/manage-restaurant.component';
import { AccommodationBookingDetailComponent } from './accommodation-booking-detail/accommodation-booking-detail.component';
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
import { ReviewListComponent } from './review-list/review-list.component';

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
  { path: 'manage-accommodation/:serviceId', component: ManageAccommodationComponent },
  {path: 'booking-tour-guide', component: BookingTourGuideComponent},
  { path: 'tour-guide/:id', component: BookingTourGuideDetailComponent},
  { path: '', redirectTo: '/accommodation', pathMatch: 'full' }, // Default route
  {path: 'restaurant', component: RestaurantComponent },
  { path: 'restaurant-detail/:id', component: RestaurantDetailComponent },
  {path: 'manage-restaurant/:serviceId', component: ManageRestaurantComponent },
  { path: 'accommodation-booking-detail/:bookingId', component: AccommodationBookingDetailComponent },
  { path: 'manage-bookings/:serviceId', component: ManageBookingsComponent },
  { path: 'bookings/:userId', component: BookingsComponent },
  {path: 'manage-tour/:serviceId', component: ManageTourComponent},
  // {path: 'manage-tour', component: ManageTourComponent},
  { path: 'search-results', component: SearchResultsComponent },
  {path:'customizeProfile', component: CustomizeProfileComponent},
  {path:'review-list/:serviceId', component: ReviewListComponent},
 
  {path: 'transportationService', component: TransportationServicesComponent},
  {path:'manageTransportation/:id', component: ManageTransportationComponent},
  {path:'transportationDetail/:id', component: BookTransportationComponent},
  {path:'rateServices/:id', component: RateServicesComponent},
  {path: 'payment-list', component: PaymentListComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
