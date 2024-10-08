import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface SignupData {
  name: string;
  email: string;
  password: string;
  userType: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  private apiUrl = 'http://localhost:3000/api/signup';

  constructor(private http: HttpClient) {}

  signup(signupData: SignupData): Observable<any> {
    return this.http.post(this.apiUrl, signupData);
  }
}
