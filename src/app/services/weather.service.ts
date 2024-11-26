import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private apiUrl = 'http://localhost:3000/api/weather'; // Your Node.js backend URL

  constructor(private http: HttpClient) {}

  getWeather(): Observable<any> {
    return this.http.get(this.apiUrl); // Make the API call
  }
}
