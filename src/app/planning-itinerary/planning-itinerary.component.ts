import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ItineraryService } from '../services/itinerary.service';
import { BookingService } from '../services/booking.service';
import { NgForm } from '@angular/forms';


declare var bootstrap: any;

declare var Swal: any

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
    { serviceType: 'Accommodation', serviceName: 'Not Available', startDate: '', endDate: '', startTime: '', endTime: '' },
    { serviceType: 'Tour', serviceName: 'Not Available', singleDate: '', singleTime: '' },
    { serviceType: 'Vehicle', serviceName: 'Not Available', startDate: '', endDate: '', startTime: '', endTime: '' },
    { serviceType: 'Restaurant', serviceName: 'Not Available', singleDate: '', singleTime: '' }
  ];

  selectedServices: Array<any> = [];
  bookingDetails: any = null;


  targetText: string = 'Plan Your Itinerary';
  animatedText: string = '';
  animationSpeed: number = 75; // Speed of the animation in milliseconds
  resolvedIndices: Set<number> = new Set(); // Track resolved character positions



  constructor(private router: Router, private authService: AuthService, private itineraryService: ItineraryService, private bookingService: BookingService) {}


  ngOnInit(): void {
    this.animatedText = ' '.repeat(this.targetText.length); // Placeholder with spaces
    this.animateText();
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
  
          this.vacationStartDate = new Date(itinerary.vacationStartDate).toISOString().split('T')[0];
          this.vacationEndDate = new Date(itinerary.vacationEndDate).toISOString().split('T')[0];
  
          const serviceTypes = ['Accommodation', 'Vehicle', 'Tour', 'Restaurant'];
  
          this.availableServices = serviceTypes.map((type) => {
            const service = itinerary.services.find((s: any) => s.serviceType === type) || {};
  
            if (type === 'Accommodation' || type === 'Vehicle') {
              // Shape for services requiring startDate and endDate
              return {
                serviceType: type,
                serviceName: service.serviceName || 'Not Available',
                startDate: service.startDate ? new Date(service.startDate).toISOString().split('T')[0] : '',
                endDate: service.endDate ? new Date(service.endDate).toISOString().split('T')[0] : '',
                startTime: service.startTime || '',
                endTime: service.endTime || '',
                bookingId: service.bookingId || 'Missing',
                amount: service.amount || 0,
              };
            } else if (type === 'Tour' || type === 'Restaurant') {
              // Shape for services requiring singleDate
              return {
                serviceType: type,
                serviceName: service.serviceName || 'Not Available',
                singleDate: service.singleDate ? new Date(service.singleDate).toISOString().split('T')[0] : '',
                singleTime: service.singleTime || '',
                bookingId: service.bookingId || 'Missing',
                amount: service.amount || 0,
              };
            }
            // Default case to handle unknown service types
            return {
              serviceType: type,
              serviceName: 'Not Available',
              startDate: '',
              endDate: '',
              startTime: '',
              endTime: '',
              bookingId: 'Missing',
              amount: 0,
            };
          });
  
          this.showServiceSelection = true;
        } else {
          console.log('No itinerary found for user:', userId);
          this.showServiceSelection = false;
        }
      },
      error: (err) => {
        console.error('Error loading itinerary:', err);
      },
    });
  }

  
  

  totalAmount: number = 0;

    // Method to fetch itinerary
    loadPlanningItinerary(): void {
      this.itineraryService.getPlanningItinerary(this.currentUser.userId).subscribe({
        next: (response) => {
          if (response && response.services) {
            this.selectedServices = response.services;
            this.calculateTotalAmount();
          } else {
            console.log('No services found for this user.');
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

    console.log('newService: ', newService);
    this.selectedServices.push(newService);

      // Calculate the new total amount after adding a service
  this.calculateTotalAmount();
  
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
    service.serviceName = 'Not Available'
    service.startDate = '';
    service.endDate = '';
    service.startTime = '';
    service.endTime = '';
    service.singleDate = '';
    service.singleTime = '';

    this.resetService(service);
  }
  
  // Utility method to generate a unique booking ID
  generateBookingId(): string {
    return 'booking-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  

  // Remove service both locally and from the backend
  removeService(service: any): void {
    // Remove the service locally
    this.selectedServices = this.selectedServices.filter(s => s.bookingId !== service.bookingId);

    // Call backend to remove service by bookingId
    this.itineraryService.removeServiceFromItinerary(this.currentUser.userId, service.bookingId).subscribe(
      response => {
        console.log('Service removed from itinerary', response);
        Swal.fire('Success', 'Service has been removed from your itinerary.', 'success');
      },
      error => {
        console.error('Error removing service from itinerary', error);
        Swal.fire('Error', 'There was an issue removing the service.', 'error');
      }
    );
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

    console.log('service: ', service);
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

  calculateTotalAmount(): void {
    this.totalAmount = this.selectedServices.reduce((sum, service) => {
      return sum + (service.amount || 0); // Add amount, default to 0 if missing
    }, 0);
  }


  confirmItinerary(): void {
    if (!this.currentUser.userId) {
      alert('User ID is missing. Cannot confirm itinerary.');
      return;
    }
  
    this.itineraryService.confirmItinerary(this.currentUser.userId).subscribe({
      next: (response) => {
        if (response.itineraryBooking) {
          alert('Itinerary confirmed successfully!');
          this.selectedServices = []; // Clear the services after confirmation
          this.totalAmount = 0; // Reset the total amount
        } else {
          alert('Failed to confirm itinerary.');
        }
      },
      error: (err) => {
        console.error('Error confirming itinerary:', err);
        alert('Error confirming itinerary.');
      },
    });
  }

  clearFields(itineraryForm: NgForm): void {
    const userId = this.currentUser.userId;
    if (!userId) {
      console.error('User ID is missing.');
      return;
    }
  
    // Clear frontend fields first
    this.vacationStartDate = '';
    this.vacationEndDate = '';
    this.availableServices.forEach(service => {
      service.startDate = '';
      service.startTime = '';
      service.endDate = '';
      service.endTime = '';
      service.singleDate = '';
      service.singleTime = '';
    });
  
    this.selectedServices = [];
    this.totalAmount = 0;
    this.showServiceSelection = false;
  
    // Reset the form state
    itineraryForm.resetForm();
  
    // Confirm with the user before clearing
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will clear all your itineraries and planning data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'No, keep it',
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Call to backend to clear itinerary
        this.itineraryService.clearItinerary(userId).subscribe(
          () => {
            // Show success message after clearing the data
            Swal.fire('Cleared!', 'Your itineraries have been cleared.', 'success');
          },
          (error) => {
            console.error('Error clearing itineraries:', error);
            Swal.fire('Error!', 'Failed to clear itineraries.', 'error');
          }
        );
      }
    });
  }

  clearItinerary(): void {

    // Optionally, clear the service-specific date and time data
    this.availableServices.forEach(service => {
      service.startDate = '';
      service.startTime = '';
      service.endDate = '';
      service.endTime = '';
      service.singleDate = '';
      service.singleTime = '';
    });
  
      // Notify the backend to clear itineraries for the user
  this.itineraryService.deleteItinerariesByUserId(this.currentUser.userId).subscribe({
    next: (response) => {
      // Show a success confirmation
      Swal.fire('Cleared!', 'Your itinerary has been cleared from the database.', 'success');
      
    },
    error: (error) => {
      // Show an error message if the deletion fails
      Swal.fire('Error', 'Failed to clear itinerary from the database.', 'error');
      console.error(error);
    },
  });
  }

  resetService(service: any): void {
    // Clear the local service data first
    if (service.serviceType === 'Accommodation' || service.serviceType === 'Vehicle') {
      service.serviceName = 'Not Available';
      service.startDate = '';
      service.endDate = '';
      service.startTime = '';
      service.endTime = '';
    } else if (service.serviceType === 'Tour' || service.serviceType === 'Restaurant') {
      service.serviceName = 'Not Available';
      service.singleDate = '';
      service.singleTime = '';
    }
  
    // Now make the backend call to delete the service
    this.itineraryService.deleteService(this.currentUser.userId, service.serviceType).subscribe(
      (response) => {
        console.log(`${service.serviceType} deleted successfully from the database`);
      },
      (error) => {
        console.error('Error deleting service from database:', error);
      }
    );
  }
  
  
  
  clearAllServices(): void {
    // Clear selected services locally
    this.selectedServices = [];
    this.totalAmount = 0;

    // Call the backend to delete the itinerary from the database
    this.itineraryService.clearPlanningItinerary(this.currentUser.userId).subscribe(
      response => {
        Swal.fire('Cleared!', 'All selected services and the itinerary have been cleared.', 'success');
      },
      error => {
        Swal.fire('Error!', 'There was an issue clearing the itinerary.', 'error');
      }
    );
  }
  
  isChooseDisabled(service: any): boolean {
    if (service.serviceType === 'Accommodation' || service.serviceType === 'Vehicle') {
      return (
        !service.startDate ||
        !service.startTime ||
        !service.endDate ||
        !service.endTime
      );
    } else if (service.serviceType === 'Tour' || service.serviceType === 'Restaurant') {
      return !service.singleDate || !service.singleTime;
    }
    return true; // Default case for unknown service types
  }
  
  isBookingIdValid(service: any): boolean {
    // Check if the service has a 'bookingId' property and that it's not "Missing"
    return 'bookingId' in service && service.bookingId !== 'Missing';
  }

  isAddToItineraryEnabled(service: any): boolean {
    if ('bookingId' in service && service.bookingId && service.bookingId !== 'Missing') {
      if (service.serviceType === 'Accommodation' || service.serviceType === 'Vehicle') {
        // Check for Accommodation or Vehicle: startDate, endDate, startTime, and endTime
        return (
          !!service.startDate &&
          !!service.startTime &&
          !!service.endDate &&
          !!service.endTime
        );
      } else if (service.serviceType === 'Tour' || service.serviceType === 'Restaurant') {
        // Check for Tour or Restaurant: singleDate and singleTime
        return !!service.singleDate && !!service.singleTime;
      }
    }
    return false; // Disable button if conditions are not met
  }
  
  
  
  private randomChar(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return chars[Math.floor(Math.random() * chars.length)];
  }

  private animateText(): void {
    const interval = setInterval(() => {
      if (this.resolvedIndices.size === this.targetText.length) {
        clearInterval(interval); // Stop the animation once all letters are resolved
        this.addFinalRevealEffect();
        return;
      }

      // Pick a random unresolved index
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * this.targetText.length);
      } while (this.resolvedIndices.has(randomIndex));

      // Add the index to resolved indices
      this.resolvedIndices.add(randomIndex);

      // Build the animated text
      this.animatedText = this.targetText
        .split('')
        .map((char, index) =>
          this.resolvedIndices.has(index) ? char : this.randomChar()
        )
        .join('');
    }, this.animationSpeed);
  }

  private addFinalRevealEffect(): void {
    // Add a class to trigger CSS transitions for a final effect
    const textElement = document.querySelector('.animated-text');
    if (textElement) {
      textElement.classList.add('final-reveal');
    }
  }
}
