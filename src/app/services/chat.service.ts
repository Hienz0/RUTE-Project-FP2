import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private baseUrl = 'http://localhost:3000/api/chat';
  private socket: Socket;

  constructor(private http: HttpClient) {
    // Generate a unique ID for the tab
    const tabId = sessionStorage.getItem('tabId') || `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem('tabId', tabId);
  
    // Initialize WebSocket connection with the tab ID
    this.socket = io('http://localhost:3001', { query: { tabId } });
  
    // Debug connection
    this.socket.on('connect', () => {
      console.log(`WebSocket connected with ID: ${this.socket.id}, Tab ID: ${tabId}`);
    });
  
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }
  

  // Send a message
  sendMessage(senderId: string, receiverId: string, message: string): Observable<any> {
    const chatData = { senderId, receiverId, message };
    this.socket.emit('sendMessage', chatData); // Emit the message to the server via WebSocket
    return this.http.post(`${this.baseUrl}/send-message`, chatData); // Save the message in the database
  }

  // Listen for new incoming messages
  onNewMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('newMessage', (message) => {
        console.log('New message received via WebSocket:', message); // Debug log
        observer.next(message);
      });
    });
  }

  joinChat(data: { userId: string; isAdmin: boolean }): void {
    this.socket.emit('joinChat', data);
  }
  
  
  
  

  // Get chat messages between two users
  getMessages(user1: string, user2: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/messages/${user1}/${user2}`);
  }

  // Get users who have chatted with admin
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }

  // Disconnect socket connection
  disconnect(): void {
    this.socket.disconnect();
  }
}
