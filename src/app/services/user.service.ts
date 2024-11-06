import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000';
  constructor(private http: HttpClient) { }


  // Now accepting FormData as the parameter type
  customizeProfile(profileData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/customizeProfile`, profileData);
  }
}
