import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransportationService } from '../services/transportation.service';
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet'; // Import Leaflet.js
import axios from 'axios'; // Import axios for reverse geocoding
import 'leaflet-search'; // Import Leaflet Search

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

  pickupMarker: any; // Declare pickup marker globally
  dropoffMarker: any; // Declare dropoff marker globally

  pickupMap: any; // Declare pickup map globally
  dropoffMap: any; // Declare dropoff map globally

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
            this.initMap(); // General map initialization
            this.initPickupMap(); // Initialize the pickup map with marker
            this.initDropoffMap(); // Initialize the dropoff map with marker
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

    // Validasi untuk memastikan semua kolom diisi
    if (
      !this.pickupDate ||
      !this.dropoffDate ||
      !this.pickupLocation ||
      !this.dropoffLocation
    ) {
      console.error('All fields are required');
      alert('Please fill in all required fields.');
      return;
    }

    const bookingData = {
      serviceId:
        this.transportationService._id || this.transportationService.id,
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

  // Initialize the general Leaflet map with a marker and location details
  initMap(): void {
    // Parse the location string from transportationService (e.g., "-8.527369055545698, 115.2438408136368")
    const location = this.transportationService.location.split(',').map(Number);
    const latitude = location[0] || -6.1751; // Default latitude (Jakarta)
    const longitude = location[1] || 106.865; // Default longitude (Jakarta)
    const zoomLevel = 15; // Example zoom level

    const map = L.map('map').setView([latitude, longitude], zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const customIcon = L.icon({
      iconUrl: 'assets/location.png',
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    // Add marker at the transportation service location
    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(
      map
    );

    // Use the existing reverseGeocode function to get the address and display it
    this.reverseGeocode(latitude, longitude, 'location'); // Assuming it's similar to the pickup, adjust if needed
  }

  // Initialize Pickup Map with bounds limitation and search functionality
  initPickupMap(): void {
    this.pickupMap = L.map('pickupMap').setView(
      [this.defaultLat, this.defaultLng],
      this.defaultZoom
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.pickupMap);

    const customIcon = L.icon({
      iconUrl: 'assets/location.png',
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    const ubudCenter = L.latLng(this.defaultLat, this.defaultLng);
    const ubudCircle = L.circle(ubudCenter, {
      color: 'blue',
      fillColor: '#add8e6',
      fillOpacity: 0.2,
      radius: 7000, // 7 km radius
    }).addTo(this.pickupMap);

    this.pickupMarker = L.marker([this.defaultLat, this.defaultLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(this.pickupMap);

    // Adjust map view to fit the circle bounds
    this.pickupMap.fitBounds(ubudCircle.getBounds());

    // Add search control to map
    const searchControl = new (L.Control as any).Search({
      url: 'https://nominatim.openstreetmap.org/search?format=json&q={s}',
      jsonpParam: 'json_callback',
      propertyName: 'display_name',
      propertyLoc: ['lat', 'lon'],
      autoCollapse: true,
      marker: false,
      moveToLocation: (latlng: L.LatLng) => {
        const distanceFromCenter = this.pickupMap.distance(latlng, ubudCenter); // Check distance from Ubud center

        // Ensure the searched location is within 7 km radius
        if (distanceFromCenter <= 7000) {
          this.pickupMarker.setLatLng(latlng); // Set marker to new location
          this.pickupMap.setView(latlng, 15); // Zoom to new location
          this.pickupLocation = `${latlng.lat}, ${latlng.lng}`;
          this.reverseGeocode(latlng.lat, latlng.lng, 'pickup'); // Reverse geocode for address
        } else {
          // Notify the user that the location is outside Ubud area
          window.alert('You can only select a point within the Ubud area.');
        }
      },
    }).addTo(this.pickupMap);

    // Marker drag and drop
    this.pickupMarker.on('dragend', (e: any) => {
      const latLng = e.target.getLatLng();
      const distanceFromCenter = this.pickupMap.distance(latLng, ubudCenter);

      if (distanceFromCenter <= 7000) {
        this.pickupLocation = `${latLng.lat}, ${latLng.lng}`;
        this.reverseGeocode(latLng.lat, latLng.lng, 'pickup');
      } else {
        window.alert('You can only select a point within the Ubud area.');
      }
    });

    // Map click event to place marker within the bounds
    this.pickupMap.on('click', (e: any) => {
      const latLng = e.latlng;
      const distanceFromCenter = this.pickupMap.distance(latLng, ubudCenter);

      if (distanceFromCenter <= 7000) {
        this.pickupMarker.setLatLng(latLng);
        this.pickupLocation = `${latLng.lat}, ${latLng.lng}`;
        this.reverseGeocode(latLng.lat, latLng.lng, 'pickup');
        this.pickupMap.setView([latLng.lat, latLng.lng], 15); // Adjust zoom level if necessary
      } else {
        window.alert('You can only select a point within the Ubud area.');
      }
    });
  }

  // Initialize Dropoff Map with bounds limitation and search functionality
  initDropoffMap(): void {
    this.dropoffMap = L.map('dropoffMap').setView(
      [this.defaultLat, this.defaultLng],
      this.defaultZoom
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.dropoffMap);

    const customIcon = L.icon({
      iconUrl: 'assets/location.png',
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    const ubudCenter = L.latLng(this.defaultLat, this.defaultLng);
    const ubudCircle = L.circle(ubudCenter, {
      color: 'blue',
      fillColor: '#add8e6',
      fillOpacity: 0.2,
      radius: 7000, // 7 km radius
    }).addTo(this.dropoffMap);

    this.dropoffMarker = L.marker([this.defaultLat, this.defaultLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(this.dropoffMap);

    // Adjust map view to fit the circle bounds
    this.dropoffMap.fitBounds(ubudCircle.getBounds());

    // Add search control to map
    const searchControl = new (L.Control as any).Search({
      url: 'https://nominatim.openstreetmap.org/search?format=json&q={s}',
      jsonpParam: 'json_callback',
      propertyName: 'display_name',
      propertyLoc: ['lat', 'lon'],
      autoCollapse: true,
      marker: false,
      moveToLocation: (latlng: L.LatLng) => {
        const distanceFromCenter = this.dropoffMap.distance(latlng, ubudCenter); // Check distance from Ubud center

        // Ensure the searched location is within 7 km radius
        if (distanceFromCenter <= 7000) {
          this.dropoffMarker.setLatLng(latlng); // Set marker to new location
          this.dropoffMap.setView(latlng, 15); // Zoom to new location
          this.dropoffLocation = `${latlng.lat}, ${latlng.lng}`;
          this.reverseGeocode(latlng.lat, latlng.lng, 'dropoff'); // Reverse geocode for address
        } else {
          // Notify the user that the location is outside Ubud area
          window.alert('You can only select a point within the Ubud area.');
        }
      },
    }).addTo(this.dropoffMap);

    // Marker drag and drop
    this.dropoffMarker.on('dragend', (e: any) => {
      const latLng = e.target.getLatLng();
      const distanceFromCenter = this.dropoffMap.distance(latLng, ubudCenter);

      if (distanceFromCenter <= 7000) {
        this.dropoffLocation = `${latLng.lat}, ${latLng.lng}`;
        this.reverseGeocode(latLng.lat, latLng.lng, 'dropoff');
      } else {
        window.alert('You can only select a point within the Ubud area.');
      }
    });

    // Map click event to place marker within the bounds
    this.dropoffMap.on('click', (e: any) => {
      const latLng = e.latlng;
      const distanceFromCenter = this.dropoffMap.distance(latLng, ubudCenter);

      if (distanceFromCenter <= 7000) {
        this.dropoffMarker.setLatLng(latLng);
        this.dropoffLocation = `${latLng.lat}, ${latLng.lng}`;
        this.reverseGeocode(latLng.lat, latLng.lng, 'dropoff');
        this.dropoffMap.setView([latLng.lat, latLng.lng], 15); // Adjust zoom level if necessary
      } else {
        window.alert('You can only select a point within the Ubud area.');
      }
    });
  }

  useServiceLocation(type: 'pickup' | 'dropoff'): void {
    const location = this.transportationService.location.split(',').map(Number);
    const latitude = location[0];
    const longitude = location[1];

    if (type === 'pickup') {
      const usePickupServiceLocation = (
        document.getElementById('usePickupServiceLocation') as HTMLInputElement
      ).checked;
      if (usePickupServiceLocation) {
        // Set the pickup location from the service
        this.pickupLocation = `${latitude}, ${longitude}`;
        this.reverseGeocode(latitude, longitude, 'pickup');

        // Move the pickup marker to the service location
        if (this.pickupMarker) {
          this.pickupMarker.setLatLng([latitude, longitude]);

          // Move the map to center on the new marker location
          this.pickupMap.setView([latitude, longitude], 15); // Adjust zoom level if necessary
        }
      }
    } else if (type === 'dropoff') {
      const useDropoffServiceLocation = (
        document.getElementById('useDropoffServiceLocation') as HTMLInputElement
      ).checked;
      if (useDropoffServiceLocation) {
        // Set the dropoff location from the service
        this.dropoffLocation = `${latitude}, ${longitude}`;
        this.reverseGeocode(latitude, longitude, 'dropoff');

        // Move the dropoff marker to the service location
        if (this.dropoffMarker) {
          this.dropoffMarker.setLatLng([latitude, longitude]);

          // Move the map to center on the new marker location
          this.dropoffMap.setView([latitude, longitude], 15); // Adjust zoom level if necessary
        }
      }
    }
  }

  // Helper function to update the map location
  updateMapLocation(mapId: string, latitude: number, longitude: number): void {
    const map = L.map(mapId);
    const customIcon = L.icon({
      iconUrl: 'assets/location.png',
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    map.setView([latitude, longitude], 15); // Set map to new coordinates
    L.marker([latitude, longitude], { icon: customIcon }).addTo(map); // Add marker
  }

  // Reverse Geocoding to get the address from lat/lng
  reverseGeocode(
    lat: number,
    lng: number,
    type: 'pickup' | 'dropoff' | 'location'
  ): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    axios
      .get(url)
      .then((response) => {
        const address = response.data.display_name;

        if (type === 'pickup') {
          this.pickupAddress = address; // Set pickup address
        } else if (type === 'dropoff') {
          this.dropoffAddress = address; // Set dropoff address
        } else if (type === 'location') {
          // Update the UI for the location address
          document.getElementById('location-address')!.textContent = address;
        }
      })
      .catch((error) => {
        console.error('Error with reverse geocoding:', error);
      });
  }

  getFullImagePath(image: string): string {
    return `http://localhost:3000/${image}`;
  }
}
