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

    // Fetch all restaurants
    getRestaurants(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}/restaurants`);
    }
  
    // Fetch restaurant by ID
    getRestaurantById(id: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/restaurant/${id}`);
    }
}
