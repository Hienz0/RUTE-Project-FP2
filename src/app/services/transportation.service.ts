import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class TransportationService {
  private url = 'http://localhost:3000';
  private apiUrl = 'http://localhost:3000/api/bookTransports';
  private getUrl = 'http://localhost:3000/remaining-quantity';
  constructor(private http: HttpClient) {}



  // Function to get transportation services by userId
  getTransportationService(): Observable<any> {
    return this.http.get(`${this.url}/transportationService`);
  }

  getTransporationServicesByID(transportID: any): Observable<any> {
    return this.http.get(`${this.url}/transportationService/${transportID}`);
  }

  getTransporationDetailsByID(transportID: any): Observable<any> {
    return this.http.get(`${this.url}/transportationsDetails/${transportID}`);
  }

  bookTransport(bookingData: any, isItinerary: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, {
      ...bookingData,
      isItinerary,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  

  saveTransportation(data: any): Observable<any> {
    return this.http.post(`${this.url}/manage/transportation`, data);
  }

  // Fungsi untuk mendapatkan tanggal yang sudah dibooking
  getBookedDates(serviceId: any): Observable<any> {
    const data = `${this.url}/api/bookedDates/${serviceId}`;
    return this.http.get<any[]>(data);
  }

  getRemainingQuantity(serviceId: string, pickupDate: string, dropoffDate: string): Observable<any> {
    return this.http.get<any>(`${this.getUrl}?serviceId=${serviceId}&pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`);
  }

   // Fungsi untuk mendapatkan data service berdasarkan ID
   getServiceById(serviceId: string): Observable<any> {
    const url = `${this.url}/getServiceById/${serviceId}`;
    return this.http.get<any>(url);
  }

  addReview(reviewData: { userId: string; bookingId: string; rating: number; comment?: string }): Observable<any> {
    const url = `${this.url}/add-review`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, reviewData, { headers });
  }

  
  getReviewList(serviceId: any): Observable<any> {
    const url = `${this.url}/review/list/${serviceId}`;
    return this.http.get<any>(url);
  }
}
