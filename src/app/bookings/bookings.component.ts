import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../services/booking.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';


declare const Swal: any;
declare var bootstrap: any;
declare var window: any;

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

  bookingId: string | null = null;



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

      this.bookingId = this.route.snapshot.paramMap.get('userId');
      console.log('Booking ID:', this.bookingId);
    });
  
    // This line should be removed to avoid calling loadBookings prematurely
    // this.loadBookings();
  }
  

loadAccommodationBookings(): void {
  console.log('Loading bookings...');
  this.bookingService.getAccommodationBookingsByUserId(this.userId).subscribe(
    (bookings) => {
      this.bookings = bookings;
      console.log('Bookings:', this.bookings);

      // Filter bookings after loading
      this.filterBookings(this.selectedStatus);

      // Delay to ensure filteredBookings is fully populated before searching for a match
      setTimeout(() => {
        const matchingIndex = this.filteredBookings.findIndex(booking => booking._id === this.bookingId);
        if (matchingIndex !== -1) {
          this.openBookingModal(matchingIndex);
        }
      });
    },
    (error) => {
      console.error('Error loading bookings:', error);
    }
  );
}
  
  


  filterBookings(status: string): void {
    this.selectedStatus = status;
  
    this.filteredBookings = this.bookings
      .filter(booking =>
        status === 'Pending'
          ? ['Waiting for payment', 'Pending'].includes(booking.bookingStatus)
          : booking.bookingStatus === status
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  

  openBookingModal(index: number): void {
    console.log('modal called');
    this.selectedBooking = this.filteredBookings[index];
    
    // Use Bootstrap's modal API to open the modal
    const modal = new bootstrap.Modal(this.bookingModal.nativeElement);
    modal.show();
  }

  closeBookingModal(): void {
    // Ensure the modal is defined and close it
    if (this.bookingModal) {
      const modal = new bootstrap.Modal(this.bookingModal.nativeElement, {
        backdrop: 'static' // or you can set it to 'false' if you want to disable the backdrop
      });
      modal.hide();
      // Manually remove the backdrop if it's still there
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  }
  

  payForBooking(bookingId: string, amount: number, bookingType: string): void {
    console.log("test", bookingId, amount, bookingType);
    console.log("test", this.currentUser.userId);
    this.bookingService.createTransaction(bookingId, amount, this.currentUser.userId).subscribe(response => {
      console.log("test", bookingId)
      
        if (response.token) {
            window.snap.pay(response.token, {
                onSuccess: (result: any) => {
                    this.bookingService.updatePaymentStatus(bookingId, bookingType).subscribe(
                      () => Swal.fire({
                          icon: 'success',
                          title: 'Payment successful!',
                          text: 'We will let the provider know. Please wait for verification.'
                      }),
                      (error) => Swal.fire({
                          icon: 'error',
                          title: 'Error',
                          text: 'Failed to update booking status. Please try again later.'
                      })
                  );
                  
                    this.loadAccommodationBookings();
                                    // Close the modal after payment is processed
                const modal = new bootstrap.Modal(this.bookingModal.nativeElement);
                this.closeBookingModal(); // Close the modal
                },
                // Handle other payment responses...
            });
        } else {
            alert('Failed to initiate payment. No token returned.');
        }
    });
  }

cancelBooking(booking: any): void {
    // Logic to cancel the booking, e.g., update status, call API, etc.
    console.log('Cancelling booking:', booking);
}

}
