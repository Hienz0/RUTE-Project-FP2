import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css']
})
export class PaymentListComponent implements OnInit {
  bookings: any[] = [];
  currentUser: any;

  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      console.log('Current User:', this.currentUser);
      this.loadUserBookings();
    });
  }

  loadUserBookings(): void {
    if (this.currentUser && this.currentUser.userId) {
      this.servicesService.getUserBookings(this.currentUser.userId).subscribe(
        (data) => {
          this.bookings = data;
          console.log('Fetched bookings:', this.bookings);

          // Create an array of service requests
          const serviceRequests = this.bookings.map(booking =>
            this.servicesService.getTourGuideServiceById(booking.serviceId).pipe(
              map(serviceData => ({ ...booking, serviceData })) // Combine booking with service data
            )
          );

          // Use forkJoin to wait for all requests to complete
          forkJoin(serviceRequests).subscribe(
            (bookingsWithServiceData) => {
              this.bookings = bookingsWithServiceData;
              console.log('Bookings with Service Data:', this.bookings);
            }
          );
        },
        (error) => {
          console.error('Error fetching bookings:', error);
        }
      );
    } else {
      console.error('No user ID found');
    }
  }

  payForBooking(bookingId: string): void {
    console.log('Payment initiated for booking:', bookingId);
    // Integrate payment gateway logic here
  }
}
