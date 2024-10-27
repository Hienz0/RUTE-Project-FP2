import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class TransportationService {
  private url = 'http://localhost:3000';
  private apiUrl = 'http://localhost:3000/api/bookTransports';

  constructor(private http: HttpClient) {}

  // Function to get unique providers for "Transportation" category
  getTransportationProviders(): Observable<any> {
    return this.http.get(`${this.url}/providers/transportation`);
  }

  // Function to get transportation services by userId
  getTransportationService(userId: string): Observable<any> {
    return this.http.get(`${this.url}/getTransportationServices/${userId}`);
  }

  getTransporationServicesByID(transportID: any): Observable<any> {
    return this.http.get(`${this.url}/transportationService/${transportID}`);
  }

  bookTransport(bookingData: any): Observable<any> {
    console.log('Booking Data:', bookingData);
    return this.http.post(this.apiUrl, bookingData, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fungsi untuk mendapatkan tanggal yang sudah dibooking
  getBookedDates(): Observable<any> {
    const data = `${this.url}/api/bookedDates`;
    return this.http.get<any[]>(data);
  }
}
