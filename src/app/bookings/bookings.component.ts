import { Component, OnInit, ViewChild, ElementRef, OnDestroy  } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../services/booking.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import jsPDF from 'jspdf'; // Pastikan library ini diinstal
import html2canvas from 'html2canvas';


declare const Swal: any;
declare var bootstrap: any;
declare var window: any;

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }), // Start with transparent
        animate('500ms ease-in', style({ opacity: 1 })) // Fade in over 500ms
      ]),
      transition(':leave', [
        animate('500ms ease-out', style({ opacity: 0 })) // Fade out over 500ms
      ])
    ])
  ]
})
export class BookingsComponent implements OnInit, OnDestroy  {
  serviceId: string | null = null;
  bookings: any[] = [];
  filteredBookings: any[] = [];
  selectedStatus: string = 'Pending'; // Default to Pending
  selectedBookingType: string = ''; // Default to Pending
  @ViewChild('bookingModal', { static: true }) bookingModal!: ElementRef;
  selectedBooking: any | null = null;

  currentUser: any;
  userId: string | null = null;

  bookingId: string | null = null;
  remainingTimes: { [key: string]: number } = {}; // Track remaining times for each booking
interval: any;
bookingDetails: any = null;




  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router

  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.userId = this.currentUser.userId;
  
      console.log('Current User', this.currentUser);
      console.log('User ID:', this.userId);
  
      // Ensure loadBookings is called after userId is assigned
      this.loadAllBookings();

      this.bookingId = this.route.snapshot.paramMap.get('userId');
      console.log('Booking ID:', this.bookingId);
    });

    this.startCountdown();
  
    // This line should be removed to avoid calling loadBookings prematurely
    // this.loadBookings();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
  

  loadAllBookings(): void {
    console.log('Loading all bookings...');
    
    this.bookingService.getAccommodationBookingsByUserId(this.userId).subscribe(
      (response) => {
        const { accommodationBookings, tourBookings, vehicleBookings, itineraryBookings } = response;


        console.log('itinerary bookings: ', itineraryBookings);
    
        // Combine all booking types into one array
        this.bookings = [
          ...accommodationBookings,
          ...tourBookings,
          ...vehicleBookings,
          ...itineraryBookings // Include itinerary bookings
        ];
  
        // Sort combined bookings by 'updatedAt'
        this.bookings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
        console.log('All Sorted Bookings:', this.bookings);
    
        // Filter bookings after sorting them
        this.filterBookings(this.selectedStatus);
        console.log('Filtered Bookings:', this.filteredBookings);
    
        // Delay to ensure filteredBookings is fully populated before searching for a match
        setTimeout(() => {
          const matchingIndex = this.filteredBookings.findIndex(booking => booking._id === this.bookingId);
          if (matchingIndex !== -1) {
            this.openBookingModal(matchingIndex);
          }
        });
      },
      (error) => {
        console.error('Error loading bookings:', error);
      }
    );
  }
  
  
  filterBookings(status: string): void {
    this.selectedStatus = status;
  
    this.filteredBookings = this.bookings
      .filter(booking =>
        status === 'Pending'
          ? ['Waiting for payment', 'Pending', 'Expired'].includes(booking.bookingStatus)
          : status === 'Canceled'
          ? ['Canceled by Traveller', 'Canceled by Provider'].includes(booking.bookingStatus)
          : status === 'Booked'
          ? ['Booked', 'Served'].includes(booking.bookingStatus)
          : booking.bookingStatus === status
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
    this.cdr.detectChanges();
  }
  
  startCountdown(): void {
    this.interval = setInterval(() => {
      if (this.bookings && this.bookings.length > 0) {
        this.bookings.forEach((booking) => {
          if (booking.paymentExpiration) {
            const remainingTime = this.getRemainingTime(booking.paymentExpiration);
            this.remainingTimes[booking._id] = remainingTime;
  
            // If the booking has expired, update its status locally
            if (remainingTime === 0 && booking.bookingStatus === 'Waiting for payment') {
              booking.bookingStatus = 'Expired'; // Update status locally
              console.log(`Booking ${booking._id} has expired.`);
            }
          }
        });
  
        // Detect changes after updating bookings
        this.cdr.detectChanges();
      }
    }, 1000);
  }
  
  
  
  clearCountdown(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  
  getRemainingTime(expirationTime: string): number {
    const now = new Date().getTime();
    const expiration = new Date(expirationTime).getTime();
    return Math.max(expiration - now, 0); // Return remaining time in milliseconds
  }

  formatRemainingTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
  
    // Pad minutes and seconds with leading zeroes if needed
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
  
    return `${formattedMinutes}:${formattedSeconds}`;
  }
  
  
  

  openBookingModal(index: number): void {
    console.log('Opening booking modal');
    this.selectedBooking = this.filteredBookings[index];
  
    // Determine the booking type based on available fields
    if (this.selectedBooking.accommodationType) {
      this.selectedBookingType = 'Accommodation';
    } else if (this.selectedBooking.vehicleBooking) {
      this.selectedBookingType = 'Vehicle';
    } else if (this.selectedBooking.tourName) {
      this.selectedBookingType = 'Tour';
    } else if (this.selectedBooking.services && Array.isArray(this.selectedBooking.services)) {
      this.selectedBookingType = 'Itinerary';
    }
  
    // Open the modal using Bootstrap's API
    const modal = new bootstrap.Modal(this.bookingModal.nativeElement);
    modal.show();
    this.cdr.detectChanges();
  }
  


  closeBookingModal(): void {
    // Ensure the modal element and instance are defined
    if (this.bookingModal && this.bookingModal.nativeElement) {
        const modalElement = this.bookingModal.nativeElement;
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);

        // Hide the modal using the instance
        modalInstance.hide();

        // Manually remove the backdrop if it persists
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }
}



 // Properti untuk menyimpan data resi
 receiptData: any = null;

 // Properti untuk mengontrol visibilitas modal resi
 isReceiptModalOpen: boolean = false;

 closeReceiptModal(): void {
  this.isReceiptModalOpen = false; // Tutup modal
}


// downloadReceiptAsPDF(): void {
//   const receiptModalElement = document.getElementById('receipt-modal');

//   if (!receiptModalElement) {
//     alert('Unable to find the receipt modal element.');
//     return;
//   }

//   html2canvas(receiptModalElement).then((canvas) => {
//     const imgData = canvas.toDataURL('image/png');
//     const pdf = new jsPDF('p', 'mm', 'a4');

//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

//     pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
//     pdf.save(`Receipt-${new Date().toISOString()}.pdf`);
//   }).catch((error) => {
//     console.error('Error generating PDF:', error);
//   });
// }

downloadReceiptAsPDF(): void {
  if (!this.receiptData) {
    console.error('Receipt data is not available.');
    return;
  }
  // Menampilkan notifikasi awal saat mulai proses generate PDF
  Swal.fire({
    title: 'Generating Receipt...',
    text: 'Please wait while we generate your receipt.',
    allowOutsideClick: false, // Agar pengguna tidak bisa mengklik di luar modal
    didOpen: () => {
      Swal.showLoading(); // Menampilkan spinner loading
    }
  });

  this.generateReceipt(this.receiptData.bookingId, this.receiptData.bookingType, this.receiptData.details, false);
}

getBookingDetails(bookingId: string, bookingType: string): any {
  const booking = this.bookings.find((b) => b._id === bookingId);
  if (!booking) return null;

  console.log(`Booking`, booking);

  if (bookingType === 'Accommodation') {
    return {
      type: 'Accommodation',
      accommodationName: booking.accommodationName,
      accommodationType: booking.accommodationType,
      guestName: booking.guestName,
      numberOfGuests: booking.numberOfGuests,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      specialRequest: booking.specialRequest,
      amount: booking.amount,
    };
  } else if (bookingType === 'Tour') {
    return {
      type: 'Tour',
      tourName: booking.tourName,
      customerName: booking.customerName,
      numberOfParticipants: booking.numberOfParticipants,
      tourDate: booking.tourDate,
      tourTime: booking.tourTime,
      tourguideType: booking.tourguideType,
      pickupLocation: booking.pickupLocation,
      specialRequest: booking.specialRequest,
      amount: booking.amount,
    };
  } else if (bookingType === 'Vehicle') {
    return {
      type: 'Vehicle',
      productName: booking.productName,
      customerName: booking.customerName,
      rentalDuration: booking.rentalDuration,
      pickupDate: booking.pickupDate,
      dropoffDate: booking.dropoffDate,
      pickupStreetName: booking.pickupStreetName,
      dropoffStreetName: booking.dropoffStreetName,
      specialRequest: booking.specialRequest,
      vehicleDetails: booking.vehicleBooking.map((vehicle: any) => ({
        name: vehicle.name,
        selectedVehicleType: vehicle.selectedVehicleType,
        quantity: vehicle.quantity,
        pricePerVehicle: vehicle.pricePerVehicle,
        totalPrice: vehicle.totalPrice,
      })),
      totalBookingPrice: booking.totalBookingPrice,

      
    };
    
  }
  else if (bookingType === 'Itinerary') {
    return {
      type: 'Itinerary',
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      totalAmount: booking.totalAmount,
      itineraryDetails: booking.services.map((service: any) => ({
        serviceName: service.serviceName,
        startDate: service.startDate,
        endDate: service.endDate,
        amount: service.amount,
        serviceType: service.serviceType, // Jika diperlukan
      })),
    };
  }
  
  
  

  return null;
}

openReceiptModal(index: number): void {
  if (!this.filteredBookings || this.filteredBookings.length === 0) {
    console.error('Bookings array is empty or not loaded.');
    return;
  }

  const booking = this.filteredBookings[index];

  console.log('index',booking)
  if (!booking) {
    console.error('Booking not found for index:', index);
    return;
  }

  const bookingId = booking._id;
  let bookingType = '';

  // Determine booking type
  if (booking.accommodationType) {
    bookingType = 'Accommodation';
  } else if (booking.vehicleBooking) {
    bookingType = 'Vehicle';
  } else if (booking.tourName) {
    bookingType = 'Tour';
  } else {
    console.error('Unable to determine booking type for booking:', booking);
    return;
  }

  console.log('Booking Details:', bookingType);
  console.log('Received Booking ID:', bookingId);

  // Fetch booking details
  const details = this.getBookingDetails(bookingId, bookingType);
  if (details) {
    this.receiptData = { details };
    this.isReceiptModalOpen = true;
  } else {
    console.error('Booking details not found for ID:', bookingId);
  }

  this.cdr.detectChanges();
}

showReceipt(bookingDetails: any) {
  // Assign booking details to receipt data, ensuring the service type is included.
  this.receiptData = {
    details: {
      type: bookingDetails.serviceType, // Explicitly include service type
      ...bookingDetails // Spread the remaining properties of bookingDetails
    }
  };

  // Debug log to verify booking details
  console.log('Booking Details:', bookingDetails);

  // Open the receipt modal
  this.isReceiptModalOpen = true;
}


generateReceipt(
  bookingId: string,
  bookingType: string,
  details: any,
  sendToEmail: boolean = false
): void {
  console.log("generateReceipt started");
  console.time("Total time");

  this.cdr.detectChanges();
  console.log("Change detection triggered");

  if (bookingType === 'Itinerary') {
    console.log("Processing Itinerary receipt generation");

    const itineraryDetails = details.itineraryDetails || [];
    if (itineraryDetails.length === 0) {
      console.error("No services found in itineraryDetails for receipt generation.");
      return;
    }

    // Iterate over each service in itineraryDetails and generate receipt
    itineraryDetails.forEach((service: any, index: number) => {
      console.log(`Generating receipt for service ${index + 1}:`, service);

      

      // Call the receipt generation logic for each service
      this.generateSingleReceipt(bookingId, service.serviceType, details, sendToEmail);
    });

    console.log("All Itinerary receipts generated.");
  } else {
    // For other booking types, generate a single receipt
    this.generateSingleReceipt(bookingId, bookingType, details, sendToEmail);
  }

  console.timeEnd("Total time");
}


generateSingleReceipt(
  bookingId: string,
  bookingType: string,
  details: any,
  sendToEmail: boolean = false
): void {
  console.log("generateReceipt started");
  console.time("Total time");

  this.cdr.detectChanges(); // Memaksa Angular mendeteksi perubahan
  console.time("Change detection");
  console.log("Change detection triggered");
  console.timeEnd("Change detection");
  console.log("booking receipt",details)

  const receiptModalElement = document.getElementById("receipt-modal");

  if (!receiptModalElement) {
    alert("Unable to find the receipt modal element.");
    console.error("Receipt modal element not found in DOM");
    console.timeEnd("Total time");
    return;
  }

  // Clone elemen modal
  console.time("Clone element");
  const clonedElement = receiptModalElement.cloneNode(true) as HTMLElement;
  clonedElement.id = "receipt-modal-temp"; // Hindari konflik ID
  clonedElement.style.position = "absolute";
  clonedElement.style.top = "-9999px"; // Sembunyikan elemen
  clonedElement.style.left = "-9999px";
  document.body.appendChild(clonedElement); // Tambahkan elemen ke DOM
  console.timeEnd("Clone element");

  // Terapkan gaya khusus untuk ukuran A4
  clonedElement.style.width = "794px"; // Lebar A4
  clonedElement.style.minHeight = "1123px"; // Tinggi minimum A4
  clonedElement.style.fontSize = "12px"; // Ukuran font konsisten
  console.log("Cloned element prepared and styled for PDF generation");

  setTimeout(() => {
    console.time("html2canvas generation");
    console.log("Starting html2canvas generation");

    html2canvas(clonedElement, {
      scale: 1.5, // Pertahankan resolusi tinggi
      useCORS: true, // Hindari masalah dengan gambar eksternal
      allowTaint: true, // Percepat jika tidak butuh validasi taint
      logging: false, // Matikan logging untuk meningkatkan performa
      scrollX: 0,
      scrollY: 0,
      windowWidth: clonedElement.scrollWidth,
      windowHeight: clonedElement.scrollHeight,
    })
      .then((canvas: any) => {
        console.timeEnd("html2canvas generation");
        console.log("html2canvas finished rendering");

        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;
        let pageHeightLeft = imgHeight;
        let position = 0;

        console.time("Add image to PDF");
        while (pageHeightLeft > 0) {
          const canvasData = canvas.toDataURL("image/png");
          pdf.addImage(canvasData, "PNG", 0, position, pdfWidth, imgHeight);
          pageHeightLeft -= pdfHeight;
          position -= pdfHeight;

          if (pageHeightLeft > 0) pdf.addPage();
        }
        console.timeEnd("Add image to PDF");
        console.log("Image added to PDF");

        if (sendToEmail) {
          console.time("PDF to email process");
          console.log("Preparing to send PDF via email");

          const blob = pdf.output("blob");
          console.log("PDF Blob size (bytes):", blob.size);

          if (blob.size > 5 * 1024 * 1024) {
            console.warn("PDF size is too large, consider optimizing the content.");
          }

          const formData = new FormData();
          formData.append("receipt", blob, `Receipt-${bookingType}.pdf`);
          formData.append("bookingId", bookingId);
          formData.append("bookingType", bookingType);
          formData.append("details", JSON.stringify(details));

          console.log("Sending FormData to server", formData);

          this.bookingService.sendReceiptToEmail(formData).subscribe(
            () => {
              console.timeEnd("PDF to email process");
              console.log("Receipt sent to email successfully");
            },
            (error) => {
              console.timeEnd("PDF to email process");
              console.error("Error sending receipt to email:", error);
            }
          );
        } else {
          console.time("Save PDF locally");
          console.log("Saving PDF locally");
          pdf.save(`Receipt.pdf`);
          console.timeEnd("Save PDF locally");
           // Menutup Swal setelah proses selesai
          Swal.fire({
            title: 'Download Successful!',
            text: 'The receipt has been successfully downloaded.',
            icon: 'success',
            confirmButtonText: 'OK',
            timer: 3000, // Auto-close after 3 seconds (3000 milliseconds)
            timerProgressBar: true, // Show a progress bar for the timer
            willClose: () => {
              // Optionally, you can add a callback when the modal closes
            }
          });
        }

        console.log("PDF generation completed");

        // Hapus elemen sementara setelah selesai
        clonedElement.remove();
        console.log("Temporary cloned element removed from DOM");
       
        
      })
      .catch((error) => {
        console.error("Error generating canvas or PDF:", error);
      });
  }, 0);

  console.timeEnd("Total time");
}






  
  

payForBooking(bookingId: string, amount: number, bookingType: string): void {
  console.log(bookingType);
    // Check if the booking type is "Transportation"
    if (bookingType === 'Vehicle') {
      const selectedVehicleBooking = this.bookings.find(
        (booking) => booking._id === bookingId
      );

      console.log('Selected vehicle', selectedVehicleBooking);
  
      if (selectedVehicleBooking && selectedVehicleBooking.vehicleBooking?.length > 0) {
        console.log('masuk');
        // Update the amount to the totalPrice from the vehicleBooking array
        amount = selectedVehicleBooking.vehicleBooking[0].totalPrice;
      }
    }
  
  console.log('Initiating payment for', bookingId, amount, bookingType);

  this.bookingService.createTransaction(bookingId, amount, this.currentUser.userId, bookingType).subscribe(response => {
    if (response.token) {
      window.snap.pay(response.token, {
        onSuccess: (result: any) => {
          console.log('Payment successful:', result);
          this.bookingService.updatePaymentStatus(bookingId, bookingType).subscribe(
            () => {
              console.log(`${bookingType} booking updated successfully.`);
              this.loadAllBookings();
              this.closeBookingModal();
              this.receiptData = {
                bookingId,
                details: this.getBookingDetails(bookingId, bookingType),
              };
              if (bookingType !== 'Itinerary') {
                this.isReceiptModalOpen = true;
                this.generateReceipt(bookingId, bookingType, this.receiptData.details, true);
              }
              else {
                // Jika bookingType adalah "Itinerary", tampilkan notifikasi menggunakan SweetAlert
                Swal.fire({
                  icon: 'info',
                  title: 'Download Receipt',
                  text: 'Please download your receipt from the Itinerary view.',
                  confirmButtonText: 'OK',
                });
              }
              
              
              // Kirimkan PDF ke email
              
              this.cdr.detectChanges();

              

            },
            error => {
              console.error('Failed to update booking status:', error);
            }
          );
        },
        onPending: (result: any) => {
          console.log('Payment is pending:', result);
        },
        onError: (result: any) => {
          console.error('Payment failed:', result);
        },
        onClose: () => {
          console.warn('Payment popup was closed before completion.');
        }
      });
    } else {
      alert('Failed to initiate payment. No token returned.');
    }
  }, error => {
    console.error('Error creating transaction:', error);
    alert('Transaction creation failed. Please try again.');
  });
}


cancelBooking(booking: any): void {
  const userType = 'Traveller';
  const bookingType = this.selectedBookingType; // Get the type of booking (Accommodation, Tour Guide, Transportation)

  Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to cancel this booking?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
  }).then((result: any) => {
      if (result.isConfirmed) {
          this.bookingService.cancelBooking(booking._id, userType, bookingType).subscribe({
              next: () => {
                  this.loadAllBookings();
                  this.closeBookingModal();
              },
              error: (error) => {
                  console.error('Error canceling booking:', error);
                  Swal.fire('Error', 'Failed to cancel booking', 'error');
              }
          });
      }
  });
}


navigateToReview(bookingId: string): void {
  this.router.navigate(['rateServices/', bookingId]);
  console.log(bookingId);
}

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

closeModal(): void {
  const modalElement = document.getElementById('bookingModal');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal?.hide();
  }
}


// 



}