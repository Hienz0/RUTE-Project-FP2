// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = 'http://localhost:3000';
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient) {
    const userJson = localStorage.getItem('currentUser');
    console.log('Fetched user from localStorage:', userJson); // Debugging localStorage value

    this.currentUserSubject = new BehaviorSubject<any>(userJson ? JSON.parse(userJson) : null);
    console.log('Initialized currentUserSubject:', this.currentUserSubject.value); // Debugging initial value of currentUserSubject

    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    console.log('Current user value accessed:', this.currentUserSubject.value); // Debugging currentUserValue getter
    return this.currentUserSubject.value;
  }

  // login(email: string, password: string): Observable<any> {
  //   console.log('Login data:', { email, password }); // Log the login data
  //   return this.http.post<any>(`${this.authUrl}/signin`, { email, password }).pipe(
  //     tap(response => {
  //       // Store user details and jwt token in local storage to keep user logged in between page refreshes
  //       console.log('User received from server:', response); // Debugging response from server
  //       localStorage.setItem('currentUser', JSON.stringify(response.user));
  //       localStorage.setItem('token', response.token);
  //       console.log('User stored in localStorage:', response.user); // Debugging localStorage update
  //       this.currentUserSubject.next(response.user);
  //       console.log('currentUserSubject updated:', response.user); // Debugging BehaviorSubject update
  //     })
  //   );
  // }

  //sends a POST request to the /signin endpoint,
  login(email: string, password: string): Observable<any> {
    console.log('Login data:', { email, password }); // Log the login data
    return this.http.post<any>(`${this.authUrl}/signin`, { email, password }).pipe(
      tap(response => {
        // Store user details and jwt token in local storage to keep user logged in between page refreshes
        console.log('User received from server:', response); // Debugging response from server
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        console.log('User stored in localStorage:', response.user); // Debugging localStorage update
        this.currentUserSubject.next(response.user);
        console.log('currentUserSubject updated:', response.user); // Debugging BehaviorSubject update
      })
    );
  }
  
  //sends a POST request to the /signup endpoint to register the user, returning the observable response.
  register(user: any): Observable<any> {
    // Log the user data before sending the request
    console.log('Registering user from service:', user);
    return this.http.post<any>(`${this.authUrl}/signup`, user);
  }

  registerProvider(formData: FormData, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(`${this.authUrl}/api/register-provider`, formData, { headers }); // Corrected method call
  }

  ///testing for the search 
  getAllServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.authUrl}/services`);
  }

  searchServices(term: string, category?: string): Observable<any[]> {
    let url = `${this.authUrl}/api/search`;
  
    const params: any = { term };
    if (category) {
      params.category = category;
    }
  
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get<any[]>(url, { params, headers });
  }
  


  logout(): void {
    // Remove user from local storage to log user out
    console.log('Logging out user:', this.currentUserSubject.value); // Debugging logout action
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    console.log('currentUserSubject after logout:', this.currentUserSubject.value); // Debugging BehaviorSubject after logout
  }
}
