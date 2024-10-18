import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class TransportationService {
  private url='http://localhost:3000';
  constructor(private http: HttpClient) { }

  getTransporationServices(): Observable<any> {
    const data = `${this.url}/getTransportationServices`;
    return this.http.get<any[]>(data);
  }

  getTransporationServicesByID(transportID: any): Observable<any> {
    return this.http.get(`${this.url}/transportationService/${transportID}`);
  }
  
  // Method to book transportation
  bookTransportation(bookingData: any): Observable<any> {
   
    return this.http.post<any>(`${this.url}/book-transportation`, bookingData);
    
  }
  
}
