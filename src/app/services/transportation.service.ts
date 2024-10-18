import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getTransporationServicesByID(transportID: number): Observable<any> {
    return this.http.get(`${this.url}/transportationService/${transportID}`);
  }
  
}
