import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransportationService } from '../services/transportation.service';
import { AuthService } from '../services/auth.service';

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
        },
        (error) => {
          console.error('Error fetching transportation service:', error);
        }
      );
    } else {
      console.error('Transport ID is null or invalid');
    }
  }

  // Function to book transportation
  bookTransport(): void {
    if (!this.currentUser || !this.transportationService) {
      console.error('User or transportation service is not available');
      return;
    }

    // Construct bookingData with proper property names
    const bookingData = {
      serviceId: this.transportationService._id || this.transportationService.id, // Make sure you're using the correct ID property
      userId: this.currentUser.userId || this.currentUser.userId, // Adjust as needed based on your user object structure
      pickupDate: this.pickupDate,
      dropoffDate: this.dropoffDate,
      specialRequest: this.specialRequest,
      pickupLocation: this.pickupLocation,
      dropoffLocation: this.dropoffLocation,
    };

    // // Check for required fields before sending the request
    // if (!bookingData.serviceId || !bookingData.userId || !bookingData.pickupDate || !bookingData.dropoffDate || !bookingData.pickupLocation || !bookingData.dropoffLocation) {
    //   console.error('All fields must be filled out properly.');
    //   return;
    // }

    this.service.bookTransport(bookingData).subscribe(
      (response) => {
        console.log('Transportation booked successfully:', response);
        // Optionally, navigate to a confirmation page or show a success message
      },
      (error) => {
        console.error('Error booking transportation:', error);
      }
    );
  }

  getFullImagePath(image: string): string {
    return `http://localhost:3000/${image}`;
  }
}
