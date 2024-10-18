import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class TransportationService {
  private url='http://localhost:3000';
  private apiUrl = 'http://localhost:3000/api/bookTransports';


  constructor(private http: HttpClient) { }

  getTransporationServices(): Observable<any> {
    const data = `${this.url}/getTransportationServices`;
    return this.http.get<any[]>(data);
  }

  getTransporationServicesByID(transportID: any): Observable<any> {
    return this.http.get(`${this.url}/transportationService/${transportID}`);
  }
  
  bookTransport(bookingData: any): Observable<any> {
    console.log('Booking Data:', bookingData);
    return this.http.post(this.apiUrl, bookingData, { headers: { 'Content-Type': 'application/json' } });

  }
  
  
}
