import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private apiUrl = 'http://localhost:3000/api/services';

  constructor(private http: HttpClient) {}

  // Fetch services where productCategory is "Accommodation"
  getAccommodationServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${'accommodation'}`);
  }


  // Fetch a specific service by ID
  getAccommodationServiceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getTourGuideServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${'tour-guide'}`);
  }

  getTourGuideServiceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Add this method in your existing ServicesService

  deleteTourGuideService(serviceId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${serviceId}`);
  }

  
  updateTourGuideService(id: string, tourGuide: any): Observable<any> {

    return this.http.put<any>(`${this.apiUrl}/update/tourGuide/${id}`, tourGuide);
  }

  // Fetch user bookings
  getUserBookings(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings/user/${userId}`);
  }

  // Create a transaction (for Midtrans)
  createTransaction(bookingId: string, amount: number, userId: string): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/create-transaction', {
      bookingId,
      amount,
      userId,
    });
  }

  // Verify payment (for Midtrans)
  verifyPayment(orderId: string): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/verify-payment', { orderId });
  }


}
