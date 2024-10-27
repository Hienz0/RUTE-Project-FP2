import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';

interface Room {
  number: string;
}

interface RoomType {
  name: string;
  price: number;
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
  styleUrls: ['./manage-accommodation.component.css'],
})
export class ManageAccommodationComponent implements OnInit {
  isEditing = false;
  accommodation: Accommodation = {
    name: '',
    description: '',
    imageUrl: '',
    location: '',
    roomTypes: []
  };

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService
  ) {}

  ngOnInit(): void {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    if (serviceId) {
      this.servicesService.getAccommodationServiceById(serviceId).subscribe((data) => {
        this.accommodation = {
          name: data.productName,
          description: data.productDescription,
          imageUrl: data.productImages[0] || '',
          location: data.location,
          roomTypes: data.roomTypes || []
        };
      });
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveAccommodation() {
    console.log('Accommodation saved:', this.accommodation);
    this.toggleEdit();
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

  // Method to remove a room type by index
  removeRoomType(index: number) {
    this.accommodation.roomTypes.splice(index, 1);
  }

  // Method to remove a room from a specific room type by index
  removeRoom(roomType: RoomType, roomIndex: number) {
    roomType.rooms.splice(roomIndex, 1);
  }
}
