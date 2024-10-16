import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service'; // Import the booking service
import { AuthService } from '../services/auth.service';


// Declare Swal globally
declare var Swal: any;
@Component({
  selector: 'app-accommodation-detail',
  templateUrl: './accommodation-detail.component.html',
  styleUrls: ['./accommodation-detail.component.css'],
})
export class AccommodationDetailComponent implements OnInit {
  currentUser: any;

  serviceId: string | null = null;
  accommodationDetail: any = null;
  isModalOpen = false; // State for controlling modal visibility
  bookingDetails = {
    guestName: '',
    accommodationType: 'Hotel',
    numberOfGuests: 1,
    checkInDate: '',
    checkOutDate: '',
    roomNumber: null,
    specialRequest: '',
  };

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private bookingService: BookingService, // Inject the booking service
    private authService: AuthService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    
    this.serviceId = this.route.snapshot.paramMap.get('id');
    if (this.serviceId) {
      this.loadAccommodationDetail(this.serviceId);
    }

        // Dynamically add Tailwind CDN script
        const script = this.renderer.createElement('script');
        script.src = 'https://cdn.tailwindcss.com';
        script.id = 'tailwindScript';
        this.renderer.appendChild(document.body, script);
  }
  
  loadAccommodationDetail(id: string): void {
    this.servicesService.getAccommodationServiceById(id).subscribe(
      (data) => {
        this.accommodationDetail = data;
        
        // Set the accommodationType in bookingDetails based on productSubcategory
        this.bookingDetails.accommodationType = this.accommodationDetail.productSubcategory;
      },
      (error) => {
        console.error('Error fetching accommodation detail', error);
      }
    );
  }
  

  // Open the booking modal
  openModal(): void {
    this.isModalOpen = true;
  }

  // Close the booking modal
  closeModal(): void {
    this.isModalOpen = false;
  }


  
  // Submit the booking form
  
  submitBooking(): void {
    // Check if all required fields are filled
    if (!this.bookingDetails.guestName || !this.bookingDetails.accommodationType || 
        !this.bookingDetails.numberOfGuests || !this.bookingDetails.checkInDate || 
        !this.bookingDetails.checkOutDate || !this.bookingDetails.roomNumber) {
  
      // Display SweetAlert2 error popup if validation fails
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all the required fields.',
        confirmButtonColor: '#3085d6',
      });
      return; // Stop the submission process if validation fails
    }
  
    // Log the booking data before sending it
    console.log(this.bookingDetails);
  
    // Proceed with booking service if validation passes
    this.bookingService.bookAccommodation(this.bookingDetails).subscribe(
      (response) => {
        console.log('Booking successful', response);
  
        // Display success message with SweetAlert2
        Swal.fire({
          icon: 'success',
          title: 'Booking Successful!',
          text: 'Your accommodation has been booked successfully.',
          confirmButtonColor: '#3085d6',
        });
  
        this.closeModal(); // Close the modal after successful booking
      },
      (error) => {
        console.error('Error submitting booking', error);
  
        // Display error message with SweetAlert2 in case of server-side failure
        Swal.fire({
          icon: 'error',
          title: 'Booking Failed',
          text: 'There was an error processing your booking. Please try again.',
          confirmButtonColor: '#d33',
        });
      }
    );
  }
  
  
}
