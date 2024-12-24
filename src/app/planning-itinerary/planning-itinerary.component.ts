import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ItineraryService } from '../services/itinerary.service';
import { BookingService } from '../services/booking.service';

declare var bootstrap: any;

@Component({
  selector: 'app-planning-itinerary',
  templateUrl: './planning-itinerary.component.html',
  styleUrls: ['./planning-itinerary.component.css']
})
export class PlanningItineraryComponent implements OnInit {
  currentUser: any;

  vacationStartDate!: string;
  vacationEndDate!: string;
  showServiceSelection = false;

  availableServices = [
    { serviceType: 'Accommodation', serviceName: 'Queen Room', startDate: '', endDate: '', startTime: '', endTime: '' },
    { serviceType: 'Tour', serviceName: 'Ubud Tour', singleDate: '', singleTime: '' },
    { serviceType: 'Vehicle', serviceName: 'Car Rental', startDate: '', endDate: '', startTime: '', endTime: '' },
    { serviceType: 'Restaurant', serviceName: 'Local Diner', singleDate: '', singleTime: '' }
  ];

  selectedServices: Array<any> = [];
  bookingDetails: any = null;

  constructor(private router: Router, private authService: AuthService, private itineraryService: ItineraryService, private bookingService: BookingService) {}


  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        // Fetch itinerary based on userId if user is logged in
        this.loadItinerary(this.currentUser.userId);
        this.loadPlanningItinerary();
      }
    });
    
  }

  loadItinerary(userId: string): void {
    console.log('Loading itinerary for user:', userId);
  
    this.itineraryService.getItineraryByUserId(userId).subscribe({
      next: (itinerary) => {
        if (itinerary) {
          console.log('Itinerary loaded successfully:', itinerary);
          
          // Convert vacation start and end dates to the correct format
          this.vacationStartDate = new Date(itinerary.vacationStartDate).toISOString().split('T')[0]; // Convert to 'yyyy-mm-dd'
          this.vacationEndDate = new Date(itinerary.vacationEndDate).toISOString().split('T')[0]; // Convert to 'yyyy-mm-dd'
  
          // Process services and ensure the dates are in ISO format for the date picker
          this.availableServices = itinerary.services.map((service: any) => {
            if (service.startDate) {
              service.startDate = new Date(service.startDate).toISOString().split('T')[0]; // Convert to 'yyyy-mm-dd'
            }
            if (service.endDate) {
              service.endDate = new Date(service.endDate).toISOString().split('T')[0]; // Convert to 'yyyy-mm-dd'
            }
            if (service.singleDate) {
              service.singleDate = new Date(service.singleDate).toISOString().split('T')[0]; // Convert to 'yyyy-mm-dd'
            }
            
            return service;
          });
  
          // Set showServiceSelection to true only if there are services available
          this.showServiceSelection = this.availableServices.length > 0;
  
        } else {
          console.log('No itinerary found for user:', userId);
        }
      },
      error: (err) => {
        console.error('Error loading itinerary:', err);
      }
    });
  }

    // Method to fetch itinerary
    loadPlanningItinerary(): void {
      this.itineraryService.getPlanningItinerary(this.currentUser.userId).subscribe({
        next: (response) => {
          if (response && response.services) {
            this.selectedServices = response.services;
          } else {
            alert('No services found for this user.');
          }
        },
        error: (err) => {
          console.error('Error fetching itinerary:', err);
          alert('Error fetching itinerary');
        },
      });
    }
  
  
  
  

  onSubmit() {
    if (this.vacationStartDate && this.vacationEndDate) {
      this.showServiceSelection = true;
    }
  }

  addService(service: any) {
    // Validate date and time selection based on service type
    if (
      (service.serviceType === 'Accommodation' || service.serviceType === 'Vehicle') &&
      (!service.startDate || !service.endDate || !service.startTime || !service.endTime)
    ) {
      alert('Please select both start/end dates and times for this service.');
      return;
    }
  
    if (
      (service.serviceType === 'Tour' || service.serviceType === 'Restaurant') &&
      (!service.singleDate || !service.singleTime)
    ) {
      alert('Please select a date and time for this service.');
      return;
    }
  
    // Add service to selected services with a unique bookingId
    const newService = { ...service };
    this.selectedServices.push(newService);
  
    // Save itinerary to backend
    if (!this.currentUser.userId) {
      alert('User ID is missing. Cannot save itinerary.');
      return;
    }
  
    this.itineraryService.savePlanningItinerary(this.currentUser.userId, this.selectedServices).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Service added and planning itinerary saved successfully!');
        } else {
          alert('Failed to save planning itinerary.');
        }
      },
      error: (err) => {
        console.error('Error saving planning itinerary:', err);
      },
    });
  
    // Clear service fields after adding
    service.startDate = '';
    service.endDate = '';
    service.startTime = '';
    service.endTime = '';
    service.singleDate = '';
    service.singleTime = '';
  }
  
  // Utility method to generate a unique booking ID
  generateBookingId(): string {
    return 'booking-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  

  removeService(service: any) {
    this.selectedServices = this.selectedServices.filter(s => s !== service);
  }

  chooseService(service: any) {
    // const queryParams = { 'planning-itinerary': service.serviceName };
    const queryParams = { 'planning-itinerary': this.currentUser.userId };
    if (service.serviceType === 'Accommodation') {
      this.router.navigate(['/accommodation'], { queryParams });
    } else if (service.serviceType === 'Tour') {
      this.router.navigate(['/booking-tour-guide'], { queryParams });
    } else if (service.serviceType === 'Restaurant') {
      this.router.navigate(['/restaurant'], { queryParams });
    } else if (service.serviceType === 'Vehicle') {
      this.router.navigate(['/transportationService'], { queryParams });
    } else {
      alert('Service type not recognized!');
    }
  }
  
  saveServiceChange(service: any): void {
    const serviceData = {
      userId: this.currentUser.userId, // Assuming `currentUser.id` holds the user ID
      service: service // The service data to update or add
    };
  
    this.itineraryService.updateService(serviceData).subscribe({
      next: (response) => {
        console.log('Service updated successfully:', response);
      },
      error: (err) => {
        console.error('Error updating service:', err);
      }
    });
  }
  

  saveVacationDate(): void {
    const userId = this.currentUser.userId; // Get the user ID from the AuthService
  
    const vacationDates = {
      userId: userId, // Add the user ID to the request payload
      startDate: this.vacationStartDate,
      endDate: this.vacationEndDate,
    };
  
    this.itineraryService.updateVacationDates(vacationDates).subscribe({
      next: (response) => {
        console.log('Vacation dates saved successfully:', response);
      },
      error: (err) => {
        console.error('Error saving vacation dates:', err);
      },
    });
  }


  // Open the modal to show booking details
  viewItinerary(service: any): void {
    // Extract bookingId and serviceType from the service object
    const bookingId = service.bookingId ?? 'defaultBookingId'; // Fallback in case bookingId is missing
    const serviceType = service.serviceType ?? 'defaultServiceType'; // Fallback in case serviceType is missing
  
    // Fetch the booking details based on bookingId and serviceType
    this.bookingService.getBookingDetails(bookingId, serviceType).subscribe(
      (data) => {
        // this.bookingDetails = data; // Set the booking details to display
        this.bookingDetails = { ...data, serviceType: serviceType }; // Set the booking details to display
        console.log('booking details: ', this.bookingDetails);
        const modalElement = document.getElementById('bookingModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      },
      (error) => {
        console.error('Error fetching booking details:', error);
      }
    );
  }
  

  // Close the modal
  closeModal(): void {
    const modalElement = document.getElementById('bookingModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  }
  
  
  
  
}
