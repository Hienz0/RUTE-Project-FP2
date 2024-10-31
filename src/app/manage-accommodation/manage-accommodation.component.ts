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
  isEditing?: boolean;
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
  accommodationDetail: any = null; // Add this line
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
    console.log('Service ID:', serviceId); // Log the serviceId
    if (serviceId) {
      this.servicesService.getAccommodationServiceById(serviceId).subscribe((data) => {
        this.accommodation = {
          name: data.productName,
          description: data.productDescription,
          imageUrl: data.productImages[0] || '',
          location: data.location,
          roomTypes: data.roomTypes || [], // Ensure roomTypes is an array
        };
      });
    }
  
    if (serviceId !== null) {
      this.loadAccommodationDetail(serviceId);
    }
  }
  
  // Method to load accommodation details
  loadAccommodationDetail(id: string): void {
    this.servicesService.getAccommodationDetailsById(id).subscribe(
      (data) => {
        console.log('Accommodation Details:', data);
        this.accommodationDetail = Array.isArray(data) ? data as Accommodation[] : [data] as Accommodation[];
  
        // Set a default index if needed
        this.selectedAccommodationIndex = this.accommodationDetail.length > 0 ? 0 : null;
  
        // Initialize editing states
        this.accommodationDetail.forEach((accommodation: Accommodation) => {
          accommodation.roomTypes.forEach((roomType: RoomType) => {
            roomType.isEditing = false;
          });
        });
      },
      (error) => {
        console.error('Error fetching accommodation details', error);
      }
    );
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
    const formData = new FormData();
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    if (serviceId) formData.append('serviceId', serviceId);
  
    this.accommodation.roomTypes.forEach((roomType, index) => {
      formData.append(`roomTypes[${index}]`, JSON.stringify({
        name: roomType.name,
        price: roomType.price,
        amenities: roomType.amenities,
        rooms: roomType.rooms,
      }));
      roomType.images.forEach((imageBase64, imageIndex) => {
        const file = this.base64ToFile(imageBase64, `image_${index}_${imageIndex}.png`);
        if (file) { // Ensure that file is not null
          console.log(`Room Type Index: ${index}, Image Index: ${imageIndex}, Image File:`, file);
          formData.append('images', file); // Now safe to append
        } else {
          console.error(`Failed to convert image at index ${imageIndex} to file.`);
        }
      });
      
    });
  
    this.servicesService.publishAccommodation(formData).subscribe({
      next: (response) => {
        Swal.fire('Success', 'Accommodation published successfully!', 'success');
      },
      error: (error) => {
        Swal.fire('Error', 'Failed to publish accommodation.', 'error');
      }
    });
  }
  
  
  
  
  
  

  // Method to remove a room type by index
  removeRoomType(index: number) {
    this.accommodation.roomTypes.splice(index, 1);
  }

  // Method to remove a room from a specific room type by index
  removeRoom(roomType: RoomType, roomIndex: number) {
    roomType.rooms.splice(roomIndex, 1);
  }

  openAmenitiesModal(index: number, isEditing = false): void {
    this.selectedRoomTypeIndex = index;
    this.isEditing = isEditing; // Use isEditing instead of isEditingMode
    if (isEditing) {
      this.selectedAmenities = [...this.accommodationDetail[0].roomTypes[index].amenities];
      console.log('Editing room type with index:', index);
      console.log('Selected amenities:', this.selectedAmenities);
    } else {
      this.selectedAmenities = [...this.accommodation.roomTypes[index].amenities];
    }
    this.amenitiesModal.nativeElement.classList.add('show');
    this.amenitiesModal.nativeElement.style.display = 'block';
    this.isModalOpen = true;
  }


  openEditAmenitiesModal(accommodationIndex: number, roomTypeIndex: number, isEditing = false): void {
    this.selectedAccommodationIndex = accommodationIndex; // Store accommodation index
    this.selectedRoomTypeIndex = roomTypeIndex;
    this.isEditing = isEditing;
  
    if (isEditing) {
      this.selectedAmenities = [...this.accommodationDetail[accommodationIndex].roomTypes[roomTypeIndex].amenities];
    } else {
      this.selectedAmenities = [...this.accommodation.roomTypes[roomTypeIndex].amenities];
    }
  
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
    if (this.selectedRoomTypeIndex !== null) {
      if (this.isEditing && this.selectedAccommodationIndex !== null) {
        const targetAccommodation = this.accommodationDetail[this.selectedAccommodationIndex];
        if (targetAccommodation && targetAccommodation.roomTypes && targetAccommodation.roomTypes[this.selectedRoomTypeIndex]) {
          targetAccommodation.roomTypes[this.selectedRoomTypeIndex].amenities = [...this.selectedAmenities];
        } else {
          console.error("Accommodation or room type not found for editing.");
        }
      } else {
        if (this.accommodation && this.accommodation.roomTypes && this.accommodation.roomTypes[this.selectedRoomTypeIndex]) {
          this.accommodation.roomTypes[this.selectedRoomTypeIndex].amenities = [...this.selectedAmenities];
        } else {
          console.error("Accommodation or room type not found for adding.");
        }
      }
    }
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
// In your component class
selectedAccommodationIndex: number | null = null;

// Method to handle file selection
// Modify onFilesSelected to check that accommodationDetail is populated
onFilesSelected(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files && this.selectedRoomTypeIndex !== null && this.accommodationDetail && this.selectedAccommodationIndex !== null) {
    const accommodation = this.accommodationDetail[this.selectedAccommodationIndex];
    const roomType = accommodation?.roomTypes[this.selectedRoomTypeIndex];

    if (!roomType) {
      console.warn('Room type not found');
      return;
    }

    // Check the image count limit
    if (roomType.images.length + files.length > 10) {
      Swal.fire('Limit Exceeded', 'You can upload a maximum of 10 images.', 'warning');
      return;
    }

    // Proceed with file selection and preview
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
    
    base64ToFile(base64String: string, fileName: string): File | null {
      const arr = base64String.split(',');
      
      // Extract mime type
      const mimeMatch = arr[0].match(/:(.*?);/);
      
      // Check if mimeMatch is not null
      if (!mimeMatch || mimeMatch.length < 2) {
        console.error('Invalid Base64 string:', base64String);
        return null; // Return null or handle the error as appropriate
      }
    
      const mime = mimeMatch[1]; // Now we can safely access [1]
      const byteString = atob(arr[1]); // Decode base64 string
      const ab = new ArrayBuffer(byteString.length); // Create a buffer
      const ia = new Uint8Array(ab); // Create an unsigned integer array
    
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i); // Fill the array with bytes
      }
    
      return new File([ab], fileName, { type: mime }); // Return a new File object
    }

    
    
    toggleEditMode(roomType: RoomType): void {
      roomType.isEditing = !roomType.isEditing;
    }
    
    saveChanges(roomType: RoomType): void {
      console.log('Room Type saved:', roomType);
      roomType.isEditing = false;
    }
    
    
    
    

}
