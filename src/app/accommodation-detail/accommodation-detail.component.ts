import { Component, OnInit, OnDestroy, Renderer2, AfterViewInit, ViewChild, ElementRef  } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service'; // Import the booking service
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ChangeDetectorRef } from '@angular/core';

import * as L from 'leaflet';
import { concat } from 'rxjs';




// Declare Swal globally
declare var Swal: any;
declare var bootstrap: any;
@Component({
  selector: 'app-accommodation-detail',
  templateUrl: './accommodation-detail.component.html',
  styleUrls: ['./accommodation-detail.component.css'],
})
export class AccommodationDetailComponent implements OnInit, AfterViewInit {
  currentUser: any;
  minDate = new Date();
  maxDate: string = '';
  
  serviceId: string | null = null;
  accommodationDetail: any = null;
  accommodationData: any = null;
  isModalOpen = false; // State for controlling modal visibility
  bookingDetails = {
    guestName: '',
    accommodationType: 'Hotel',
    numberOfGuests: 1,
    checkInDate: '',
    checkOutDate: '',
    roomTypeId: '',
    roomId: '',
    accommodationId: '',
    specialRequest: '',
    amount: 0 // Add amount property here
  };
  selectedImage: string | null = null;
  isImagePreviewOpen: boolean = false;
  bookingModal: any;
  bookedDates: string[] = [];
  minCheckOutDate: Date | null = null;
  

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map: L.Map | undefined;

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private bookingService: BookingService, // Inject the booking service
    private authService: AuthService,
    private renderer: Renderer2,
    private router: Router,
    private overlayContainer: OverlayContainer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

        // Set minDate to today's date in YYYY-MM-DD format
        // const today = new Date();
        // this.minDate = today.toISOString().split('T')[0];
        
        // Optional: Set maxDate if you have a limit for check-in dates
        // const max = new Date();
        // max.setFullYear(today.getFullYear() + 1); // Example: 1 year from today
        // this.maxDate = max.toISOString().split('T')[0];

        this.overlayContainer.getContainerElement().classList.add('custom-overlay-container');

    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.bookingDetails.guestName = user?.name || '';
    });
    
    this.serviceId = this.route.snapshot.paramMap.get('id');
    if (this.serviceId) {
      this.loadAccommodationDetail(this.serviceId);
      this.loadAccommodationData(this.serviceId);
      this.loadBookedDates();
    }


        // // Dynamically add Tailwind CDN script
        // const script = this.renderer.createElement('script');
        // script.src = 'https://cdn.tailwindcss.com';
        // script.id = 'tailwindScript';
        // this.renderer.appendChild(document.body, script);
  }

  
  ngAfterViewInit(): void {
    const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
    if (overlayContainer) {
      overlayContainer.style.zIndex = '1200';
    }
    console.log('ngAfterViewInit called');
    if (this.mapContainer) {
      console.log('Map container available');
      this.initMap();
    } else {
      console.error('Map container not available');
    }
  }

  onCheckInDateChange(date: Date): void {
    console.log('Check-in date changed:', date);
  
    if (date) {
      // Set the time to noon to avoid any time zone issues
      date.setHours(12, 0, 0, 0);
  
      // Format the date to 'YYYY-MM-DD' without using toISOString()
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(date.getDate()).padStart(2, '0');
  
      this.bookingDetails.checkInDate = `${year}-${month}-${day}`;
      console.log('Updated Check-in date:', this.bookingDetails.checkInDate);
    } else {
      this.bookingDetails.checkInDate = '';
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

  loadAccommodationData(serviceId: string): void {
    this.servicesService.getAccommodationDataById(serviceId).subscribe(
      (data) => {
        this.bookingDetails.accommodationId = data._id;
        this.accommodationData = data.roomTypes.map((roomType: any) => ({
          name: roomType.name,
          price: roomType.price,
          amenities: roomType.amenities,
          images: roomType.images,
          roomTypeId: roomType._id,
          accommodationId: data._id,
          rooms: roomType.rooms.map((room: any) => ({
            roomId: room._id,
            number: room.number,
            status: room.status,
          })),
        }));
      },
      (error) => {
        console.error('Error loading accommodation details:', error);
      }
    );
  }
  

// Fetch dates for the selected room type
loadBookedDates(): void {
  if (this.serviceId && this.bookingDetails.roomTypeId) {
      this.bookingService.getBookedDates(this.serviceId, this.bookingDetails.roomTypeId).subscribe(
          (dates: string[]) => {
              this.bookedDates = dates;
              console.log('Booked dates:', this.bookedDates);
          },
          (error) => {
              console.error('Error loading booked dates:', error);
          }
      );
  }
}

// Detect room type selection change to trigger date fetch
onRoomTypeChange(): void {
  this.loadBookedDates(); // Fetch new dates based on selected room type
  this.bookingDetails.checkInDate = '';
  this.bookingDetails.checkOutDate = '';

  console.log(this.bookingDetails.roomTypeId);
}

  isDateDisabled(date: string): boolean {
    return this.bookedDates.includes(date);
  }

  // Reset or adjust check-out date if check-in date changes
onDateChange(): void {
  if (this.bookingDetails.checkOutDate <= this.bookingDetails.checkInDate) {
    this.bookingDetails.checkOutDate = ''; // Reset check-out date
  }
}

disableBookedDates = (date: Date | null): boolean => {
  if (!date) {
    return false; // Allow selection if the date is null (no date selected)
  }

  // Get today's date in local time
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of today in local time

  // Set the time of the selected date to local time (start of the day)
  date.setHours(0, 0, 0, 0);

  // Manually format the date as 'YYYY-MM-DD' in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  console.log('Today (local time):', today);
  console.log('Selected date (local time):', dateString);

  // Disable if the date is before today or if it's in the list of booked dates
  return date >= today && !this.bookedDates.includes(dateString);
};


disablePastAndBookedDatesForCheckOut = (date: Date | null): boolean => {
  if (!date || !this.bookingDetails.checkInDate) {
    return false;
  }

  // Parse and set the check-in date at midnight
  const checkInDate = new Date(this.bookingDetails.checkInDate);
  checkInDate.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0); // Set selected date to midnight for comparison
  
  // Find the next booked date after the check-in date
  const nextBookedDate = this.bookedDates
    .map(booked => new Date(booked))
    .filter(booked => booked > checkInDate)
    .sort((a, b) => a.getTime() - b.getTime())[0]; // Get the closest booked date after check-in

  // Format selected date for comparison with booked dates
  const dateString = this.formatDate(date);

  // Calculate the day before the next booked date
  let maxCheckOutDate = nextBookedDate ? new Date(nextBookedDate) : null;
  if (maxCheckOutDate) {
    maxCheckOutDate.setDate(maxCheckOutDate.getDate() - 1);
  }

  // Ensure the selected date is:
  // 1. After check-in date
  // 2. Not in booked dates
  // 3. Before the day before the next booked date (if it exists)
  const isAfterCheckInDate = date > checkInDate;
  const isNotBookedOrExceedingMax = (!this.bookedDates.includes(dateString) && 
    (!maxCheckOutDate || date <= maxCheckOutDate));

  return isAfterCheckInDate && isNotBookedOrExceedingMax;
};

// Helper method to format date to 'YYYY-MM-DD'
formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}




onCheckOutDateChange(date: Date): void {
  console.log('Check-out date changed (raw):', date);

  if (date) {
    // Set the time to noon to avoid time zone issues and treat the date as local
    date.setHours(12, 0, 0, 0);

    // Manually format the date to 'YYYY-MM-DD' in local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    // Store the formatted local date string
    this.bookingDetails.checkOutDate = `${year}-${month}-${day}`;
    console.log('Updated Check-out date (local time):', this.bookingDetails.checkOutDate);
  } else {
    this.bookingDetails.checkOutDate = '';
  }
}



  // Call this function whenever checkInDate changes
  updateMinCheckOutDate() {
    if (this.bookingDetails.checkInDate) {
      this.minCheckOutDate = new Date(this.bookingDetails.checkInDate);
      this.minCheckOutDate.setDate(this.minCheckOutDate.getDate() + 1); // Set minimum to the day after check-in
    } else {
      this.minCheckOutDate = null; // Reset if checkInDate is null
    }
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
    const modalElement = document.getElementById('bookingModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  closeModal(): void {
    const modalElement = document.getElementById('bookingModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }



  
  // temporary commented Submit the booking form
  // submitBooking(): void {
  //   console.log('Booking form submitted');
  //   console.log('Booking details:', this.bookingDetails);
  // }

  selectRoomType(roomTypeId: string): void {
    const selectedRoomType = this.accommodationData.find(
      (roomType: { roomTypeId: string; price: number }) => roomType.roomTypeId === roomTypeId
    );
    
    if (selectedRoomType) {
      this.bookingDetails.roomTypeId = roomTypeId;
  
      // Calculate number of days between check-in and check-out
      if (this.bookingDetails.checkInDate && this.bookingDetails.checkOutDate) {
        const checkInDate = new Date(this.bookingDetails.checkInDate);
        const checkOutDate = new Date(this.bookingDetails.checkOutDate);
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        const numberOfDays = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days
        
        // Set amount based on room price * number of days
        this.bookingDetails.amount = selectedRoomType.price * numberOfDays;
      }

      console.log
    }
  }
  
  
  
  
  submitBooking(): void {
    const selectedRoomTypeId = this.bookingDetails.roomTypeId;
    this.selectRoomType(selectedRoomTypeId); // Set amount based on the selected room type price
    console.log('final booking details: ', this.bookingDetails);
    const today = new Date().toISOString().split('T')[0];
  
    // Check if all required fields are filled
    if (!this.bookingDetails.guestName || !this.bookingDetails.accommodationType || 
        !this.bookingDetails.numberOfGuests || !this.bookingDetails.checkInDate || 
        !this.bookingDetails.checkOutDate || !this.bookingDetails.roomTypeId) {
  
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all the required fields.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
  
    // Check if check-in date is in the past
    if (this.bookingDetails.checkInDate < today) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Check-in Date',
        text: 'Check-in date cannot be in the past.',
        confirmButtonColor: '#d33',
      });
      return;
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
  
    // Find an available room ID for the selected room type
    this.servicesService.getAvailableRoom(
      this.bookingDetails.roomTypeId,
      this.bookingDetails.checkInDate,
      this.bookingDetails.checkOutDate
    ).subscribe(
      (rooms: any[]) => {
        if (!rooms || rooms.length === 0) {  // If rooms is null or an empty array
          Swal.fire({
            icon: 'info',
            title: 'No Rooms Available',
            text: 'There are no available rooms for the selected room type.',
            confirmButtonColor: '#d33',
          });
          return;
        }
    
        // Safely check for an available room
        const availableRoom = rooms[0];
        if (availableRoom && availableRoom._id) {
          this.bookingDetails.roomId = availableRoom._id;
          console.log('Available room ID:', this.bookingDetails.roomId);
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Room is Full',
            text: 'The selected room type has no available rooms at the moment.',
            confirmButtonColor: '#3085d6',
          });
          return;
        }
  
        const bookingData = {
          ...this.bookingDetails,
          serviceId: this.serviceId,
          userId: this.currentUser?.userId,
        };
  
        // Submit the booking data
        this.bookingService.bookAccommodation(bookingData).subscribe(
          (response) => {
            console.log('Booking Response:', response);
        
            Swal.fire({
              title: 'Confirm Your Booking',
              text: 'Would you like to book now or check the details again?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Book Now',
              cancelButtonText: 'Check Again'
            }).then((result: any) => { // Explicitly typing result as any
              if (result.isConfirmed) {
                // User confirmed to "Book Now"
                this.closeModal();
        
                // Redirect to accommodation-booking-detail page with the booking ID
                const bookingId = response.booking._id;
                this.router.navigate([`/bookings/${bookingId}`]);
              } else {
                // User chose "Check Again"
                console.log('User chose to check the details again.');
                // Additional logic for "Check Again" (if needed) can go here
              }
            });
          }
        );
      },
      (error) => {
        // Handle the 404 "No Room Available" response specifically
        if (error.status === 404) {
          Swal.fire({
            icon: 'info',
            title: 'No Room Available',
            text: 'There are no rooms available for the selected room type at this time.',
            confirmButtonColor: '#d33',
          });
        } else {
          // Handle other errors
          Swal.fire({
            icon: 'error',
            title: 'Error Finding Room',
            text: 'An error occurred while finding an available room. Please try again later.',
            confirmButtonColor: '#d33',
          });
        }
      }
    );
  }
  
  

  // Function to show image preview
  // Function to show image preview and open the modal
  showImagePreview(imageUrl: string): void {
    this.selectedImage = imageUrl;

    // Use Bootstrap's modal API to open the modal
    const modalElement = document.getElementById('imagePreviewModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  get checkInDateAsDate(): Date {
    return new Date(this.bookingDetails.checkInDate);
  }
  
  
}