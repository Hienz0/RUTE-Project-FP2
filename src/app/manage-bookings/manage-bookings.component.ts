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
      .filter(booking => booking.bookingStatus === status)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  

  openBookingModal(index: number): void {
    this.selectedBooking = this.filteredBookings[index];
    
    // Use Bootstrap's modal API to open the modal
    const modal = new bootstrap.Modal(this.bookingModal.nativeElement);
    modal.show();
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
            title: 'Booking Successful!',
            text: 'The booking status has been updated to Booked successfully.',
            confirmButtonColor: '#3085d6',
          });
      this.loadAccommodationBookings();

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
    // Logic to cancel the booking, e.g., update status, call API, etc.
    console.log('Cancelling booking:', booking);
}

}
