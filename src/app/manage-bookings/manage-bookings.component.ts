// manage-bookings.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../services/booking.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChangeDetectorRef } from '@angular/core';


declare const Swal: any;
declare var bootstrap: any;

@Component({
  selector: 'app-manage-bookings',
  templateUrl: './manage-bookings.component.html',
  styleUrls: ['./manage-bookings.component.css'],
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
export class ManageBookingsComponent implements OnInit {
  serviceId: string | null = null;
  bookings: any[] = [];
  filteredBookings: any[] = [];
  selectedStatus: string = 'Pending'; // Default to Pending
  @ViewChild('bookingModal', { static: true }) bookingModal!: ElementRef;
  selectedBooking: any | null = null;
  selectedBookingType: string = ''; // Default to Pending


  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef

  ) {}

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('serviceId');
    if (this.serviceId) {
      this.loadAllBookings();
    }
  }

  loadAllBookings(): void {
    console.log('Loading all bookings for serviceId:', this.serviceId);
  
    this.bookingService.getAccommodationBookingsByServiceId(this.serviceId).subscribe(
      (response) => {
        // Assuming 'response' contains the three booking categories
        const { accommodationBookings, tourBookings, vehicleBookings } = response;
  
        // Combine all booking types into one array
        this.bookings = [
          ...accommodationBookings,
          ...tourBookings,
          ...vehicleBookings,
        ];
        console.log('All Bookings:', this.bookings);
  
        console.log('Tour bookings:', tourBookings);
        console.log('Vehicle bookings:', vehicleBookings);
  
        // Filter bookings after combining them
        this.filterBookings(this.selectedStatus);
        console.log('Filtered Bookings:', this.filteredBookings);
  
        // Delay to ensure filteredBookings is fully populated before searching for a match
        // setTimeout(() => {
        //   const matchingIndex = this.filteredBookings.findIndex((booking) => booking._id === this.bookingId);
        //   if (matchingIndex !== -1) {
        //     this.openBookingModal(matchingIndex);
        //   }
        // });
      },
      (error) => {
        console.error('Error loading bookings:', error);
      }
    );
  }
  
  


  filterBookings(status: string): void {
    this.selectedStatus = status;
  
    this.filteredBookings = this.bookings
      .filter((booking) =>
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
  

  verifyBooking(booking: any): void {
    const bookingType = this.selectedBookingType; // Determine the type of booking (Accommodation, Tour Guide, Transportation)

    console.log('Verifying booking:', booking);

    this.bookingService.updateBookingStatus(booking._id, 'Booked', bookingType)
        .subscribe(
            (response) => {
                console.log('Booking status updated to Booked:', response);
                booking.bookingStatus = 'Booked'; // Update the status locally

                // Show success message with SweetAlert2
                Swal.fire({
                    icon: 'success',
                    title: 'Verification Successful!',
                    text: 'The booking was verified successfully.',
                    confirmButtonColor: '#3085d6',
                });

                this.loadAllBookings();
                this.closeBookingModal();
            },
            (error) => {
                console.error('Failed to update booking status:', error);

                // Show error message with SweetAlert2 if update fails
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: 'Failed to update the booking status. Please try again.',
                    confirmButtonColor: '#d33',
                });
            }
        );
}

  
  

  cancelBooking(booking: any): void {
    const userType = 'Provider';
    const bookingType = this.selectedBookingType; // Get the type of booking (Accommodation, Tour Guide, Transportation)
    console.log('Canceling booking:', booking, bookingType, userType, booking._id);

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
            this.bookingService.cancelBooking(booking._id, userType, bookingType).subscribe({
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
