import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service'; // Import the booking service
import { AuthService } from '../services/auth.service';

declare var Swal: any;
@Component({
  selector: 'app-booking-tour-guide-detail',
  templateUrl: './booking-tour-guide-detail.component.html',
  styleUrls: ['./booking-tour-guide-detail.component.css']
})
export class BookingTourGuideDetailComponent implements OnInit {

  currentUser: any;

  serviceId: string | null = null;
  tourguideDetail: any = null;
  isModalOpen = false; // State for controlling modal visibility
  bookingDetails = {
    tourName: '',
    customerName: '',
    tourguideType: 'With Guide',
    numberOfParticipants: 1,
    tourDate: '',
    specialRequest: '',
  };

  currentDate: string = ''; // Define the currentDate property


  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private bookingService: BookingService, // Inject the booking service
    private authService: AuthService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    
    // Initialize the currentDate with the current date in 'yyyy-MM-dd' format
    const today = new Date();
    this.currentDate = today.toISOString().split('T')[0];
    
    this.serviceId = this.route.snapshot.paramMap.get('id');
    if (this.serviceId) {
      this.loadTourGuideDetail(this.serviceId);
    }

        // Dynamically add Tailwind CDN script
        const script = this.renderer.createElement('script');
        script.src = 'https://cdn.tailwindcss.com';
        script.id = 'tailwindScript';
        this.renderer.appendChild(document.body, script);
  }

  loadTourGuideDetail(id: string): void {
    this.servicesService.getTourGuideServiceById(id).subscribe(
      (data) => {
        this.tourguideDetail = data;

        // Set the tourName in bookingDetails based on productName
        this.bookingDetails.tourName = this.tourguideDetail.productName;
        console.log(this.tourguideDetail.productName);
        
        // Set the accommodationType in bookingDetails based on productSubcategory
        this.bookingDetails.tourguideType = this.tourguideDetail.productSubcategory;
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
  
      // submitBooking(): void {
      //   const currentDate = new Date();
      //   const tourDate = new Date(this.bookingDetails.tourDate);
      
      //   // Validate that all required fields are filled
      //   if (!this.bookingDetails.customerName || 
      //       !this.bookingDetails.tourguideType || 
      //       !this.bookingDetails.numberOfParticipants || 
      //       !this.bookingDetails.tourDate) {
        
      //     Swal.fire({
      //       icon: 'error',
      //       title: 'Missing Fields',
      //       text: 'Please fill in all the required fields.',
      //       confirmButtonColor: '#3085d6',
      //     });
      //     return;
      //   }
      
      //   // Validate that tourDate is not in the past
      //   if (tourDate <= currentDate) {
      //     Swal.fire({
      //       icon: 'error',
      //       title: 'Invalid Date',
      //       text: 'The tour date must be in the future.',
      //       confirmButtonColor: '#3085d6',
      //     });
      //     return;
      //   }
      
      //   // Log the booking data before sending it
      //   console.log(this.bookingDetails);
      
      //   // Proceed with booking service if validation passes
      //   this.bookingService.bookTourGuide(this.bookingDetails).subscribe(
      //     (response) => {
      //       console.log('Booking successful', response);
      
      //       Swal.fire({
      //         icon: 'success',
      //         title: 'Booking Successful!',
      //         text: 'Your tour or guide has been booked successfully.',
      //         confirmButtonColor: '#3085d6',
      //       });
      
      //       this.closeModal();
      //     },
      //     (error) => {
      //       console.error('Error submitting booking', error);
      
      //       Swal.fire({
      //         icon: 'error',
      //         title: 'Booking Failed',
      //         text: 'There was an error processing your booking. Please try again.',
      //         confirmButtonColor: '#d33',
      //       });
      //     }
      //   );
      // }      

      submitBooking(): void {
        const currentDate = new Date();
        const tourDate = new Date(this.bookingDetails.tourDate);
      
        // Log the current booking details
        console.log('Booking Details:', this.bookingDetails);
      
        // Validate that all required fields are filled
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
      
        // Validate that tourDate is today or in the future
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
      
        // Log the normalized dates to debug
        console.log('Current Date:', normalizedCurrentDate);
        console.log('Tour Date:', normalizedTourDate);
      
        // Proceed with booking service if validation passes
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
