import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef, AfterViewInit, Input} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';

declare var Swal: any;
import * as L from 'leaflet';

@Component({
  selector: 'app-booking-tour-guide-detail',
  templateUrl: './booking-tour-guide-detail.component.html',
  styleUrls: ['./booking-tour-guide-detail.component.css']
})
export class BookingTourGuideDetailComponent implements OnInit {
  
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef; // Reference to the map container
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
    specialRequest: '',
    pickupLocation: ''
  };

  currentDate: string = '';

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private bookingService: BookingService,
    private authService: AuthService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    const today = new Date();
    this.currentDate = today.toISOString().split('T')[0];

    this.serviceId = this.route.snapshot.paramMap.get('id');
    if (this.serviceId) {
      this.loadTourGuideDetail(this.serviceId);
    }

    // Adding Tailwind CDN dynamically
    const script = this.renderer.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.id = 'tailwindScript';
    this.renderer.appendChild(document.body, script);
  }

  ngAfterViewChecked(): void {
    // Map initialization happens only after the container is available and once it has not been initialized before
    if (this.mapContainer && !this.isMapInitialized) {
      this.initMap();
    }
  }

  initMap(latitude: number = -8.506534, longitude: number = 115.262588): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      return;
    }
  
    const zoomLevel = 15;
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [latitude, longitude], 
      zoom: zoomLevel,
    });
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);
  
    const defaultIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
    });
    L.marker([latitude, longitude], { icon: defaultIcon }).addTo(this.map).bindPopup('Pickup Location').openPopup();
  
    // Force the map to recenter after rendering is complete
    setTimeout(() => {
      this.map.invalidateSize();
      this.map.setView([latitude, longitude], zoomLevel);
    }, 100);
  
    this.bookingDetails.pickupLocation = `${latitude}, ${longitude}`;
    this.isMapInitialized = true;
  }
  
  
  
  

  loadTourGuideDetail(id: string): void {
    this.servicesService.getTourGuideServiceById(id).subscribe(
      (data) => {
        this.tourguideDetail = data;
        this.bookingDetails.tourName = this.tourguideDetail.productName;
        this.bookingDetails.tourguideType = this.tourguideDetail.productSubcategory;
        this.initMap(); // Try initializing the map again after loading data
      },
      (error) => {
        console.error('Error fetching tour detail', error);
      }
    );
  }


  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
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

    

    // Process booking if validation passes
    this.bookingService.bookTourGuide(this.bookingDetails).subscribe(
      (response) => {
        console.log('Booking successful', response);
        Swal.fire({
          icon: 'success',
          title: 'Booking Successful!',
          text: 'Your tour or guide has been booked successfully.',
          confirmButtonColor: '#3085d6',
        });
        this.closeModal();
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
}
