import { Component, OnInit, OnDestroy, Renderer2, AfterViewInit, ViewChild, ElementRef  } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service'; // Import the booking service
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet';



// Declare Swal globally
declare var Swal: any;
@Component({
  selector: 'app-accommodation-detail',
  templateUrl: './accommodation-detail.component.html',
  styleUrls: ['./accommodation-detail.component.css'],
})
export class AccommodationDetailComponent implements OnInit, AfterViewInit {
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

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map: L.Map | undefined;

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
      this.bookingDetails.guestName = user?.name || '';
    });
    
    this.serviceId = this.route.snapshot.paramMap.get('id');
    if (this.serviceId) {
      this.loadAccommodationDetail(this.serviceId);
    }

        // // Dynamically add Tailwind CDN script
        // const script = this.renderer.createElement('script');
        // script.src = 'https://cdn.tailwindcss.com';
        // script.id = 'tailwindScript';
        // this.renderer.appendChild(document.body, script);
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit called');
    if (this.mapContainer) {
      console.log('Map container available');
      this.initMap();
    } else {
      console.error('Map container not available');
    }
  }
  
  loadAccommodationDetail(id: string): void {
    this.servicesService.getAccommodationServiceById(id).subscribe(
      (data) => {
        this.accommodationDetail = data;
        
        // Set the accommodationType in bookingDetails based on productSubcategory
        this.bookingDetails.accommodationType = this.accommodationDetail.productSubcategory;
        if (this.map && this.accommodationDetail.businessCoordinates) {
          // Update map center with restaurant coordinates
          const { coordinates } = this.accommodationDetail.businessCoordinates;
          this.map.setView([coordinates[1], coordinates[0]], 16); // Center on restaurant with zoom level 16
          L.marker([coordinates[1], coordinates[0]]).addTo(this.map); // Add a marker to the restaurant location
        }
      },
      (error) => {
        console.error('Error fetching accommodation detail', error);
      }
    );
  }

  initMap(): void {
    console.log('map called');
    // Initialize the map with placeholder coordinates
    this.map = L.map(this.mapContainer.nativeElement).setView([-8.5069, 115.2624], 13); // Placeholder or default location
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    
    // Ensure the map resizes correctly after initialization
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
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
      // Get today's date in 'yyyy-mm-dd' format to compare
  const today = new Date().toISOString().split('T')[0];

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

      // Check if check-in date is in the past
  if (this.bookingDetails.checkInDate < today) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Check-in Date',
      text: 'Check-in date cannot be in the past.',
      confirmButtonColor: '#d33',
    });
    return; // Stop submission if check-in date is invalid
  }

    // Check if check-out date is earlier than check-in date
    if (this.bookingDetails.checkOutDate < this.bookingDetails.checkInDate) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Check-out Date',
        text: 'Check-out date cannot be earlier than the check-in date.',
        confirmButtonColor: '#d33',
      });
      return;
    }

    const bookingData = {
      ...this.bookingDetails,
      serviceId: this.serviceId,
      userId: this.currentUser?.userId // Assuming the user object has an 'id' property
    };
  
    // Log the booking data before sending it
    console.log(this.bookingDetails);
  
    // Proceed with booking service if validation passes
    this.bookingService.bookAccommodation(bookingData).subscribe(
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
