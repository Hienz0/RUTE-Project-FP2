import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransportationService } from '../services/transportation.service';
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet'; // Import Leaflet.js
import axios from 'axios';  // Import axios for reverse geocoding

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

   // Reverse geocoded addresses
   pickupAddress: string = '';
   dropoffAddress: string = '';
 

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

   // Initialize Pickup Map
   initPickupMap(): void {
    const map = L.map('pickupMap').setView([this.defaultLat, this.defaultLng], this.defaultZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const customIcon = L.icon({
      iconUrl: 'assets/location.png',
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    const marker = L.marker([this.defaultLat, this.defaultLng], { icon: customIcon, draggable: true }).addTo(map);

    marker.on('dragend', (e: any) => {
      const latLng = e.target.getLatLng();
      this.pickupLocation = `${latLng.lat}, ${latLng.lng}`;
      this.reverseGeocode(latLng.lat, latLng.lng, 'pickup');  // Call reverse geocoding
    });

    map.on('click', (e: any) => {
      const latLng = e.latlng;
      marker.setLatLng(latLng);
      this.pickupLocation = `${latLng.lat}, ${latLng.lng}`;
      this.reverseGeocode(latLng.lat, latLng.lng, 'pickup');  // Call reverse geocoding
    });
  }

  // Initialize Dropoff Map
  initDropoffMap(): void {
    const map = L.map('dropoffMap').setView([this.defaultLat, this.defaultLng], this.defaultZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const customIcon = L.icon({
      iconUrl: 'assets/location.png',
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    const marker = L.marker([this.defaultLat, this.defaultLng], { icon: customIcon, draggable: true }).addTo(map);

    marker.on('dragend', (e: any) => {
      const latLng = e.target.getLatLng();
      this.dropoffLocation = `${latLng.lat}, ${latLng.lng}`;
      this.reverseGeocode(latLng.lat, latLng.lng, 'dropoff');  // Call reverse geocoding
    });

    map.on('click', (e: any) => {
      const latLng = e.latlng;
      marker.setLatLng(latLng);
      this.dropoffLocation = `${latLng.lat}, ${latLng.lng}`;
      this.reverseGeocode(latLng.lat, latLng.lng, 'dropoff');  // Call reverse geocoding
    });
  }

  // Reverse Geocoding to get the address from lat/lng
  reverseGeocode(lat: number, lng: number, type: 'pickup' | 'dropoff'): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    
    axios.get(url).then((response) => {
      const address = response.data.display_name;
      if (type === 'pickup') {
        this.pickupAddress = address;  // Set pickup address
      } else {
        this.dropoffAddress = address;  // Set dropoff address
      }
    }).catch((error) => {
      console.error('Error during reverse geocoding:', error);
    });
  }

  getFullImagePath(image: string): string {
    return `http://localhost:3000/${image}`;
  }
}
