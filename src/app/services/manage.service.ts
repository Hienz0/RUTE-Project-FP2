import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ManageService {
  private apiUrl = 'http://localhost:3000/api/services';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getServices(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }  

  addService(service: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, service, { headers: this.getHeaders() });
  }

  updateService(id: string, service: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, service, { headers: this.getHeaders() });
  }

  deleteService(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
