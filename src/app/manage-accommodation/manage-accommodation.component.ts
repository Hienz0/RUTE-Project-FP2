import { Component } from '@angular/core';

interface Room {
  number: string;
}

interface RoomType {
  name: string;
  price: number; // Add price for each room type
  rooms: Room[];
}

interface Accommodation {
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  roomTypes: RoomType[];
}

@Component({
  selector: 'app-manage-accommodation',
  templateUrl: './manage-accommodation.component.html',
  styleUrls: ['./manage-accommodation.component.css']
})
export class ManageAccommodationComponent {
  isEditing = false;

  accommodation: Accommodation = {
    name: 'Grand Hotel',
    description: 'A luxurious hotel offering comfortable accommodations in the city center.',
    imageUrl: 'https://via.placeholder.com/300x200',
    location: '123 Main St, Downtown City',
    roomTypes: [
      {
        name: 'Deluxe Room',
        price: 150, // Example price
        rooms: [
          { number: '101' },
          { number: '102' }
        ]
      },
      {
        name: 'Suite',
        price: 300, // Example price
        rooms: [
          { number: '201' },
          { number: '202' }
        ]
      }
    ],
  };

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveAccommodation() {
    console.log('Accommodation saved:', this.accommodation);
    this.toggleEdit(); // Switch back to display mode after saving
  }

  addRoomType() {
    this.accommodation.roomTypes.push({ name: '', price: 0, rooms: [] });
  }

  addRoom(roomType: RoomType) {
    roomType.rooms.push({ number: '' });
  }

  publishAccommodation() {
    console.log('Accommodation published:', this.accommodation);
  }
}
