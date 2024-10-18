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
    // Ambil ID dari parameter URL
    const transportID = this.route.snapshot.paramMap.get('id');

    // Log nilai transportID
    console.log('Transport ID from route:', transportID);

    // Tidak perlu konversi ke number jika ID adalah string alfanumerik
    if (transportID !== null) {
      // Langsung gunakan transportID dalam bentuk string
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
      console.error('Product ID is null or invalid');
    }
  }

  // Function to book transportation
  // Submit the booking
  onSubmit(): void {
    if (!this.currentUser || !this.transportationService) {
      console.error('User or transportation service is not available');
      return;
    }

    const bookingData = {
      serviceId: this.transportationService.id,
      userId: this.currentUser.id,
      vehicleType: this.transportationService.vehicleType,
      pickupDate: this.pickupDate,
      dropoffDate: this.dropoffDate,
      specialRequest: this.specialRequest,
      pickupLocation: this.pickupLocation,
      dropoffLocation: this.dropoffLocation,
    };

    this.service.bookTransportation(bookingData).subscribe(
      (response) => {
        console.log('Transportation booked successfully:', response);
      },
      (error) => {
        console.error('Error booking transportation:', error);
      }
    );
  }
  getFullImagePath(image: string): string {
    // Assuming images are stored in the /uploads/ folder on the server
    return `http://localhost:3000/${image}`;
  }
}
