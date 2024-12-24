import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {
  private apiUrl = 'http://localhost:3000/api/itinerary'; // Adjust as per your backend

  constructor(private http: HttpClient) {}

  // Update a service (this could be a service like accommodation, vehicle, etc.)
  updateService(serviceData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/services`, serviceData); // Sends userId and service data
  }
  

  // Update the vacation start and end dates
  updateVacationDates(dates: { userId: string; startDate: string; endDate: string }): Observable<any> {
    // Concatenate '/dates' to the base URL
    const url = `${this.apiUrl}/dates`;
    return this.http.put(url, dates);
  }

  getItineraryByUserId(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  savePlanningItinerary(userId: string, services: any[]): Observable<any> {
    const payload = {
      userId,
      services,
    };

    return this.http.post(`${this.apiUrl}/save`, payload);
  }

    // Method to fetch itinerary based on userId
    getPlanningItinerary(userId: string): Observable<any> {
      return this.http.get(`${this.apiUrl}/planning/${userId}`); // Combine base URL and route dynamically
    }

    updateItinerary(bookingId: string, userId: string, serviceType: string) {
      return this.http.put(`${this.apiUrl}/add-service`, { bookingId, userId, serviceType });
    }
    
    
    
    
}
