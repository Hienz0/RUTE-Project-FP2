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

    // Check if the room is available for the specified date range
    checkRoomAvailability(serviceId: string, roomNumber: number, checkInDate: string, checkOutDate: string): Observable<boolean> {
      return this.http.get<boolean>(`${this.apiUrl}/${'check-availability'}`, {
        params: { serviceId, roomNumber: roomNumber.toString(), checkInDate, checkOutDate }
      });
    }
}