import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';

interface Room {
  number: string;
}

interface RoomType {
  name: string;
  price: number;
  rooms: Room[];
  amenities: string[];
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
  @ViewChild('amenitiesModal') amenitiesModal!: ElementRef;
  @ViewChild('imageModal') imageModal!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  selectedImage: File | null = null;
  previewUrl: string | null = null;
  isEditing = false;
  amenitiesList: string[] = ['Wi-Fi', 'TV', 'Mini-bar', 'Air Conditioning', 'Breakfast Included'];
  selectedAmenities: string[] = [];
  customAmenity = '';
  selectedRoomTypeIndex: number | null = null;
  isModalOpen: boolean = false;
  accommodation: Accommodation = {
    name: '',
    description: '',
    imageUrl: '',
    location: '',
    roomTypes: [],
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
          roomTypes: data.roomTypes || [],
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
    this.accommodation.roomTypes.push({ name: '', price: 0, rooms: [], amenities: [] });
  }

  addRoom(roomType: RoomType) {
    roomType.rooms.push({ number: '' });
  }

  publishAccommodation() {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    if (serviceId) {
      const accommodationData = { ...this.accommodation, serviceId };
      this.servicesService.publishAccommodation(accommodationData).subscribe({
        next: (response) => {
          console.log('Accommodation published successfully:', response);
          alert('Accommodation published successfully!');
        },
        error: (error) => {
          console.error('Error publishing accommodation:', error);
          alert('Failed to publish accommodation. Please try again.');
        }
      });
    } else {
      alert('Service ID is missing');
    }
  }
  
  
  

  // Method to remove a room type by index
  removeRoomType(index: number) {
    this.accommodation.roomTypes.splice(index, 1);
  }

  // Method to remove a room from a specific room type by index
  removeRoom(roomType: RoomType, roomIndex: number) {
    roomType.rooms.splice(roomIndex, 1);
  }

  openAmenitiesModal(index: number): void {
    this.selectedRoomTypeIndex = index;
    this.selectedAmenities = [...this.accommodation.roomTypes[index].amenities];
    this.amenitiesModal.nativeElement.classList.add('show');
    this.amenitiesModal.nativeElement.style.display = 'block';
    this.isModalOpen = true;
  }

  closeAmenitiesModal(): void {
    // Reset the selectedRoomTypeIndex to null if necessary
    this.selectedRoomTypeIndex = null;
    // Hide the modal
    this.amenitiesModal.nativeElement.classList.remove('show');
    this.amenitiesModal.nativeElement.style.display = 'none';
    this.isModalOpen = false;
  }
  

  addCustomAmenity(): void {
    if (this.customAmenity && !this.amenitiesList.includes(this.customAmenity)) {
      // Add the custom amenity to the list and mark it as selected
      this.amenitiesList.push(this.customAmenity);
      this.selectedAmenities.push(this.customAmenity);
      this.customAmenity = ''; // Clear the input field
    }
  }
  

  saveAmenities(): void {
    if (this.selectedRoomTypeIndex !== null && this.accommodation.roomTypes[this.selectedRoomTypeIndex]) {
      // Save selected amenities to the room type at the selected index
      this.accommodation.roomTypes[this.selectedRoomTypeIndex].amenities = [...this.selectedAmenities];
    }
    // Close modal after saving
    this.closeAmenitiesModal();
    this.isModalOpen = false;
  }
  
  

  // Checks if an amenity is already selected for the current room type
  isAmenitySelected(amenity: string): boolean {
    return this.selectedAmenities.includes(amenity);
  }

// Toggles the selection of an amenity for the current room type
toggleAmenitySelection(amenity: string, event: Event): void {
  const isChecked = (event.target as HTMLInputElement).checked;

  if (this.selectedRoomTypeIndex !== null) {
    const amenities = this.selectedAmenities;
    if (isChecked && !amenities.includes(amenity)) {
      amenities.push(amenity);
    } else if (!isChecked && amenities.includes(amenity)) {
      const index = amenities.indexOf(amenity);
      if (index > -1) {
        amenities.splice(index, 1);
      }
    }
  }
}



  // Open the Image Upload Modal
  openImageModal() {
    this.imageModal.nativeElement.classList.add('show');
    this.imageModal.nativeElement.style.display = 'block';
    this.isModalOpen = true;
  }

  // Close the Image Upload Modal
  closeImageModal() {
    this.imageModal.nativeElement.classList.remove('show');
    this.imageModal.nativeElement.style.display = 'none';
    this.selectedImage = null;
    this.previewUrl = null; // Reset preview on close
    this.isModalOpen = false;
  }

  // Trigger file input on click
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Handle File Selection
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImage = file;
      this.previewImage(file);
    }
  }

  // Handle Drag Over Event
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Handle File Drop Event
  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.selectedImage = file;
      this.previewImage(file);
    }
  }

  // Preview the selected image
  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Upload Image Function
  uploadImage() {
    if (this.selectedImage) {
      // Handle image upload logic here
      console.log('Uploading image:', this.selectedImage);
      this.closeImageModal();
      this.isModalOpen = false;
    }
  }

  

}
