import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet';

declare var Swal: any;

@Component({
  selector: 'app-booking-tour-guide-detail',
  templateUrl: './booking-tour-guide-detail.component.html',
  styleUrls: ['./booking-tour-guide-detail.component.css']
})
export class BookingTourGuideDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef; // Reference to the map container
  map: any;
  currentUser: any;
  serviceId: string | null = null;
  tourguideDetail: any = null;
  isModalOpen = false;
  bookingDetails = {
    tourName: '',
    customerName: '',
    tourguideType: 'With Guide',
    numberOfParticipants: 1,
    tourDate: '',
    specialRequest: '',
    pickupLocation: 'Ubud Palaces'
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

    // Date validation
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

  ngAfterViewInit(): void {
    // This is intentionally left empty. The map will be initialized after the detail is loaded.
  }

  initMap(latitude: number, longitude: number): void {
    const zoomLevel = 13; // Adjust the zoom level as needed

    // Create the map instance with dynamic latitude and longitude
    this.map = L.map(this.mapContainer.nativeElement).setView([latitude, longitude], zoomLevel); 

    // Add a tile layer (using OpenStreetMap tiles)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    // Optional: Add a marker at the given location
    const marker = L.marker([latitude, longitude]).addTo(this.map);
    marker.bindPopup('Tour Pickup Location').openPopup();
  }

  loadTourGuideDetail(id: string): void {
    this.servicesService.getTourGuideServiceById(id).subscribe(
      (data) => {
        this.tourguideDetail = data;
        this.bookingDetails.tourName = this.tourguideDetail.productName;
        this.bookingDetails.tourguideType = this.tourguideDetail.productSubcategory;

        // Log the loaded details for debugging
        console.log('Tour Guide Detail:', this.tourguideDetail);

        // Initialize the map only after the detail is loaded
        const latitude = this.tourguideDetail.latitude || -8.409518; // Fallback to default
        const longitude = this.tourguideDetail.longitude || 115.188919; // Fallback to default

        // Check if mapContainer is available before initializing the map
        if (this.mapContainer && this.mapContainer.nativeElement) {
          this.initMap(latitude, longitude); // Initialize the map
        } else {
          console.error('Map container not found');
        }
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

    this.bookingDetails.pickupLocation = 'Ubud Palaces';

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

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove(); // Clean up the map instance to avoid memory leaks
    }
  }
}
