import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service'; // Import the booking service

@Component({
  selector: 'app-accommodation-detail',
  templateUrl: './accommodation-detail.component.html',
  styleUrls: ['./accommodation-detail.component.css'],
})
export class AccommodationDetailComponent implements OnInit {
  serviceId: string | null = null;
  accommodationDetail: any = null;
  isModalOpen = false; // State for controlling modal visibility
  bookingDetails = {
    guestName: '',
    accommodationType: 'Hotel',
    numberOfGuests: 1,
    checkInDate: '',
    checkOutDate: '',
    roomNumber: null,
    specialRequest: '',
  };

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private bookingService: BookingService // Inject the booking service
  ) {}

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('id');
    if (this.serviceId) {
      this.loadAccommodationDetail(this.serviceId);
    }
  }

  loadAccommodationDetail(id: string): void {
    this.servicesService.getAccommodationServiceById(id).subscribe(
      (data) => {
        this.accommodationDetail = data;
      },
      (error) => {
        console.error('Error fetching accommodation detail', error);
      }
    );
  }

  // Open the booking modal
  openModal(): void {
    this.isModalOpen = true;
  }

  // Close the booking modal
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Submit the booking form
  submitBooking(): void {
    this.bookingService.bookAccommodation(this.bookingDetails).subscribe(
      (response) => {
        console.log('Booking successful', response);
        this.closeModal();
      },
      (error) => {
        console.error('Error submitting booking', error);
      }
    );
  }
}
