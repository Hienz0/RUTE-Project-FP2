// manage-bookings.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../services/booking.service';
import { trigger, transition, style, animate } from '@angular/animations';

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

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('serviceId');
    if (this.serviceId) {
      this.loadAccommodationBookings();
    }
  }

  loadAccommodationBookings(): void {
    this.bookingService.getAccommodationBookingsByServiceId(this.serviceId).subscribe(
      (bookings) => {
        this.bookings = bookings;
        this.filterBookings(this.selectedStatus); // Call filtering here after data is loaded
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
            status === 'Canceled'
                ? ['Canceled by Traveller', 'Canceled by Provider'].includes(booking.bookingStatus)
                : booking.bookingStatus === status
        )
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  

  openBookingModal(index: number): void {
    this.selectedBooking = this.filteredBookings[index];
    
    // Use Bootstrap's modal API to open the modal
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

  verifyBooking(booking: any): void {
    console.log('Verifying booking:', booking);
  
    this.bookingService.updateBookingStatus(booking._id, 'Booked')
      .subscribe(
        (response) => {
          console.log('Booking status updated to Booked:', response);
          booking.bookingStatus = 'Booked'; // Update the status locally if needed
  
          // Show success message with SweetAlert2
          Swal.fire({
            icon: 'success',
            title: 'Verification Successful!',
            text: 'The booking verified successfully.',
            confirmButtonColor: '#3085d6',
          });
      this.loadAccommodationBookings();
      this.closeBookingModal(); // Close the modal

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
                    this.loadAccommodationBookings();
                    this.closeBookingModal(); // Close the modal
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
