import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ItineraryService } from '../services/itinerary.service';
import { BookingService } from '../services/booking.service';
import { NgForm } from '@angular/forms';
import { startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';


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

  calendarDates: { date: Date; highlight: boolean; services: any[], isPlaceholder: boolean }[] = [];


  selectedServices: Array<any> = [];
  bookingDetails: any = null;


  targetText: string = 'Plan Your Itinerary';
  animatedText: string = '';
  animationSpeed: number = 75; // Speed of the animation in milliseconds
  resolvedIndices: Set<number> = new Set(); // Track resolved character positions


  selectedMonth: number = new Date().getMonth();
  selectedYear: number = new Date().getFullYear();
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  years: number[] = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);




  constructor(private router: Router, private authService: AuthService, private itineraryService: ItineraryService, private bookingService: BookingService) {
    this.updateCalendar();
  }


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

    // const start = startOfDay(new Date(this.vacationStartDate));
    // const end = endOfDay(new Date(this.vacationEndDate));
    

    //       // Generate all dates within the vacation range
    //       this.calendarDates = eachDayOfInterval({ start, end }).map(date => ({
    //         date,
    //         highlight: false,
    //         services: this.selectedServices.filter(service =>
    //           service.singleDate
    //             ? new Date(service.singleDate).getTime() === date.getTime()
    //             : new Date(service.startDate).getTime() <= date.getTime() &&
    //               new Date(service.endDate).getTime() >= date.getTime()
    //         )
    //       }));
    
    //       // Highlight dates with services
    //       this.calendarDates.forEach(day => {
    //         if (day.services.length > 0) {
    //           day.highlight = true;
    //         }
    //       });

    this.updateCalendar();
    
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
          this.updateCalendar();
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
            console.log('selected services', this.selectedServices);
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
    this.updateCalendar();
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
        this.updateCalendar();
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
        console.log('Itinerary confirmed:', response);
        if (response.itineraryBooking) {
          alert('Itinerary confirmed successfully!');
          this.selectedServices = []; // Clear the services after confirmation
          this.totalAmount = 0; // Reset the total amount
          const bookingId = response.itineraryBooking._id;
          this.router.navigate([`/bookings/${bookingId}`]);

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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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

  getServiceColor(index: number): string {
    const colors = ['#FFA726', '#AB47BC', '#29B6F6', '#66BB6A', '#FF7043']; // Add more colors as needed
    return colors[index % colors.length];
  }
  
  updateCalendar() {
    this.calendarDates = [];
  
    // Get first day of selected month and necessary date information
    const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
  
    // Add placeholders for the previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      this.calendarDates.push({
        date: new Date(this.selectedYear, this.selectedMonth - 1, daysInPrevMonth - i),
        highlight: false,
        services: [],
        isPlaceholder: true,
      } as any);
    }
  
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(this.selectedYear, this.selectedMonth, i);
  
      // Get services for the day, including past ones
      const servicesForDay = this.getServicesForDay(currentDate);
  
      this.calendarDates.push({
        date: currentDate,
        highlight: this.isServiceDate(currentDate), // Highlight dates that have services
        services: servicesForDay,
        isPlaceholder: false,
      } as any);
    }
  
    // Add placeholders for the next month
    const remainingDays = 42 - this.calendarDates.length;
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDates.push({
        date: new Date(this.selectedYear, this.selectedMonth + 1, i),
        highlight: false,
        services: [],
        isPlaceholder: true,
      } as any);
    }
  }

  // isServiceDate(date: Date): boolean {
  //   return this.selectedServices.some(service => {
  //     const serviceDate = new Date(
  //       service.startDate || service.singleDate || service.endDate
  //     );
  //     return (
  //       serviceDate.getFullYear() === date.getFullYear() &&
  //       serviceDate.getMonth() === date.getMonth() &&
  //       serviceDate.getDate() === date.getDate()
  //     );
  //   });
  // }
  
  
  
  isHighlighted(date: Date): boolean {
    return this.selectedServices.some(service => {
      const serviceStartDate = service.startDate ? new Date(service.startDate) : null;
      const serviceEndDate = service.endDate ? new Date(service.endDate) : null;
      const serviceSingleDate = service.singleDate ? new Date(service.singleDate) : null;
  
      // Compare only the date part (ignore time)
      const dateOnly = this.stripTime(date);
      const startDateOnly = serviceStartDate ? this.stripTime(serviceStartDate) : null;
      const endDateOnly = serviceEndDate ? this.stripTime(serviceEndDate) : null;
      const singleDateOnly = serviceSingleDate ? this.stripTime(serviceSingleDate) : null;
  
      // Match if the date falls within the start-end range or equals singleDate
      if (startDateOnly && endDateOnly) {
        return dateOnly >= startDateOnly && dateOnly <= endDateOnly;
      }
  
      if (singleDateOnly) {
        return singleDateOnly.getTime() === dateOnly.getTime();
      }
  
      return false;
    });
  }
  
  // Helper method to strip the time part from a Date
  stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  
  
  
  getServicesForDay(date: Date): any[] {
    const dateOnly = this.stripTime(date);  // Strip the time part
  
    return this.selectedServices
      .filter(service => {
        const startDate = service.startDate ? new Date(service.startDate) : null;
        const endDate = service.endDate ? new Date(service.endDate) : null;
        const singleDate = service.singleDate ? new Date(service.singleDate) : null;
  
        const startDateOnly = startDate ? this.stripTime(startDate) : null;
        const endDateOnly = endDate ? this.stripTime(endDate) : null;
        const singleDateOnly = singleDate ? this.stripTime(singleDate) : null;
  
        // If the service has a startDate and endDate, check for exact match
        if (startDateOnly && endDateOnly) {
          return dateOnly.getTime() === startDateOnly.getTime() || dateOnly.getTime() === endDateOnly.getTime();
        }
  
        // If the service has a single date, match it
        if (singleDateOnly) {
          return singleDateOnly.getTime() === dateOnly.getTime();
        }
  
        return false;
      })
      .map(service => {
        // Map custom labels based on serviceType
        if (service.serviceType === 'Accommodation') {
          // Check if it's the first or last day
          const isFirstDay = new Date(service.startDate).toDateString() === dateOnly.toDateString();
          const isLastDay = new Date(service.endDate).toDateString() === dateOnly.toDateString();
  
          return {
            ...service,
            displayStartDate: isFirstDay ? `Check In: ${service.startTime}` : null,
            displayEndDate: isLastDay ? `Check Out: ${service.endTime}` : null,
          };
        } else if (service.serviceType === 'Restaurant' || service.serviceType === 'Tour') {
          return {
            ...service,
            displaySingleDate: `Reservation Time: ${service.singleTime}`, // Use singleTime for Restaurant/Tour
          };
        } else if (service.serviceType === 'Transportation') {
          return {
            ...service,
            displayStartDate: `Pick Up: ${service.startTime}`,
            displayEndDate: `Drop Off: ${service.endTime}`,
          };
        }
        return service;  // Default case
      });
  }
  
  
  
  
  
  isDateInRange(date: Date): boolean {
    const vacationStart = new Date(this.vacationStartDate);
    const vacationEnd = new Date(this.vacationEndDate);
    
    // Strip time part to ensure comparison is based on date only
    const dateOnly = this.stripLocalTime(date);
    const vacationStartOnly = this.stripLocalTime(vacationStart);
    const vacationEndOnly = this.stripLocalTime(vacationEnd);
  
    return dateOnly >= vacationStartOnly && dateOnly <= vacationEndOnly;
  }
  
  // Helper function to strip time and only compare dates
  stripLocalTime(date: Date): Date {
    const strippedDate = new Date(date);
    strippedDate.setHours(0, 0, 0, 0);  // Set to midnight to ignore time
    return strippedDate;
  }
  

  
  
  isServiceDate(date: Date): boolean {
    return this.getServicesForDay(date).length > 0;
  }

  goToPreviousMonth() {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.updateCalendar();
  }

  goToNextMonth() {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.updateCalendar();
  }

  onMonthChange() {
    this.updateCalendar();
  }

  onYearChange() {
    this.updateCalendar();
  }


}
