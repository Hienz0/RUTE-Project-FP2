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
  getProviderByID(id: number): Observable<any> {
    return this.http.get(`${this.url}/getProvider/${id}`);
  }

  approveProvider(id: number): Observable<any> {
    const nextUrl = `${this.url}/approve/${id}`;
    return this.http.put(nextUrl, {});
  }

  rejectProvider(id: number): Observable<any> {
    const nextUrl = `${this.url}/reject/${id}`;
    return this.http.delete(nextUrl, {});
  }
}
