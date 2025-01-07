import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransportationService } from '../services/transportation.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import * as L from 'leaflet'; // Import Leaflet.js
import axios from 'axios'; // Import axios for reverse geocoding
import 'leaflet-search'; // Import Leaflet Search
import flatpickr from 'flatpickr';
import Swal from 'sweetalert2';
import { ItineraryService } from '../services/itinerary.service';

@Component({
  selector: 'app-book-transportation',
  templateUrl: './book-transportation.component.html',
  styleUrls: ['./book-transportation.component.css'],
})
export class BookTransportationComponent implements OnInit {
  transportationService: any;
  currentUser: any;
  serviceId: string | null = null;


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

  disabledDates: string[] = []; // Store booked dates as flat strings (YYYY-MM-DD)

  selectedVehicleTypes: any[] = [];
  vehicleQuantities: { [key: string]: number } = {};
  totalBookingPrice: number = 0;
  numDays: number = 1;
  // Inisialisasi individualPrices sebagai objek kosong
  individualPrices: { [key: string]: number } = {};
  quantityWarnings: { [key: string]: string } = {};
  individualPricesPerDay: { [key: string]: number } = {};

  vehicleBooking: Array<{
    name: string;
    quantity: number;
    pricePerVehicle: number;
    totalPrice: number;
    selectedVehicleType: string;
  }> = [];

  transportID: string = '';
  remainingQuantity: { [key: string]: number } = {}; // Inisialisasi sebagai objek kosong
  isModalOpen = false;
  ubudCircle: any;

  isItinerary: boolean = false; // Default is false
  showBackToPlanningButton = false;

  constructor(
    private route: ActivatedRoute,
    private service: TransportationService,
    private authService: AuthService,
    private router: Router,
    private itineraryService: ItineraryService
  ) {}

  ngOnInit(): void {
    // Get the logged-in user
    this.currentUser = this.authService.currentUserValue;
    console.log('Logged in user:', this.currentUser);

    this.serviceId = this.route.snapshot.paramMap.get('id');

    this.route.queryParams.subscribe(params => {
      if (params['planning-itinerary']) {
        this.isItinerary = true;
        this.loadItineraryById(this.currentUser.userId);
      } else {
        this.isItinerary = false;
      }
    });

    // Get ID from route parameter
    this.transportID = this.route.snapshot.paramMap.get('id')!;
    console.log('Transport ID from route:', this.transportID);

    if (this.transportID) {
      this.service.getTransporationDetailsByID(this.transportID).subscribe(
        (data) => {
          this.transportationService = data;
          console.log('data', data);

          // Initialize the maps after transportation service is fetched
          setTimeout(() => {
            this.initMap(); // General map initialization
            this.initPickupMap(); // Initialize the pickup map with marker
            this.initDropoffMap(); // Initialize the dropoff map with marker
          }, 0);

          // Fetch booked dates specific to this transportation service
          this.fetchBookedDates(this.transportID);
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
    this.route.queryParams.subscribe(params => {
      this.showBackToPlanningButton = !!params['planning-itinerary'];
    });
  }

  fetchBookedDates(transportID: string): void {
    this.service.getBookedDates(transportID).subscribe(
      (response: any) => {
        if (
          response &&
          response.success &&
          Array.isArray(response.disabledDates)
        ) {
          // Set the disabled dates directly from response
          this.disabledDates = response.disabledDates;
        } else {
          console.warn('Unexpected response format:', response);
          this.disabledDates = [];
        }
        // Call initDatePickers after fetching the disabled dates
        this.initDatePickers();
      },
      (error) => {
        console.error('Error fetching disabled dates:', error);
        this.disabledDates = []; // Set to empty array in case of an error
        this.initDatePickers();
      }
    );
  }

  flattenBookedDates(
    data: { pickupDate: string; dropoffDate: string }[]
  ): string[] {
    const dates: string[] = [];
    data.forEach((booking) => {
      const start = new Date(booking.pickupDate);
      const end = new Date(booking.dropoffDate);
      let currentDate = new Date(start);

      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    return dates;
  }

  initDatePickers(): void {
    const disabledDates = this.disabledDates;
    console.log('Disabled Dates:', disabledDates); // Debug log

    // Initialize Flatpickr for the pickup date
    flatpickr('#pickupDate', {
      disable: disabledDates,
      dateFormat: 'Y-m-d',
      minDate: 'today',
      onChange: (selectedDates, dateStr) => {
        this.pickupDate = dateStr; // Store the selected pickup date
        if (
          this.isDateRangeInvalid(
            this.pickupDate,
            this.dropoffDate,
            disabledDates
          )
        ) {
          alert(
            'Selected range includes one or more booked dates. Please choose different dates.'
          );
        }
      },
    });

    // Initialize Flatpickr for the dropoff date
    flatpickr('#dropoffDate', {
      disable: disabledDates,
      dateFormat: 'Y-m-d',
      minDate: 'today',
      onChange: (selectedDates, dateStr) => {
        this.dropoffDate = dateStr; // Store the selected dropoff date
        if (
          this.isDateRangeInvalid(
            this.pickupDate,
            this.dropoffDate,
            disabledDates
          )
        ) {
          alert(
            'Selected range includes one or more booked dates. Please choose different dates.'
          );
        }
      },
    });
  }

  isDateRangeInvalid(
    pickupDate: string,
    dropoffDate: string,
    disabledDates: string[]
  ): boolean {
    if (!pickupDate || !dropoffDate) return false;

    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);

    // Loop through the disabledDates and check if any fall within the selected range
    return disabledDates.some((disabledDate) => {
      const booked = new Date(disabledDate);
      return booked >= pickup && booked <= dropoff;
    });
  }

  // Method to open pickup calendar manually
  openPickupCalendar() {
    const input = document.getElementById('pickupDate') as HTMLInputElement;
    input.focus(); // Trigger the calendar to open when the icon is clicked
  }

  // Method to open dropoff calendar manually
  openDropoffCalendar() {
    const input = document.getElementById('dropoffDate') as HTMLInputElement;
    input.focus(); // Trigger the calendar to open when the icon is clicked
  }

  onVehicleTypeChange(event: any, subcategory: any) {
    if (event.target.checked) {
      this.selectedVehicleTypes.push(subcategory);
      this.vehicleQuantities[subcategory.name] = 1; // Default quantity

      // Add to vehicleBooking
      this.vehicleBooking.push({
        name: subcategory.name,
        quantity: 1,
        pricePerVehicle: subcategory.price,
        totalPrice: subcategory.price * (this.numDays || 1),
        selectedVehicleType: subcategory.type,
      });
    } else {
      this.selectedVehicleTypes = this.selectedVehicleTypes.filter(
        (type) => type.name !== subcategory.name
      );
      delete this.vehicleQuantities[subcategory.name];
      delete this.individualPrices[subcategory.name];

      // Remove from vehicleBooking
      this.vehicleBooking = this.vehicleBooking.filter(
        (vehicle) => vehicle.name !== subcategory.name
      );
    }
    this.calculateTotalPrice();
  }

  calculateTotalPrice() {
    const pickup = new Date(this.pickupDate);
    const dropoff = new Date(this.dropoffDate);

    // Calculate the number of days between pickupDate and dropoffDate
    const days = Math.floor(
      (dropoff.getTime() - pickup.getTime()) / (1000 * 3600 * 24)
    );
    const numDays = days > 0 ? days : 1;

    // Calculate total price including quantity, price per day, and number of days
    this.totalBookingPrice = this.selectedVehicleTypes.reduce(
      (total, subcategory) => {
        const quantity = this.vehicleQuantities[subcategory.name] || 0;
        const pricePerDay = subcategory.price;
        const totalDatPrice = pricePerDay * numDays;
        const totalPrice = pricePerDay * numDays * quantity;

        this.individualPricesPerDay[subcategory.name] = totalDatPrice;
        this.individualPrices[subcategory.name] = totalPrice;

        // Update vehicleBooking
        const vehicle = this.vehicleBooking.find(
          (v) => v.name === subcategory.name
        );
        if (vehicle) {
          vehicle.quantity = quantity;
          vehicle.pricePerVehicle = totalDatPrice;
          vehicle.totalPrice = totalPrice;
        }

        return total + totalPrice;
      },
      0
    );
  }

  onQuantityInput(subcategory: any) {
    const maxQuantity =
      this.remainingQuantity[subcategory._id] || subcategory.quantity; // Default to subcategory quantity if remainingQuantity is not available
    let currentQuantity = this.vehicleQuantities[subcategory.name];

    if (currentQuantity > maxQuantity) {
      // Set the current quantity to the maximum allowed quantity
      this.vehicleQuantities[subcategory.name] = maxQuantity;

      // Display a warning message
      this.quantityWarnings[
        subcategory._id
      ] = `Stok tidak tersedia sebanyak itu. Maksimal: ${maxQuantity}`;
    } else {
      // Remove the warning if the quantity is within the allowed limit
      delete this.quantityWarnings[subcategory._id];
    }

    this.calculateTotalPrice();
  }

  // Fungsi untuk menghitung ulang harga dan validasi tanggal
  onDateChange() {
    if (this.pickupDate && this.dropoffDate) {
      const pickup = new Date(this.pickupDate);
      const dropoff = new Date(this.dropoffDate);

      if (dropoff <= pickup) {
        alert('Tanggal Dropoff harus lebih besar dari Tanggal Pickup.');
        this.dropoffDate = '';
        return;
      }

      this.service
        .getRemainingQuantity(
          this.transportID,
          this.pickupDate,
          this.dropoffDate
        )
        .subscribe(
          (data) => {
            this.remainingQuantity = data.availableQuantities || {}; // Memastikan data ada atau kosong
            console.log(this.remainingQuantity);
          },
          (error) => {
            console.error('Gagal mendapatkan sisa kuantitas:', error);
          }
        );
    }

    this.calculateTotalPrice();
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
      this.showAlert('warning', 'Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    const bookingData = {
      serviceId: this.transportationService.serviceId,
      userId: this.currentUser.userId || this.currentUser.userId,
      pickupDate: this.pickupDate,
      dropoffDate: this.dropoffDate,
      specialRequest: this.specialRequest,
      pickupLocation: this.pickupLocation,
      dropoffLocation: this.dropoffLocation,
      vehicleBooking: this.vehicleBooking, // Add vehicle details
      totalBookingPrice: this.totalBookingPrice, // Add total price
      pickupStreetName: this.pickupStreetName,
      dropoffStreetName: this.dropoffStreetName
    };

    console.log(bookingData);
    Swal.fire({
      title: 'Confirm Booking',
      text: 'Are you sure you want to submit this booking?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, book it',
      cancelButtonText: 'No, cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        // If user confirms, proceed with booking
        this.service.bookTransport(bookingData, this.isItinerary).subscribe(
          (response) => {
            console.log('Transportation booked successfully:', response);
            const bookingId = response.bookingDetails._id;
            console.log(bookingId);

            const planningItineraryId = this.route.snapshot.queryParamMap.get('planning-itinerary');
            if (planningItineraryId) {
              // Update the itinerary with the bookingId
              const userId = this.currentUser.userId; // Ensure `userId` is available
              this.itineraryService.updateItinerary(bookingId, userId, 'Vehicle', bookingData.totalBookingPrice).subscribe(
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
            // Show error message
            Swal.fire(
              'Booking Failed',
              'An error occurred while booking the transportation service. Please try again.',
              'error'
            );
            console.error('Error booking transportation:', error);
          }
        );
      } else {
        // Handle if user cancels
        console.log('Booking submission canceled by user.');
      }
    });
    
  }

  getUniqueSubcategories(service: any): string {
    if (!service?.productSubcategory) return '';

    return Array.from(
      new Set(service.productSubcategory.map((sub: any) => sub.type))
    ).join(', ');
  }

  // Initialize the general Leaflet map with a marker and location details
  initMap(): void {
    // Parse the location string from transportationService (e.g., "-8.527369055545698, 115.2438408136368")
    const location = this.transportationService.location.split(',').map(Number);
    const latitude = location[0] || -6.1751; // Default latitude (Jakarta)
    const longitude = location[1] || 106.865; // Default longitude (Jakarta)
    const zoomLevel = 16; // Example zoom level

    // Initialize the map with scrollWheelZoom disabled
    const map = L.map('map', { scrollWheelZoom: false }).setView(
      [latitude, longitude],
      zoomLevel
    );

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

  openModal() {
    this.isModalOpen = true;
    setTimeout(() => {
      if (this.isItinerary){
        this.service
        .getRemainingQuantity(
          this.transportID,
          this.pickupDate,
          this.dropoffDate
        )
        .subscribe(
          (data) => {
            this.remainingQuantity = data.availableQuantities || {}; // Memastikan data ada atau kosong
            console.log(this.remainingQuantity);
          },
          (error) => {
            console.error('Gagal mendapatkan sisa kuantitas:', error);
          }
        );
    }
      
      this.initPickupMap(); // Initialize the map after the modal opens
      this.pickupMap?.invalidateSize(); // Adjust layout to fit modal
      this.initDropoffMap(); // Initialize the map after the modal opens
      this.dropoffMap?.invalidateSize();
      this.centerMap(); // Center the map view on the marker
    }, 100); // Delay allows modal rendering before map adjustments
  }

  closeModal(): void {
    this.isModalOpen = false; // Hide modal
  }

  // Center map function for consistency
  centerMap(): void {
    if (this.pickupMap) {
      this.pickupMap.fitBounds(this.ubudCircle.getBounds());
    }
    if (this.dropoffMap) {
      this.dropoffMap.fitBounds(this.ubudCircle.getBounds());
    }
  }
  // Initialize Pickup Map with bounds limitation and search functionality
  initPickupMap(): void {
    if (this.pickupMap) {
      return; // Avoid re-initializing the map
    }

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
    this.ubudCircle = L.circle(ubudCenter, {
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
    this.pickupMap.fitBounds(this.ubudCircle.getBounds());

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
    if (this.dropoffMap) {
      return; // If it's already initialized, do nothing
    }

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
    this.ubudCircle = L.circle(ubudCenter, {
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
    this.dropoffMap.fitBounds(this.ubudCircle.getBounds());

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

  pickupStreetName: string = '';
  dropoffStreetName: string = '';

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
          this.pickupStreetName = address; // Set pickup street name
        } else if (type === 'dropoff') {
          this.dropoffAddress = address; // Set dropoff address
          this.dropoffStreetName = address; // Set dropoff street name
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

  showAlert(
    icon: 'success' | 'error' | 'warning' | 'info',
    title: string,
    text: string,
    redirectTo?: string // optional redirect path
  ): void {
    Swal.fire({
      icon: icon,
      title: title,
      text: text,
      confirmButtonText: 'OK'
    }).then((result) => {
      if (result.isConfirmed && redirectTo) {
        this.router.navigate([redirectTo]);
      }
    });
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
      next: (itinerary: any) => {
        const vehicleService = itinerary.services.find(
          (service: any) => service.serviceType === 'Vehicle'
        );

        if (vehicleService) {
          this.pickupDate = new Date(vehicleService.startDate).toISOString().split('T')[0]; // Date format
          this.dropoffDate = new Date(vehicleService.endDate).toISOString().split('T')[0];  // Date format
        }
      },
      error: (err) => {
        console.error('Error fetching itinerary by ID:', err);
      }
    });
  }
  
}