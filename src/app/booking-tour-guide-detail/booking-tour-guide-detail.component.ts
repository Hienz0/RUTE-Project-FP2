import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef, AfterViewInit, Input} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ItineraryService } from '../services/itinerary.service';


declare var Swal: any;
declare var bootstrap: any;

import * as L from 'leaflet';

@Component({
  selector: 'app-booking-tour-guide-detail',
  templateUrl: './booking-tour-guide-detail.component.html',
  styleUrls: ['./booking-tour-guide-detail.component.css']
})
export class BookingTourGuideDetailComponent implements OnInit, AfterViewInit {
  
  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef;
 // Reference to the map container
  map: any;
  currentUser: any;
  serviceId: string | null = null;
  tourguideDetail: any = null;
  @Input() isModalOpen = false;
  isMapInitialized = false;  // Track whether the map is initialized
  bookingDetails = {
    tourName: '',
    customerName: '',
    tourguideType: 'With Guide',
    numberOfParticipants: 1,
    tourDate: '',
    amount: 0,
    tourTime: '',
    specialRequest: '',
    pickupLocation: ''
  };

  currentDate: string = '';

  isItinerary: boolean = false; // Default is false
  showBackToPlanningButton = false;

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private bookingService: BookingService,
    private authService: AuthService,
    private renderer: Renderer2,
    private router: Router,
    private itineraryService: ItineraryService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.bookingDetails.customerName = this.currentUser.name;
      console.log(this.currentUser);
    });

    this.route.queryParams.subscribe(params => {
      if (params['planning-itinerary']) {
        this.isItinerary = true;
        this.loadItineraryById(this.currentUser.userId);
      } else {
        this.isItinerary = false;
      }
    });

    this.route.queryParams.subscribe(params => {
      this.showBackToPlanningButton = !!params['planning-itinerary'];
    });
    
    const today = new Date();
    this.currentDate = today.toISOString().split('T')[0];

    this.serviceId = this.route.snapshot.paramMap.get('id');
    if (this.serviceId) {
      this.loadTourGuideDetail(this.serviceId);
    }

  }

  ngAfterViewChecked(): void {
    // Map initialization happens only after the container is available and once it has not been initialized before
    if (this.mapContainer && !this.isMapInitialized) {
      this.initMap();
    }
  }

  ngAfterViewInit(): void {
    if (this.mapContainer) {
      this.initMap();
    } else {
      console.error('Map container not initialized');
    }
  }

  initMap(latitude: number = -8.506534, longitude: number = 115.262588): void {
    // Check for the existence of the map container and map instance
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      console.error('Map container element not found');
      return;
    }
  
    // If a map instance already exists, destroy it
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  
    const zoomLevel = 20;
  
    // Initialize the map
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [latitude, longitude],
      zoom: zoomLevel,
      zoomControl: true, // Ensure zoom controls are enabled
    });
  
    // Add a tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
  
    // Create a marker with a custom icon
    const defaultIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  
    // Add the marker to the map
    const marker = L.marker([latitude, longitude], { icon: defaultIcon })
      .addTo(this.map)
      .bindPopup('Pickup Location')
      .openPopup();
  
    // Focus the map on the marker location after rendering
    this.map.once('load', () => {
      this.map.setView([latitude, longitude], zoomLevel); // Ensure focus on the marker
    });
  
    // Trigger map resizing to avoid display issues
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200); // Slight delay ensures proper rendering
  
    // Save the pickup location details
    this.bookingDetails.pickupLocation = `${latitude}, ${longitude}`;
    this.isMapInitialized = true;
  }
  
  
  
  
  

  loadTourGuideDetail(id: string): void {
    this.servicesService.getTourGuideServiceById(id).subscribe(
      (data) => {
        this.tourguideDetail = data;
        this.bookingDetails.tourName = this.tourguideDetail.productName;
        this.bookingDetails.tourguideType = this.tourguideDetail.productSubcategory;
        this.bookingDetails.amount = this.tourguideDetail.productPrice;
        console.log('testing', this.bookingDetails);
        this.initMap(); // Try initializing the map again after loading data
      },
      (error) => {
        console.error('Error fetching tour detail', error);
      }
    );
  }


openModal(): void {
  const modalElement = document.getElementById('bookingModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);

    // Listen for the 'shown.bs.modal' event
    modalElement.addEventListener('shown.bs.modal', () => {
      if (this.mapContainer) {
        this.initMap(); // Initialize the map after modal is fully rendered
      } else {
        console.error('Map container not found');
      }
    });

    modal.show(); // Show the modal
  }
}


  closeModal(): void {
    const modalElement = document.getElementById('bookingModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }
  

  submitBooking(): void {
    const currentDate = new Date();
    const tourDate = new Date(this.bookingDetails.tourDate);
  
    // Log booking details
    console.log('Booking Details:', this.bookingDetails);
  
    // Validate fields
    if (!this.bookingDetails.customerName || 
        !this.bookingDetails.tourguideType || 
        !this.bookingDetails.numberOfParticipants || 
        !this.bookingDetails.tourTime||
        !this.bookingDetails.tourDate) {
  
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all the required fields.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
  
    // Validate tour date
    const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const normalizedTourDate = new Date(tourDate.getFullYear(), tourDate.getMonth(), tourDate.getDate());
  
    if (normalizedTourDate < normalizedCurrentDate) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Date',
        text: 'The tour date cannot be in the past.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

      // Calculate total amount based on participants
  this.bookingDetails.amount = this.bookingDetails.amount * this.bookingDetails.numberOfParticipants;

  
    // Process booking if validation passes
    const bookingData = {
      ...this.bookingDetails,
      serviceId: this.serviceId,          // Include serviceId
      userId: this.currentUser?.userId        // Include userId from the current user
    };

    console.log(bookingData)
  
    this.bookingService.bookTourGuide(bookingData, this.isItinerary).subscribe(
      (response) => {
        console.log('Booking successful', response);
        this.closeModal();
        const bookingId = response.bookingDetails._id;
        const planningItineraryId = this.route.snapshot.queryParamMap.get('planning-itinerary');
        if (planningItineraryId) {
          // Update the itinerary with the bookingId
          const userId = this.currentUser.userId; // Ensure `userId` is available
          this.itineraryService.updateItinerary(bookingId, userId, 'Tour', this.bookingDetails.amount).subscribe(
            () => {
              console.log('Itinerary updated successfully.');
              // Navigate to the /planning-itinerary route
              this.router.navigate([`/planning-itinerary`]);
            },
            (error) => {
              console.error('Failed to update itinerary:', error);
            }
          );
        } else {
          // Default navigation to booking details page
          this.router.navigate([`/bookings/${bookingId}`]);
        }

      },
      (error) => {
        console.error('Error submitting booking', error);
        Swal.fire({
          icon: 'error',
          title: 'Booking Failed',
          text: 'There was an error processing your booking. Please try again.',
          confirmButtonColor: '#d33',
        });
      }
    );
  }  

  navigateToChat(): void {
    if (this.serviceId) {
      this.router.navigate(['/chat'], { queryParams: { providerId: this.serviceId } });
    } else {
      console.error('Service ID is not available.');
    }
  }

  loadItineraryById(userId: string): void {
    this.itineraryService.getItineraryByUserId(userId).subscribe({
      next: (itinerary) => {
        const tourService = itinerary.services.find(
          (service: any) => service.serviceType === 'Tour'
        );
  
        if (tourService) {
          // Set the tour date if the service exists
          this.bookingDetails.tourDate = new Date(tourService.singleDate).toISOString().split('T')[0];  // Date format
  
          // Set the tour time based on the singleTime
          const singleTime = tourService.singleTime;
  
          if (singleTime === '09:00') {
            this.bookingDetails.tourTime = '9:00-11:00';
          } else if (singleTime === '13:00') {
            this.bookingDetails.tourTime = '13:00-15:00';
          } else if (singleTime === '17:00') {
            this.bookingDetails.tourTime = '17:00-19:00';
          } else {
            this.bookingDetails.tourTime = '';  // Clear the tour time if no match
          }
        }
      },
      error: (err) => {
        console.error('Error fetching itinerary by ID:', err);
      }
    });
  }
  

}