import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = 'http://localhost:3000/api/bookings';

  constructor(private http: HttpClient) {}

  // Send a booking request to the backend
  bookAccommodation(bookingData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${'accommodation'}`, bookingData);
  }

  bookTourGuide(bookingData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${'tour-guide'}`, bookingData);
  }

    // Check if the room is available for the specified date range
    checkRoomAvailability(serviceId: string, roomNumber: number, checkInDate: string, checkOutDate: string): Observable<boolean> {
      return this.http.get<boolean>(`${this.apiUrl}/${'check-availability'}`, {
        params: { serviceId, roomNumber: roomNumber.toString(), checkInDate, checkOutDate }
      });
    }


    getBookingById(bookingId: string): Observable<any> {
      return this.http.get(`${this.apiUrl}/accommodationBooking/${bookingId}`);
    }

      // Method to get booked dates for a specific serviceId
      getBookedDates(serviceId: string, roomTypeId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/booked-dates/${serviceId}/${roomTypeId}`);
    }

    getAccommodationBookingsByServiceId(serviceId: string | null): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/accommodation/service/${serviceId}`);
    }
    

    getAccommodationBookingsByUserId(userId: string | null): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/accommodation/user/${userId}`);
    }
    

// Update payment status based on booking type
updatePaymentStatus(bookingId: string, bookingType: string): Observable<any> {
  return this.http.post<any>('http://localhost:3000/api/payments/update-status', { bookingId, bookingType });
}
    
// Create a transaction for Midtrans
createTransaction(bookingId: string, amount: number, userId: string, bookingType: string): Observable<any> {
  return this.http.post<any>('http://localhost:3000/api/create-transaction', {
    bookingId,
    amount,
    userId,
    bookingType,
  });
}

      // Method to update booking status
      updateBookingStatus(bookingId: string, status: string, bookingType: string): Observable<any> {
        const requestBody = {
            bookingStatus: status,
            bookingType: bookingType
        };
        return this.http.put(`${this.apiUrl}/status/update/${bookingId}`, requestBody);
    }
    
    
    // Method to cancel a booking
    cancelBooking(bookingId: string, userType: string, bookingType: string): Observable<any> {
      const requestBody = {
          bookingId,
          userType,
          bookingType
      };
      return this.http.put(`${this.apiUrl}/cancel`, requestBody);
  }

    // Method to update the booking status to 'Complete' for early checkout
    earlyCheckout(bookingId: string) {
      const url = `${this.apiUrl}/accommodation/${bookingId}/early-checkout`;
      return this.http.patch(url, {});
    }

    getAvailableRooms(serviceId: string, roomTypeId: string, checkInDate: string, checkOutDate: string): Observable<any> {
      const url = `${this.apiUrl}/available-rooms/${serviceId}/${roomTypeId}?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`;
      return this.http.get(url);
    }

    changeRoom(updateData: { bookingId: string, newRoomId: string }): Observable<any> {
      return this.http.put(`${this.apiUrl}/change-room`, updateData);
    }

    getRoomById(roomId: string): Observable<any> {
      return this.http.get(`${this.apiUrl}/rooms/${roomId}`);
    }
    
    sendReceiptToEmail(formData: FormData): Observable<any> {
      return this.http.post<any>('http://localhost:3000/api/receipts', formData);
    }
    
    
  
  

    
}
