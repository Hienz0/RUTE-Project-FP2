import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private url='http://localhost:3000';

  constructor(private http: HttpClient) { }

  getListProvider(): Observable<any> {
    const data = `${this.url}/getProviderStatus0`;
    return this.http.get<any[]>(data);
    
  }
  getListServices(): Observable<any> {
    const data = `${this.url}/pending-services`;
    return this.http.get<any[]>(data);
    
  }
  getServicesByID(id: number): Observable<any> {
    return this.http.get(`${this.url}/getServices/${id}`);
  }

  getProviderByID(id: number): Observable<any> {
    return this.http.get(`${this.url}/getProvider/${id}`);
  }

  approveProvider(id: number): Observable<any> {
    const nextUrl = `${this.url}/approve/${id}`;
    return this.http.put(nextUrl, {});
  }

  rejectProvider(providerID: number, message: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/reject/${providerID}`, {
      body: { message },
    });
  }

  approveServices(id: number): Observable<any> {
    const nextUrl = `${this.url}/service/approve/${id}`;
    return this.http.put(nextUrl, {});
  }

  rejectServices(id: number, message: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/service/reject/${id}`, {
      body: { message },
    });
  }
}
