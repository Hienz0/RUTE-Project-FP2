import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';


declare const Swal: any;

interface Room {
  number: string;
}

interface RoomType {
  name: string;
  price: number;
  rooms: Room[];
  amenities: string[];
  images: string[];
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
  selectedImages: File[] = [];
  previewUrls: string[] = [];
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
    this.accommodation.roomTypes.push({ name: '', price: 0, rooms: [], amenities: [], images: [] });
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
   openImageModal(index: number) {
    this.selectedRoomTypeIndex = index;
    this.imageModal.nativeElement.classList.add('show');
    this.imageModal.nativeElement.style.display = 'block';
    this.isModalOpen = true;
  }

  // Close the Image Upload Modal
  closeImageModal() {
    this.imageModal.nativeElement.classList.remove('show');
    this.imageModal.nativeElement.style.display = 'none';
    this.selectedImages = [];
    this.previewUrls = [];
    this.selectedRoomTypeIndex = null;
    this.isModalOpen = false;
  }

  // Trigger file input on click
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Handle multiple file selections
// Handle multiple file selections
onFilesSelected(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files && this.selectedRoomTypeIndex !== null) {
    const roomType = this.accommodation.roomTypes[this.selectedRoomTypeIndex];
    if (roomType.images.length + files.length > 10) {
      Swal.fire('Limit Exceeded', 'You can upload a maximum of 10 images.', 'warning');
      return;
    }

    this.selectedImages = Array.from(files);
    this.previewUrls = [];
    for (let file of this.selectedImages) {
      this.previewImage(file);
    }
  }
}

  // Preview each selected image
  previewImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrls.push(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Handle Drag Over Event
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Handle File Drop Event
  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.selectedImages = Array.from(event.dataTransfer.files);
      this.previewUrls = [];
      for (let file of this.selectedImages) {
        this.previewImage(file);
      }
    }
  }

  // Upload all selected images
// Upload all selected images
uploadImages() {
  if (this.selectedImages.length > 0 && this.selectedRoomTypeIndex !== null) {
    const roomType = this.accommodation.roomTypes[this.selectedRoomTypeIndex];
    
    // Check if adding these images exceeds the 10-image limit
    if (roomType.images.length + this.previewUrls.length > 10) {
      Swal.fire('Limit Exceeded', 'You can upload a maximum of 10 images.', 'warning');
      return;
    }

    roomType.images.push(...this.previewUrls); // Add preview URLs as image links

    // Clear selections and close modal
    this.closeImageModal();
  }
}

  isImagePreviewOpen: boolean = false;
  previewImageUrl: string = '';

  showImagePreview(imageUrl: string): void {
    this.previewImageUrl = imageUrl;
    this.isImagePreviewOpen = true;
  }

  closeImagePreview(): void {
    this.isImagePreviewOpen = false;
    this.previewImageUrl = '';
  }

  
    // Confirm removal of an image with SweetAlert2
    removeImage(roomType: RoomType, imageUrl: string): void {
      Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to remove this image?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
      }).then((result: any) => { // Explicitly typing result as any
        if (result.isConfirmed) {
          const index = roomType.images.indexOf(imageUrl);
          if (index > -1) {
            roomType.images.splice(index, 1); // Remove the image from the array
            Swal.fire('Deleted!', 'Your image has been deleted.', 'success');
          }
        }
      });
    }

    confirmRemoveImage(imageUrl: string, roomTypeIndex: number): void {
      // Get the current room type based on the selected index
      const roomType = this.accommodation.roomTypes[roomTypeIndex];
    
      // Ensure roomType is defined
      if (!roomType) {
        Swal.fire('Error!', 'Room type not found.', 'error');
        return;
      }
    
      Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to remove this image?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
      }).then((result: any) => { // Explicitly typing result as any
        if (result.isConfirmed) {
          const index = roomType.images.indexOf(imageUrl); // Find the index of the image
          if (index > -1) {
            roomType.images.splice(index, 1); // Remove the image from the array
            Swal.fire('Deleted!', 'Your image has been deleted.', 'success');
          } else {
            // Optional: Inform the user if the image wasn't found
            Swal.fire('Error!', 'Image not found.', 'error');
          }
        }
      });
    }
    
    
    
    

}