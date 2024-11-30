import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-customer-service',
  templateUrl: './customer-service.component.html',
  styleUrls: ['./customer-service.component.css']
})
export class CustomerServiceComponent implements OnInit {
  @ViewChild('chatMessagesContainer', { static: false }) chatMessagesContainer!: ElementRef;


  currentUser: any;
  userType: string = ''; // Logged-in user's role
  userId: string = ''; // Logged-in user's ID
  selectedUserId: string = ''; // Selected user's ID (for admin)
  messages: any[] = []; // Chat messages
  newMessage: string = ''; // New message content
  users: any[] = []; // Users list (for admin)
  selectedUserName: string = 'RUTE Admin';

  constructor(private chatService: ChatService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.userType = this.currentUser.userType;
      this.userId = this.currentUser.userId;
    });
;

    if (this.userType === 'admin') {
      this.loadUsers(); // Admin: Load all users
    } else {
      this.selectedUserId = '665f504a893ed90d8a930118'; // Chat with admin
      this.loadMessages();
    }
  }

  // Load messages between logged-in user and selected user
  loadMessages(): void {
    if (!this.selectedUserId) return;

    this.chatService.getMessages(this.userId, this.selectedUserId).subscribe((response) => {
      if (response.success) {
        this.messages = response.messages;
        this.scrollToBottom();
      }
    });
  }

  // Send a new message
  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService
        .sendMessage(this.userId, this.selectedUserId, this.newMessage)
        .subscribe(() => {
          this.messages.push({
            senderId: this.userId,
            message: this.newMessage,
            timestamp: new Date(),
          });
          this.newMessage = ''; // Clear the input
          this.scrollToBottom();
        });
    }
  }

  // Admin: Load users list
  loadUsers(): void {
    this.chatService.getUsers().subscribe((response) => {
      if (response.success) {
        this.users = response.users;
      }
    });
  }

  // Admin: Select a user and load messages
  selectUser(userId: string): void {
    this.selectedUserId = userId;
    this.loadMessages();
  }

  private scrollToBottom(): void {
    if (this.chatMessagesContainer) {
      setTimeout(() => {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      }, 0); // Delay to ensure DOM updates are rendered
    }
  }
  
}
