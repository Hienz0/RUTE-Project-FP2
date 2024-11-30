import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import {
  trigger,
  transition,
  style,
  animate,
  query,
} from '@angular/animations';

@Component({
  selector: 'app-customer-service',
  templateUrl: './customer-service.component.html',
  styleUrls: ['./customer-service.component.css'],
  animations: [
    trigger('messageAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(20px) scale(0.95)',
        }),
        animate(
          '200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          })
        ),
      ]),
    ]),
  ],
  
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
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.userType = this.currentUser.userType;
      this.userId = this.currentUser.userId;
  
      console.log(`Current user:`, this.currentUser); // Debug log
  
      if (this.userType === 'admin') {
        this.loadUsers(); // Admin: Load all users
      } else {
        this.selectedUserId = '665f504a893ed90d8a930118'; // Default chat with admin
        this.loadMessages();
        this.chatService.joinChat({ userId: this.userId, isAdmin: false }); // User joins their room
      }
  
      // Listen for new messages in real-time
      console.log('Listening for new messages...');
      this.chatService.onNewMessage().subscribe((message) => {
        console.log('New message received:', message); // Debug log
        if (
          (message.senderId === this.selectedUserId && message.receiverId === this.userId) ||
          (message.senderId === this.userId && message.receiverId === this.selectedUserId)
        ) {
          console.log('Adding message to chat:', message); // Debug log
          this.messages.push(message); // Add new message to the chat
          setTimeout(() => this.scrollToBottom(), 0); // Automatically scroll to the bottom
        } else {
          console.log('Message not relevant to the current chat'); // Debug log
        }
      });
    });
  }
  
  
  
  

  // Load messages between logged-in user and selected user
loadMessages(): void {
  if (!this.selectedUserId) return;

  this.chatService.getMessages(this.userId, this.selectedUserId).subscribe((response) => {
    if (response.success) {
      this.messages = response.messages;

      // Ensure scrolling happens after messages are rendered
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
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
// Admin: Select a user and join their chat room
selectUser(userId: string): void {
  this.selectedUserId = userId; // Set the selected user's ID
  this.loadMessages(); // Load chat history
  this.chatService.joinChat({ userId, isAdmin: true }); // Admin joins the selected user's room
}

  

  private scrollToBottom(): void {
    if (this.chatMessagesContainer) {
      setTimeout(() => {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      }, 0); // Delay to ensure DOM updates are rendered
    }
  }
  
}
