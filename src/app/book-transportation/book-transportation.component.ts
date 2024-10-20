import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransportationService } from '../services/transportation.service';
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet'; // Import Leaflet.js

@Component({
  selector: 'app-book-transportation',
  templateUrl: './book-transportation.component.html',
  styleUrls: ['./book-transportation.component.css'],
})
export class BookTransportationComponent implements OnInit {
  transportationService: any;
  currentUser: any;

  // Booking form fields with default values
  pickupDate: string = '';
  dropoffDate: string = '';
  pickupLocation: string = '';
  dropoffLocation: string = '';
  specialRequest: string = '';

  // Ubud, Bali coordinates
  defaultLat: number = -8.5069;
  defaultLng: number = 115.2625;
  defaultZoom: number = 13;

  constructor(
    private route: ActivatedRoute,
    private service: TransportationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get the logged-in user
    this.currentUser = this.authService.currentUserValue;
    console.log('Logged in user:', this.currentUser);
    
    // Get ID from route parameter
    const transportID = this.route.snapshot.paramMap.get('id');
    console.log('Transport ID from route:', transportID);

    if (transportID) {
      this.service.getTransporationServicesByID(transportID).subscribe(
        (data) => {
          this.transportationService = data;
          console.log(data);

          // Initialize the maps after transportation service is fetched
          setTimeout(() => {
            this.initMap();        // General map initialization
            this.initPickupMap();   // Initialize the pickup map with marker
            this.initDropoffMap();  // Initialize the dropoff map with marker
          }, 0);
        },
        (error) => {
          console.error('Error fetching transportation service:', error);
        }
      );
    } else {
      console.error('Transport ID is null or invalid');
    }

    // Initialize maps
    this.initPickupMap();
    this.initDropoffMap();
  }

  // Function to book transportation
  bookTransport(): void {
    if (!this.currentUser || !this.transportationService) {
      console.error('User or transportation service is not available');
      return;
    }

    const bookingData = {
      serviceId: this.transportationService._id || this.transportationService.id,
      userId: this.currentUser.userId || this.currentUser.userId,
      pickupDate: this.pickupDate,
      dropoffDate: this.dropoffDate,
      specialRequest: this.specialRequest,
      pickupLocation: this.pickupLocation,
      dropoffLocation: this.dropoffLocation,
    };

    this.service.bookTransport(bookingData).subscribe(
      (response) => {
        console.log('Transportation booked successfully:', response);
      },
      (error) => {
        console.error('Error booking transportation:', error);
      }
    );
  }

  // Initialize the general Leaflet map
  initMap(): void {
    const latitude = this.transportationService.latitude || -6.1751; // Default latitude (Jakarta)
    const longitude = this.transportationService.longitude || 106.8650; // Default longitude (Jakarta)
    const zoomLevel = 13; // Example zoom level

    const map = L.map('map').setView([latitude, longitude], zoomLevel); // General map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
  }

  // Initialize the map for Pickup Location
  initPickupMap(): void {
    const map = L.map('pickupMap').setView([this.defaultLat, this.defaultLng], this.defaultZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Custom icon for markers
    const customIcon = L.icon({
      iconUrl: 'assets/location.png', // Correct path for pickup marker
      iconSize: [35, 45], // Adjust size of the marker
      iconAnchor: [17, 45], // Correct anchor point so that it pins correctly
    });

    const marker = L.marker([this.defaultLat, this.defaultLng], { icon: customIcon, draggable: true }).addTo(map);

    // Update the pickup location when the marker is dragged
    marker.on('dragend', (e: any) => {
      const latLng = e.target.getLatLng();
      this.pickupLocation = `${latLng.lat}, ${latLng.lng}`;
    });

    // Capture click event and update the marker position
    map.on('click', (e: any) => {
      const latLng = e.latlng;
      marker.setLatLng(latLng);
      this.pickupLocation = `${latLng.lat}, ${latLng.lng}`;
    });
  }

  // Initialize the map for Dropoff Location
  initDropoffMap(): void {
    const map = L.map('dropoffMap').setView([this.defaultLat, this.defaultLng], this.defaultZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Custom icon for markers
    const customIcon = L.icon({
      iconUrl: 'assets/location.png', // Correct path for dropoff marker
      iconSize: [35, 45], // Adjust size of the marker
      iconAnchor: [17, 45], // Correct anchor point so that it pins correctly
    });

    const marker = L.marker([this.defaultLat, this.defaultLng], { icon: customIcon, draggable: true }).addTo(map);

    // Update the dropoff location when the marker is dragged
    marker.on('dragend', (e: any) => {
      const latLng = e.target.getLatLng();
      this.dropoffLocation = `${latLng.lat}, ${latLng.lng}`;
    });

    // Capture click event and update the marker position
    map.on('click', (e: any) => {
      const latLng = e.latlng;
      marker.setLatLng(latLng);
      this.dropoffLocation = `${latLng.lat}, ${latLng.lng}`;
    });
  }

  getFullImagePath(image: string): string {
    return `http://localhost:3000/${image}`;
  }
}
