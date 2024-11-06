import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

declare var snap: any;

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css'],
})
export class PaymentListComponent implements OnInit {
  bookings: any[] = [];
  currentUser: any;

  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
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
          const serviceRequests = this.bookings.map((booking) =>
            this.servicesService.getTourGuideServiceById(booking.serviceId).pipe(
              map((serviceData) => ({ ...booking, serviceData })) // Combine booking with service data
            )
          );

          // Use forkJoin to wait for all requests to complete
          forkJoin(serviceRequests).subscribe(
            (bookingsWithServiceData) => {
              this.bookings = bookingsWithServiceData;
              console.log('Bookings with Service Data:', this.bookings);
            },
            (error) => {
              console.error('Error fetching service data:', error);
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

  payForBooking(bookingId: string, amount: number): void {
    this.servicesService.createTransaction(bookingId, amount, this.currentUser.userId).subscribe(
      (response) => {
        console.log('Transaction response:', response);
        if (response.token) {
          // Initiate Midtrans payment using the token
          window.snap.pay(response.token, {
            onSuccess: (result: any) => {
              alert('Payment successful!');
              this.verifyPayment(result);
            },
            onPending: (result: any) => {
              alert('Payment pending.');
            },
            onError: (error: any) => {
              console.error('Payment failed:', error);
              alert('Payment initiation failed.');
            },
          });
        } else {
          alert('Failed to initiate payment. No token returned.');
        }
      },
      (error) => {
        console.error('Payment error:', error);
        alert('Payment initiation failed.');
      }
    );
  }

  verifyPayment(result): void {
    this.servicesService.verifyPayment(result.order_id).subscribe(
      (response) => {
        if (response.success) {
          alert('Payment verified by admin.');
        } else {
          alert('Payment verification failed.');
        }
      },
      (error) => {
        console.error('Error verifying payment:', error);
        alert('Payment verification failed.');
      }
    );
  }
}
