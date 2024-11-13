import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../services/booking.service';

@Component({
  selector: 'app-accommodation-booking-detail',
  templateUrl: './accommodation-booking-detail.component.html',
  styleUrls: ['./accommodation-booking-detail.component.css']
})
export class AccommodationBookingDetailComponent implements OnInit {
  bookingId: string | null = null;
  bookingData: any = null;

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (this.bookingId) {
      this.fetchBookingData(this.bookingId);
    }
  }

  fetchBookingData(bookingId: string): void {
    this.bookingService.getBookingById(bookingId).subscribe(
      (data) => {
        this.bookingData = data;
      },
      (error) => {
        console.error('Error fetching booking data:', error);
      }
    );
  }
}
