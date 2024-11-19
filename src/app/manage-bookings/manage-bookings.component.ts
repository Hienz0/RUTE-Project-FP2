// manage-bookings.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../services/booking.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChangeDetectorRef } from '@angular/core';
import { ServicesService } from '../services/services.service';


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

  availableRooms: any[] = [];
selectedRoomId: string = '';



  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef,
    private servicesService: ServicesService

  ) {}

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('serviceId');
    if (this.serviceId) {
      this.loadAllBookings();
      // this.servicesService.get
    }
  }

  loadAllBookings(): void {
    console.log('Loading all bookings for serviceId:', this.serviceId);
  
    this.bookingService.getAccommodationBookingsByServiceId(this.serviceId).subscribe(
      async (response) => {
        const { accommodationBookings, tourBookings, vehicleBookings } = response;
  
        console.log('Accommodation bookings:', accommodationBookings);
        console.log('Tour bookings:', tourBookings);
        console.log('Vehicle bookings:', vehicleBookings);
  
        // Load room number and room type for accommodation bookings
        for (const booking of accommodationBookings) {
          if (booking.roomId) {
            try {
              // console.log('Room ID', booking.roomId)
              const room = await this.bookingService.getRoomById(booking.roomId).toPromise();
              // console.log('Room details:', room);
              booking.roomNumber = room?.roomNumber || 'Unknown';
              booking.roomType = room?.roomType || 'Unknown';
            } catch (error) {
              console.error('Error fetching room details:', error);
              booking.roomNumber = 'Unknown';
              booking.roomType = 'Unknown';
            }
          }
        }
  
        // Combine all booking types into one array
        this.bookings = [
          ...accommodationBookings,
          ...tourBookings,
          ...vehicleBookings,
        ];
        console.log('All Bookings:', this.bookings);
  
        // Filter bookings after combining them
        this.filterBookings(this.selectedStatus);
        console.log('Filtered Bookings:', this.filteredBookings);
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


  openManageAccommodationModal(booking: any): void {
    console.log('Opening manage accommodation modal');
    this.selectedBooking = booking;


    this.closeBookingModal();
    // Open the modal using Bootstrap's API
    const modal = new bootstrap.Modal(document.getElementById('manageAccommodationModal') as HTMLElement);
    modal.show();
}

closeManageAccommodationModal(): void {
  const modalElement = document.getElementById('manageAccommodationModal') as HTMLElement;
  const modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (modalInstance) {
    modalInstance.hide();
  }
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


earlyCheckout(selectedBooking: any): void {
  console.log('Initiating early checkout for', selectedBooking);

  Swal.fire({
    title: 'Confirm Early Checkout',
    text: 'Are you sure you want to proceed with early checkout?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Checkout Early',
  }).then((result: { isConfirmed: boolean }) => {
    if (result.isConfirmed) {
      // Call the BookingService to update the booking status
      this.bookingService.earlyCheckout(selectedBooking._id).subscribe(
        (response) => {
          console.log('Early checkout successful:', response);
          Swal.fire('Success', 'Booking status updated to Complete.', 'success');
          // Optionally, refresh the bookings list or update the UI
          this.loadAllBookings(); // Assuming you have a method to fetch updated bookings
          this.closeManageAccommodationModal();
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error during early checkout:', error);
          Swal.fire('Error', 'Failed to update booking status. Please try again.', 'error');
        }
      );
    }
  });
}


changeRoom(selectedBooking: any) {
  Swal.fire({
    title: 'Change Room',
    text: 'This feature allows you to change the room for the guest.',
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Proceed',
  // }).then((result) => {
  //   if (result.isConfirmed) {
  //     // Redirect or open a modal for room selection (implement as needed)
  //     this.router.navigate([`/change-room/${selectedBooking.serviceId}`]);
  //   }
  });
}


openChangeRoomModal(): void {
  console.log('Opening change room modal');
  const serviceId: string = this.route.snapshot.paramMap.get('serviceId') ?? '';
  const roomTypeId = this.selectedBooking.roomTypeId;
  const checkInDate = this.selectedBooking.checkInDate;
  const checkOutDate = this.selectedBooking.checkOutDate;

  console.log('serviceId', serviceId, 'roomTypeId', roomTypeId, 'checkInDate', checkInDate, 'checkOutDate', checkOutDate);

  this.bookingService.getAvailableRooms(serviceId, roomTypeId, checkInDate, checkOutDate).subscribe({
    next: (rooms) => {
      this.availableRooms = rooms;

      // Check if there are no available rooms
      if (this.availableRooms.length === 0) {
        Swal.fire(
          'No Available Rooms',
          'Unfortunately, there are no other rooms available for the selected date range.',
          'info'
        );
        return;
      }

      this.closeManageAccommodationModal();
      const modal = new bootstrap.Modal(document.getElementById('changeRoomModal') as HTMLElement);
      modal.show();
      console.log('Available rooms:', this.availableRooms);
    },
    error: (err) => {
      console.error('Error fetching available rooms:', err);
      Swal.fire('Error', 'Failed to fetch available rooms', 'error');
    },
  });
}



confirmRoomChange(): void {
  if (!this.selectedRoomId) {
    Swal.fire('Select Room', 'Please select a room to proceed.', 'warning');
    return;
  }

  console.log('Changing room to:', this.selectedRoomId);

  // Prepare the data to send to the backend
  const updateData = {
    bookingId: this.selectedBooking._id,  // The selected booking to update
    newRoomId: this.selectedRoomId        // The new roomId
  };

  // Make an API call to update the booking with the new roomId
  this.bookingService.changeRoom(updateData).subscribe({
    next: (response) => {
      console.log('Room change successful:', response);
      Swal.fire('Success', 'Room changed successfully', 'success');
      this.closeChangeRoomModal();  // Close the modal after successful room change
    },
    error: (err) => {
      console.error('Error changing room:', err);
      Swal.fire('Error', 'Failed to change the room', 'error');
    }
  });
}


closeChangeRoomModal(): void {
  const modalElement = document.getElementById('changeRoomModal') as HTMLElement;
  const modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (modalInstance) {
    modalInstance.hide();
  }
}


}