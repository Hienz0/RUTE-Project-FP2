import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../services/booking.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';


declare const Swal: any;
declare var bootstrap: any;

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }), // Start with transparent
        animate('500ms ease-in', style({ opacity: 1 })) // Fade in over 500ms
      ]),
      transition(':leave', [
        animate('500ms ease-out', style({ opacity: 0 })) // Fade out over 500ms
      ])
    ])
  ]
})
export class BookingsComponent implements OnInit {
  serviceId: string | null = null;
  bookings: any[] = [];
  filteredBookings: any[] = [];
  selectedStatus: string = 'Pending'; // Default to Pending
  @ViewChild('bookingModal', { static: true }) bookingModal!: ElementRef;
  selectedBooking: any | null = null;

  currentUser: any;
  userId: string | null = null;


  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private authService: AuthService

  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.userId = this.currentUser.userId;
  
      console.log('Current User', this.currentUser);
      console.log('User ID:', this.userId);
  
      // Ensure loadBookings is called after userId is assigned
      this.loadAccommodationBookings();
    });
  
    // This line should be removed to avoid calling loadBookings prematurely
    // this.loadBookings();
  }
  

  loadAccommodationBookings(): void {
    console.log('testing');
    this.bookingService.getAccommodationBookingsByUserId(this.userId).subscribe(
      (bookings) => {
        this.bookings = bookings;
        console.log('Bookings:', this.bookings);
        this.filterBookings(this.selectedStatus); // Call filtering here after data is loaded
      },
      (error) => {
        console.error('Error loading bookings:', error);
      }
    );
  }
  
  


  filterBookings(status: string): void {
    this.selectedStatus = status;
    this.filteredBookings = this.bookings.filter(booking => 
      booking.bookingStatus === status
    );
  }

  openBookingModal(index: number): void {
    this.selectedBooking = this.filteredBookings[index];
    
    // Use Bootstrap's modal API to open the modal
    const modal = new bootstrap.Modal(this.bookingModal.nativeElement);
    modal.show();
  }

  payBooking(booking: any): void {
    // Logic to verify the booking, e.g., update status, call API, etc.
    console.log('Verifying booking:', booking);
}

cancelBooking(booking: any): void {
    // Logic to cancel the booking, e.g., update status, call API, etc.
    console.log('Cancelling booking:', booking);
}

}
