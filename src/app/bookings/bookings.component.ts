import { Component, OnInit, ViewChild, ElementRef, OnDestroy  } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../services/booking.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import axios from 'axios'; // Import axios for reverse geocoding


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
export class BookingsComponent implements OnInit, OnDestroy  {
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
  remainingTimes: { [key: string]: number } = {}; // Track remaining times for each booking
interval: any;
location: string = '';
 pickupAddress: string = '';
  dropoffAddress: string = '';



  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router

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

    this.startCountdown();
  
    // This line should be removed to avoid calling loadBookings prematurely
    // this.loadBookings();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
  

  loadAllBookings(): void {
    console.log('Loading all bookings...');
    
    this.bookingService.getAccommodationBookingsByUserId(this.userId).subscribe(
      (response) => {
        const { accommodationBookings, tourBookings, vehicleBookings } = response;
    
        // Combine all booking types into one array
        this.bookings = [
          ...accommodationBookings,
          ...tourBookings,
          ...vehicleBookings
        ];
  
        // Sort combined bookings by 'updatedAt'
        this.bookings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
        console.log('All Sorted Bookings:', this.bookings);
    
        // Filter bookings after sorting them
        this.filterBookings(this.selectedStatus);
        console.log('Filtered Bookings:', this.filteredBookings);

          // Fetch addresses for each booking
        this.bookings.forEach((booking) => {
          if (booking.vehiclePickupLocation) {
            const [pickupLat, pickupLng] = booking.vehiclePickupLocation
              .split(',')
              .map((coord: string) => parseFloat(coord.trim())); // Explicit type added
            this.reverseGeocode(pickupLat, pickupLng, 'pickup', booking);
          }
          if (booking.vehicleDropoffLocation) {
            const [dropoffLat, dropoffLng] = booking.vehicleDropoffLocation
              .split(',')
              .map((coord: string) => parseFloat(coord.trim())); // Explicit type added
            this.reverseGeocode(dropoffLat, dropoffLng, 'dropoff', booking);
          }
        });
    
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
          ? ['Waiting for payment', 'Pending', 'Expired'].includes(booking.bookingStatus)
          : status === 'Canceled'
          ? ['Canceled by Traveller', 'Canceled by Provider'].includes(booking.bookingStatus)
          : status === 'Booked'
          ? ['Booked', 'Served'].includes(booking.bookingStatus)
          : booking.bookingStatus === status
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
    this.cdr.detectChanges();
  }
  
  startCountdown(): void {
    this.interval = setInterval(() => {
      if (this.selectedBooking) { // Check if a booking is selected
        if (this.selectedBooking.paymentExpiration) {
          const remainingTime = this.getRemainingTime(this.selectedBooking.paymentExpiration);
          this.remainingTimes[this.selectedBooking._id] = remainingTime;
  
          // If the selected booking has expired, update its status locally
          if (remainingTime === 0 && this.selectedBooking.bookingStatus === 'Waiting for payment') {
            this.selectedBooking.bookingStatus = 'Expired'; // Update status locally
            console.log(`Booking ${this.selectedBooking._id} has expired.`);
            this.cdr.detectChanges();
          }
        }
      }
    }, 1000);
  }
  
  
  clearCountdown(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  
  getRemainingTime(expirationTime: string): number {
    const now = new Date().getTime();
    const expiration = new Date(expirationTime).getTime();
    return Math.max(expiration - now, 0); // Return remaining time in milliseconds
  }

  formatRemainingTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
  
    // Pad minutes and seconds with leading zeroes if needed
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
  
    return `${formattedMinutes}:${formattedSeconds}`;
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
    this.cdr.detectChanges();
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
  const bookingType = this.selectedBookingType; // Get the type of booking (Accommodation, Tour Guide, Transportation)

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


navigateToReview(bookingId: string): void {
  this.router.navigate(['rateServices/', bookingId]);
  console.log(bookingId);
}


reverseGeocode(
  lat: number,
  lng: number,
  type: 'pickup' | 'dropoff' | 'location',
  booking: any
): void {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

  axios
    .get(url)
    .then((response) => {
      let address = response.data.display_name;

      // Shorten the address to first three elements
      const shortAddress = address.split(',').slice(0, 3).join(',').trim();

      if (type === 'pickup') {
        booking.vehiclePickupLocation = shortAddress; // Use the shortened address
      } else if (type === 'dropoff') {
        booking.vehicleDropoffLocation = shortAddress; // Use the shortened address
      }
    })
    .catch((error) => {
      console.error('Error with reverse geocoding:', error);
    });
}







}
