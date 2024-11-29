import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private baseUrl = 'http://localhost:3000/api/chat';

  constructor(private http: HttpClient) {}

  sendMessage(senderId: string, receiverId: string, message: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-message`, { senderId, receiverId, message });
  }

  getMessages(user1: string, user2: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/messages/${user1}/${user2}`);
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }
}
