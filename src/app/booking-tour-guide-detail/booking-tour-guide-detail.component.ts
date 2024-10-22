import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';

declare var Swal: any;
import * as L from 'leaflet';

@Component({
  selector: 'app-booking-tour-guide-detail',
  templateUrl: './booking-tour-guide-detail.component.html',
  styleUrls: ['./booking-tour-guide-detail.component.css']
})
export class BookingTourGuideDetailComponent implements OnInit {
  
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
      // Hapus argumen di sini
      // this.loadLeafletMap();
    });
    
    const today = new Date();
    this.currentDate = today.toISOString().split('T')[0];
    
    this.serviceId = this.route.snapshot.paramMap.get('id');
    if (this.serviceId) {
      this.loadTourGuideDetail(this.serviceId);
    }

    // Menambahkan Tailwind CDN secara dinamis
    const script = this.renderer.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.id = 'tailwindScript';
    this.renderer.appendChild(document.body, script);
  }

  loadLeafletMap(): void {
    console.log("Memuat peta...");
    const mapElement = document.getElementById('map');
    console.log("Map element:", mapElement); // Cek elemen map
    if (mapElement) {
        console.log("Elemen map ditemukan:", mapElement);
        this.map = L.map(mapElement).setView([-8.509, 115.2605], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        L.marker([-8.509, 115.2605]).addTo(this.map)
            .bindPopup('Ubud Palaces')
            .openPopup();
    } else {
        console.error("Elemen map tidak ditemukan.");
    }
}


  loadTourGuideDetail(id: string): void {
    this.servicesService.getTourGuideServiceById(id).subscribe(
      (data) => {
        this.tourguideDetail = data;

        this.bookingDetails.tourName = this.tourguideDetail.productName;
        console.log(this.tourguideDetail.productName);
        
        this.bookingDetails.tourguideType = this.tourguideDetail.productSubcategory;

        // Pastikan memanggil loadLeafletMap di sini
        this.loadLeafletMap();
      },
      (error) => {
        console.error('Error fetching tour detail', error);
      }
    );
  }

  // Buka modal booking
  openModal(): void {
    this.isModalOpen = true;
  }

  // Tutup modal booking
  closeModal(): void {
    this.isModalOpen = false;
  }

  submitBooking(): void {
    const currentDate = new Date();
    const tourDate = new Date(this.bookingDetails.tourDate);

    // Log detail booking
    console.log('Booking Details:', this.bookingDetails);

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

    // Validasi bahwa tourDate tidak boleh di masa lalu
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

    // Proses booking jika validasi lulus
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
}
