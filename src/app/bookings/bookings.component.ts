import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../services/booking.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';


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
  selectedBookingType: string = ''; // Default to Pending
  @ViewChild('bookingModal', { static: true }) bookingModal!: ElementRef;
  selectedBooking: any | null = null;

  currentUser: any;
  userId: string | null = null;

  bookingId: string | null = null;



  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef

  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.userId = this.currentUser.userId;
  
      console.log('Current User', this.currentUser);
      console.log('User ID:', this.userId);
  
      // Ensure loadBookings is called after userId is assigned
      this.loadAllBookings();

      this.bookingId = this.route.snapshot.paramMap.get('userId');
      console.log('Booking ID:', this.bookingId);
    });
  
    // This line should be removed to avoid calling loadBookings prematurely
    // this.loadBookings();
  }
  

  loadAllBookings(): void {
    console.log('Loading all bookings...');
    
    this.bookingService.getAccommodationBookingsByUserId(this.userId).subscribe(
      (response) => {
        // Assuming 'response' contains the three booking categories
        const { accommodationBookings, tourBookings, vehicleBookings } = response;
    
        // Combine all booking types into one array
        this.bookings = [
          ...accommodationBookings,
          ...tourBookings,
          ...vehicleBookings
        ];
        console.log('All Bookings:', this.bookings);

        console.log('tour', tourBookings);
        console.log('vehicle', vehicleBookings);
    
        // Filter bookings after combining them
        this.filterBookings(this.selectedStatus);
        console.log('Filtered Bookings:', this.filteredBookings);
    
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
          : status === 'Canceled'
          ? ['Canceled by Traveller', 'Canceled by Provider'].includes(booking.bookingStatus)
          : booking.bookingStatus === status
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
    this.cdr.detectChanges();
  }
  

  
  

  openBookingModal(index: number): void {
    console.log('Opening booking modal');
    this.selectedBooking = this.filteredBookings[index];
  
    // Determine the booking type based on available fields
    if (this.selectedBooking.accommodationType) {
      this.selectedBookingType = 'Accommodation';
    } else if (this.selectedBooking.vehicleBooking) {
      this.selectedBookingType = 'Vehicle';
    } else if (this.selectedBooking.tourName) {
      this.selectedBookingType = 'Tour';
    }
  
    // Open the modal using Bootstrap's API
    const modal = new bootstrap.Modal(this.bookingModal.nativeElement);
    modal.show();
  }
  


  closeBookingModal(): void {
    // Ensure the modal element and instance are defined
    if (this.bookingModal && this.bookingModal.nativeElement) {
        const modalElement = this.bookingModal.nativeElement;
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);

        // Hide the modal using the instance
        modalInstance.hide();

        // Manually remove the backdrop if it persists
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }
}
  

payForBooking(bookingId: string, amount: number, bookingType: string): void {
  console.log(bookingType);
    // Check if the booking type is "Transportation"
    if (bookingType === 'Vehicle') {
      const selectedVehicleBooking = this.bookings.find(
        (booking) => booking._id === bookingId
      );

      console.log('Selected vehicle', selectedVehicleBooking);
  
      if (selectedVehicleBooking && selectedVehicleBooking.vehicleBooking?.length > 0) {
        console.log('masuk');
        // Update the amount to the totalPrice from the vehicleBooking array
        amount = selectedVehicleBooking.vehicleBooking[0].totalPrice;
      }
    }
  
  console.log('Initiating payment for', bookingId, amount, bookingType);

  this.bookingService.createTransaction(bookingId, amount, this.currentUser.userId, bookingType).subscribe(response => {
    if (response.token) {
      window.snap.pay(response.token, {
        onSuccess: (result: any) => {
          console.log('Payment successful:', result);
          this.bookingService.updatePaymentStatus(bookingId, bookingType).subscribe(
            () => {
              console.log(`${bookingType} booking updated successfully.`);
              this.loadAllBookings();
              this.closeBookingModal();
              this.cdr.detectChanges();
            },
            error => {
              console.error('Failed to update booking status:', error);
            }
          );
        },
        onPending: (result: any) => {
          console.log('Payment is pending:', result);
        },
        onError: (result: any) => {
          console.error('Payment failed:', result);
        },
        onClose: () => {
          console.warn('Payment popup was closed before completion.');
        }
      });
    } else {
      alert('Failed to initiate payment. No token returned.');
    }
  }, error => {
    console.error('Error creating transaction:', error);
    alert('Transaction creation failed. Please try again.');
  });
}


  cancelBooking(booking: any): void {
    const userType = 'Traveller';

    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to cancel this booking?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'No, keep it'
    }).then((result: any) => {
        if (result.isConfirmed) {
            this.bookingService.cancelBooking(booking._id, userType).subscribe({
                next: () => {
                    this.loadAllBookings();
                    this.closeBookingModal();
                },
                error: (error) => {
                    console.error('Error canceling booking:', error);
                    Swal.fire('Error', 'Failed to cancel booking', 'error');
                }
            });
        }
    });
}


}
