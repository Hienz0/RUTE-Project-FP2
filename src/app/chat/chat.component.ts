import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { filter } from 'rxjs/operators';
import { ProviderService } from '../services/provider.service';
import { ActivatedRoute } from '@angular/router';

import {
  trigger,
  transition,
  style,
  animate,
  query,
} from '@angular/animations';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
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
export class ChatComponent {

  @ViewChild('chatMessagesContainer', { static: false }) chatMessagesContainer!: ElementRef;


  currentUser: any;
  userType: string = ''; // Logged-in user's role
  userId: string = ''; // Logged-in user's ID
  selectedUserId: string = ''; // Selected user's ID (for admin)
  messages: any[] = []; // Chat messages
  newMessage: string = ''; // New message content
  users: any[] = []; // Users list (for admin)
  matchingServices: any[] = []; // Users list (for admin)
  items: any[] = []; // Users list (for admin)
  selectedUserName: string = 'RUTE User';
  selectedUserStatus: string = '';

    // Existing properties...
    promptMessage: string | null = 'Has your problem been resolved?'; // Holds the prompt message
    isPromptActive: boolean = false; // Tracks if a Yes/No prompt is active
  
    // Component properties
    startingQuestions: string[] = [
      'How do I register my service?',
      'What support do you offer?',
      'How can I reach more travelers?',
      'Do you help with regulations?',
      'What if I face technical issues?'
    ];
    

selectStartingQuestion(question: string): void {
  this.newMessage = question; // Prefill the input field with the selected question
  this.sendMessage();
}


  constructor(private chatService: ChatService, private authService: AuthService, private providerService: ProviderService, private route: ActivatedRoute ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.userType = this.currentUser.userType;
      this.userId = this.currentUser.userId;
  
      console.log(`Current user:`, this.currentUser); // Debug log
  // Extract 'userId' from the query parameters
  this.route.queryParams.subscribe((params) => {
    const userIdFromQuery = params['userId']; // Retrieve userId from query params

    if (userIdFromQuery) {
      this.currentUser.userId = userIdFromQuery; // Update the userId in currentUser
      console.log(`UserId updated from query params: ${userIdFromQuery}`);
      this.userId = userIdFromQuery;
    }
  });


// Only proceed if the URL contains 'providerId'
this.chatService.getQueryParams()
  .pipe(
    filter((params) => params.hasOwnProperty('providerId') && params['providerId'])
  )
  .subscribe((params) => {
    const providerId = params['providerId'];
    console.log('Provider ID found:', providerId); // Debug log
    this.selectUser(providerId);
    this.handleProviderId(providerId);

        // Call getServicesByID from providerService
        this.providerService.getServicesByID(providerId).subscribe(
          (serviceData: any) => {
            console.log('Service data loaded:', serviceData); // Debug log for service data
            this.selectedUserName = serviceData.productName;

          },
          (error: any) => {
            console.error('Error loading service data:', error);
          }
        );
  });
      
          

  
      // if (this.userType === 'admin') {
        this.loadUsers(); // Admin: Load all users
        this.pollForNewUsers();

      //   this.pollForNewUsers();
      // } else {
      //   this.selectedUserId = '665f504a893ed90d8a930118'; // Default chat with admin
      //   this.loadMessages();
      //   this.chatService.joinChat({ userId: this.userId, isAdmin: false }); // User joins their room
      // }
  
      // Listen for new messages in real-time
      console.log('Listening for new messages...');
      this.chatService.onNewMessage().subscribe((message) => {
        console.log('New message received:', message);
      // Existing logic to add message...
      if (
        message.message === 'Has your problem been resolved?' ||
        message.message === 'Hello! Has your issue been resolved? Please respond Yes or No. If we don\'t hear back from you within 3 days, your ticket will be considered resolved automatically.'
      ) 
      {
        this.promptMessage = message.message;
        this.isPromptActive = true;
      } else {
        // Deactivate the prompt if a new relevant message is received

          console.log('Deactivating prompt due to a new message');
          this.isPromptActive = false;

        }
        
        // Check if the message already exists in the chat
        if (
          (message.senderId === this.selectedUserId && message.receiverId === this.userId) ||
          (message.senderId === this.userId && message.receiverId === this.selectedUserId)
        ) {
          const existingMessage = this.messages.find(
            (msg) => msg.timestamp === message.timestamp && msg.senderId === message.senderId
          );
          if (!existingMessage) {
            console.log('Adding message to chat:', message);
            this.messages.push(message);
            setTimeout(() => this.scrollToBottom(), 0); // Automatically scroll to the bottom
          } else {
            console.log('Duplicate message ignored');
          }
        } else {
          console.log('Message not relevant to the current chat');
        }
      });
      
    });
  }
  
  
  
  

  // Load messages between logged-in user and selected user
loadMessages(): void {
  if (!this.selectedUserId) return;

  this.chatService.getMessages(this.userId, this.selectedUserId).subscribe((response) => {
    console.log('user and slx ', this.userId, this.selectedUserId);
    if (response.success) {
      this.messages = response.messages;


            // Check the latest message for prompt conditions
            if (this.messages.length > 0) {
              const latestMessage = this.messages[this.messages.length - 1];
              if (
                latestMessage.senderId === '665f504a893ed90d8a930118' && 
                (
                  latestMessage.message === 'Has your problem been resolved?' || 
                  latestMessage.message === 'Hello! Has your issue been resolved? Please respond Yes or No. If we don\'t hear back from you within 3 days, your ticket will be considered resolved automatically.'
                )
              )
              {
                this.promptMessage = latestMessage.message;
                this.isPromptActive = true;
              }
            }

      // Ensure scrolling happens after messages are rendered
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    }
  });
}


  // Send a new message
  sendMessage(): void {
    console.log('trigerred');
    if (this.newMessage.trim()) {
      this.chatService
        .sendMessage(this.userId, this.selectedUserId, this.newMessage, this.userType)
        .subscribe(() => {
          console.log('triggered2');
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
    const currentUserId = this.currentUser.userId; // Assuming `currentUser` holds the logged-in user details
  
    this.chatService.getChatUsers(currentUserId).subscribe({
      next: (response) => {
        if (response.success) {
          // Combine users and services, including `lastActive` and display name
          this.items = response.items
            .map((item: any) => ({
              ...item,
              displayName: item.type === 'user' ? item.data.name : item.data.productName, // User or service name
            }))
            .sort((a: any, b: any) => (b.lastActive || 0) - (a.lastActive || 0)); // Sort items by `lastActive`
          
          // Filter and populate users
          this.users = response.items
            .filter((item: any) => item.type === 'user')
            .map((item: any) => item.data); // Extract user details from items
  
          console.log('Sorted items:', this.items);
          console.log('Users list:', this.users);
        } else {
          console.error('Error loading items:', response.error);
        }
      },
      error: (err) => {
        console.error('Error fetching chat users:', err);
      },
    });
  }
  
  
  
  
  
  

  // Polling for new users
  pollForNewUsers(): void {
    setInterval(() => {
      console.log('Checking for new users...');
      this.loadUsers(); // Call your loadUsers function periodically
  
      const selectedUser = this.users.find((user) => user._id === this.selectedUserId);
      if (selectedUser) {
        this.selectedUserName = selectedUser.name;
        this.selectedUserStatus = selectedUser.status;
      }
      // If no matching user, keep the previously selected values unchanged
    }, 5000); // Poll every 5 seconds (adjust as needed)
  }
  

  adminId = '665f504a893ed90d8a930118';
  // Admin: Select a user and load messages
// Admin: Select a user and join their chat room
selectUser(userId: string): void {
  this.selectedUserId = userId; // Set the selected user's ID
  console.log(this.selectedUserId);
  this.loadMessages(); // Load chat history
  this.chatService.joinChat({ userId: this.adminId, isAdmin: true }); // Admin joins the selected user's room
  console.log('user', this.users);
  this.selectedUserName = this.users.find((user) => user._id === userId)?.name || '';
  this.selectedUserStatus = this.users.find((user) => user._id === userId)?.status || '';
  console.log('selected user status: ', this.selectedUserStatus);
}

  

  private scrollToBottom(): void {
    if (this.chatMessagesContainer) {
      setTimeout(() => {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      }, 0); // Delay to ensure DOM updates are rendered
    }
  }

  handlePromptResponse(response: boolean): void {
    // Send the response to the server or process it
// Determine the response message based on the response
const responseMessage = response ? 'Yes' : 'No';

// Update the userType based on the responseMessage
if (responseMessage === 'Yes') {
  this.userType = 'resolved';
} else {
  this.userType = 'unresolved';
}
    this.newMessage = responseMessage;
    this.sendMessage();

    this.userType = this.currentUser.userType;

    

    // Reset the prompt state

    this.isPromptActive = false;
  }

  sendResolutionPrompt() {
    this.newMessage = 'Has your problem been resolved?';
    this.sendMessage();
  }
  
  private handleProviderId(providerId: string): void {
    const existingUser = this.users.find((user) => user._id === providerId);
  
    if (existingUser) {
      // Open existing chat
      this.selectedUserId = providerId;
      this.selectedUserName = existingUser.name;
      this.selectedUserStatus = existingUser.status;
      this.loadMessages();
    } else {
      // Open new chat container for this provider
      this.selectedUserId = providerId;
      this.selectedUserName = 'New User'; // Default name
      this.selectedUserStatus = 'Active'; // Default status
      this.messages = []; // Clear messages for new chat
    }
  }
  
  private initializeDefaultChat(): void {
    if (this.userType === 'admin') {
      this.loadUsers(); // Admin: Load all users
      this.pollForNewUsers();
    } else {
      this.selectedUserId = '665f504a893ed90d8a930118'; // Default admin chat
      this.loadMessages();
      this.chatService.joinChat({ userId: this.userId, isAdmin: false });
    }
  }

  selectItem(item: any): void {
    if (item.type === 'user') {
      console.log('User selected:', item.data);
      this.selectUser(item.data._id); // Call existing user selection logic
      this.selectedUserName = item.data.name;
    } else if (item.type === 'service') {
      console.log('Service selected:', item.data);
      this.selectUser(item.data._id); // Call existing user selection logic
      this.selectedUserName = item.data.productName;

      // Add service-specific logic here if needed
    }
  }
  
  

}
