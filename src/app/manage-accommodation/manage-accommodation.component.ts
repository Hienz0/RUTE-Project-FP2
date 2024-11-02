import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';


declare const Swal: any;
declare var bootstrap: any;


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
  productImages: string[];
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
  originalAccommodationDetail: Accommodation[] = [];
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
    productImages: [],
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
          productImages: data.productImages || [],
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

              // Deep copy of accommodationDetail to store original data
      this.originalAccommodationDetail = JSON.parse(JSON.stringify(this.accommodationDetail));
      },
      (error) => {
        console.error('Error fetching accommodation details', error);
      }
    );
  }



  
  

  toggleEdit(): void {
    if (this.isEditing) {
      // Revert to original data if canceling
      this.accommodation = this.originalAccommodationDetail
        ? JSON.parse(JSON.stringify(this.originalAccommodationDetail))
        : this.accommodation;
    } else {
      // Enter edit mode
      this.originalAccommodationDetail = JSON.parse(JSON.stringify(this.accommodation));
    }
    this.isEditing = !this.isEditing;
  }

  // toggleEdit() {
  //   this.isEditing = !this.isEditing;
  // }

  saveAccommodation() {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    if (serviceId) {
      // Prepare the accommodation object with only the necessary fields
      const accommodationData = {
        productName: this.accommodation.name, // Map to productName
        productDescription: this.accommodation.description, // Map to productDescription
        productImages: this.accommodation.productImages, // Map to productImages
        location: this.accommodation.location // Map to location
      };
  
      // Call the update service function
      this.servicesService.updateAccommodationService(serviceId, accommodationData).subscribe(
        (response) => {
          console.log('Update response:', response); // Log the response from the server
          this.isEditing = false; // Close editing mode
          // Optionally display a success message
        },
        (error) => {
          console.error('Update error:', error); // Log any errors
        }
      );
    }
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
  removeRoomType(index: number): void {
    // SweetAlert2 confirmation prompt
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this room type?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Remove room type locally after confirmation
        this.accommodation.roomTypes.splice(index, 1);
        Swal.fire('Deleted!', 'The room type has been removed.', 'success');
      }
    });
  }
  

  removeExistingRoomType(accommodationIndex: number, roomTypeIndex: number): void {
    const accommodation = this.accommodationDetail[accommodationIndex];
    const roomType = accommodation.roomTypes[roomTypeIndex];
  
    // SweetAlert2 confirmation prompt
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this room type?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Proceed with deletion if confirmed
        this.servicesService.deleteRoomType(accommodation._id, roomType._id).subscribe(
          (response) => {
            console.log('Room type deleted successfully:', response);
            // Remove room type locally after successful deletion from the server
            accommodation.roomTypes.splice(roomTypeIndex, 1);
            Swal.fire('Deleted!', 'The room type has been deleted.', 'success');
          },
          (error) => {
            console.error('Error deleting room type:', error);
            Swal.fire('Error', 'There was an issue deleting the room type.', 'error');
          }
        );
      }
    });
  }
  
  

  // Method to remove a room from a specific room type by index
  removeRoom(roomType: RoomType, roomIndex: number): void {
    // SweetAlert2 confirmation prompt
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this room?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Remove room from roomType after confirmation
        roomType.rooms.splice(roomIndex, 1);
        Swal.fire('Deleted!', 'The room has been removed.', 'success');
      }
    });
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
  
    // Use Bootstrap's modal API to open the modal
    const modalElement = this.amenitiesModal.nativeElement;
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  
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
  
    // Use Bootstrap's modal API to open the modal
    const modalElement = this.amenitiesModal.nativeElement;
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  
    this.isModalOpen = true;
  }
  
  


  closeAmenitiesModal(): void {
    // Use Bootstrap's modal API to hide the modal
    const modalElement = this.amenitiesModal.nativeElement;
    const modal = bootstrap.Modal.getInstance(modalElement);
  
    if (modal) {
      modal.hide();
    }
  
    // Reset properties after closing the modal
    this.selectedRoomTypeIndex = null;
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
   openImageModal(index: number): void {
    this.selectedRoomTypeIndex = index;
    console.log('selected room index: ', this.selectedRoomTypeIndex)
  
    // Use Bootstrap's modal API to open the modal
    const modalElement = this.imageModal.nativeElement;
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    this.isEditing = false;
  }

  openEditImageModal(accommodationIndex: number, roomTypeIndex: number, isEditing = false): void {
    this.selectedAccommodationIndex = accommodationIndex;
    this.selectedRoomTypeIndex = roomTypeIndex;
    this.isEditing = isEditing;
  
    // Use Bootstrap's modal API to open the modal
    const modalElement = this.imageModal.nativeElement;
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  
    this.isModalOpen = true;
  }
  


  // Close the Image Upload Modal
  closeImageModal(): void {
    // Use Bootstrap's modal API to hide the modal
    const modalElement = this.imageModal.nativeElement;
    const modal = bootstrap.Modal.getInstance(modalElement);
    
    if (modal) {
      modal.hide();
    }
  
    // Clear data after modal is closed
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
// uploadImages(): void {
//   console.log("Selected Accommodation Index:", this.selectedAccommodationIndex);
//   console.log("Selected Room Type Index:", this.selectedRoomTypeIndex);

//   if (this.selectedImages.length > 0 && this.selectedRoomTypeIndex !== null) {
//     let roomType;

//     if (this.isEditing && this.selectedAccommodationIndex !== null) {
//       // Editing images of an existing room type in accommodationData
//       const targetAccommodation = this.accommodationDetail[this.selectedAccommodationIndex];
//       roomType = targetAccommodation?.roomTypes[this.selectedRoomTypeIndex];
//     } else {
//       // Adding images to a new room type in accommodation
//       roomType = this.accommodation.roomTypes[this.selectedRoomTypeIndex];
//     }

//     if (roomType) {
//       if (!roomType.images) {
//         roomType.images = [];
//       }

//       // Check image limit
//       if (roomType.images.length + this.previewUrls.length > 10) {
//         Swal.fire('Limit Exceeded', 'You can upload a maximum of 10 images.', 'warning');
//         return;
//       }

//       roomType.images.push(...this.previewUrls); 
//       this.closeImageModal();
//     } else {
//       console.error("Room type not found.");
//     }
//   } else {
//     console.error("Selected images or room type index not properly set.");
//   }
// }
uploadNewRoomTypeImages(): void {
  console.log("Selected Room Type Index for New Room:", this.selectedRoomTypeIndex);

  if (this.selectedImages.length > 0 && this.selectedRoomTypeIndex !== null) {
    const roomType = this.accommodation.roomTypes[this.selectedRoomTypeIndex];

    if (roomType) {
      if (!roomType.images) {
        roomType.images = [];
      }

      // Check image limit
      if (roomType.images.length + this.previewUrls.length > 10) {
        Swal.fire('Limit Exceeded', 'You can upload a maximum of 10 images.', 'warning');
        return;
      }

      roomType.images.push(...this.previewUrls); 
      this.closeImageModal();
    } else {
      console.error("Room type not found in new accommodation.");
    }
  } else {
    console.error("Selected images or room type index not properly set for new accommodation.");
  }
}

uploadExistingRoomTypeImages(): void {
  console.log("Selected Accommodation Index:", this.selectedAccommodationIndex);
  console.log("Selected Room Type Index:", this.selectedRoomTypeIndex);

  if (this.selectedImages.length > 0 && this.selectedAccommodationIndex !== null && this.selectedRoomTypeIndex !== null) {
    const targetAccommodation = this.accommodationDetail[this.selectedAccommodationIndex];
    const roomType = targetAccommodation?.roomTypes[this.selectedRoomTypeIndex];

    if (roomType) {
      if (!roomType.images) {
        roomType.images = [];
      }

      // Check image limit
      if (roomType.images.length + this.previewUrls.length > 10) {
        Swal.fire('Limit Exceeded', 'You can upload a maximum of 10 images.', 'warning');
        return;
      }

      roomType.images.push(...this.previewUrls); 
      this.closeImageModal();
    } else {
      console.error("Room type not found in existing accommodation.");
    }
  } else {
    console.error("Selected images or indices not properly set for existing accommodation.");
  }
}

// Trigger the appropriate image upload method based on the editing state
processImageUpload(): void {
  if (this.isEditing) {
    this.uploadExistingRoomTypeImages();
  } else {
    this.uploadNewRoomTypeImages();
  }
}

// uploadImages(): void {
//   console.log("Selected Accommodation Index:", this.selectedAccommodationIndex);
//   console.log("Selected Room Type Index:", this.selectedRoomTypeIndex);

//   if (this.selectedImages.length > 0 && this.selectedRoomTypeIndex !== null && this.selectedAccommodationIndex !== null) {
//     let roomType;

//     // Check if editing existing accommodation or working on a new one
//     if (this.isEditing) {
//       const targetAccommodation = this.accommodationDetail[this.selectedAccommodationIndex];
//       roomType = targetAccommodation?.roomTypes[this.selectedRoomTypeIndex];
//     } else {
//       roomType = this.accommodation.roomTypes[this.selectedRoomTypeIndex];
//     }

//     // Check if roomType exists, and initialize images if needed
//     if (roomType) {
//       if (!roomType.images) {
//         roomType.images = [];
//       }

//       if (roomType.images.length + this.previewUrls.length > 10) {
//         Swal.fire('Limit Exceeded', 'You can upload a maximum of 10 images.', 'warning');
//         return;
//       }

//       roomType.images.push(...this.previewUrls); 
//       this.closeImageModal();
//     } else {
//       console.error("Room type not found.");
//     }
//   } else {
//     console.error("Selected images or room type index not properly set.");
//   }
// }




  isImagePreviewOpen: boolean = false;
  previewImageUrl: string = '';

  showImagePreview(imageUrl: string): void {
    this.previewImageUrl = imageUrl;
  
    // Use Bootstrap's modal API to open the modal
    const modalElement = document.getElementById('imagePreviewModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
  

  closeImagePreview(): void {
    // Use Bootstrap's modal API to close the modal
    const modalElement = document.getElementById('imagePreviewModal');
    const modal = bootstrap.Modal.getInstance(modalElement); // Get the existing modal instance
    if (modal) {
      modal.hide(); // Hide the modal
    }
    
    this.isImagePreviewOpen = false; // Reset the preview state
    this.previewImageUrl = ''; // Clear the preview URL
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

    removeExistingImage(accommodationIndex: number, roomTypeIndex: number, imageIndex: number): void {  
      const accommodation = this.accommodationDetail?.[accommodationIndex];
      console.log('Selected accommodation:', accommodation);
    
      const roomType = accommodation?.roomTypes?.[roomTypeIndex];
      console.log('Selected room type:', roomType);
    
      if (!roomType || !roomType.images) {
        console.error('RoomType or images array not found.');
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
      }).then((result: any) => { 
        if (result.isConfirmed) {
          if (imageIndex > -1 && imageIndex < roomType.images.length) {
            roomType.images.splice(imageIndex, 1);
            Swal.fire('Deleted!', 'Your image has been deleted.', 'success');
          } else {
            console.warn('Image index is out of bounds.');
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

    
    
    toggleEditMode(accommodationIndex: number, roomTypeIndex: number): void {
      const roomType = this.accommodationDetail[accommodationIndex].roomTypes[roomTypeIndex];
    
      if (!roomType.isEditing) {
        // Entering edit mode: no action needed for storing data here since it's already stored in originalAccommodationDetail
      } else {
        // Exiting edit mode with Cancel: revert changes by restoring from originalAccommodationDetail
        const originalRoomType = this.originalAccommodationDetail[accommodationIndex].roomTypes[roomTypeIndex];
        this.accommodationDetail[accommodationIndex].roomTypes[roomTypeIndex] = { ...originalRoomType };
      }
    
      // Toggle edit mode
      roomType.isEditing = !roomType.isEditing;
    }
    
    
// Frontend - Component
saveChanges(accommodationIndex: number, roomTypeIndex: number): void {
  const accommodation = this.accommodationDetail[accommodationIndex];
  const roomType = accommodation.roomTypes[roomTypeIndex];

  // Store images as Base64 locally in roomType.base64Images and create files for uploading
  roomType.uploadImages = roomType.images.map((image: any, index: number) => {
    // Check if image is a Base64 string
    if (typeof image === 'string' && !image.startsWith('/uploads')) {
      return this.base64ToFile(image, `roomtype-image-${index}.png`);
    }
    return image; // Keep existing paths or File objects as-is
  });

  this.servicesService.updateRoomType(accommodation._id, roomType)
    .subscribe(
      (response) => {
        console.log('Room Type saved:', response);
        roomType.isEditing = false;
      },
      (error) => console.error('Error saving room type:', error)
    );
}




    
    
    


    logAllData(): void {
      console.log('Accommodation Detail:', this.accommodationDetail);
    }
    
    
    
    // for managing services image

    isDragging = false;

triggerFileInputService() {
  document.getElementById('fileUpload')?.click();
}

onImageSelectService(event: any) {
  const files = event.target.files;
  this.uploadImagesService(files);
}

onDropService(event: DragEvent) {
  event.preventDefault();
  this.isDragging = false;
  const files = event.dataTransfer?.files;
  if (files) {
    this.uploadImagesService(files);
  }
}

onDragOverService(event: DragEvent) {
  event.preventDefault();
  this.isDragging = true;
}

onDragLeaveService(event: DragEvent) {
  event.preventDefault();
  this.isDragging = false;
}

uploadImagesService(files: FileList) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = () => {
      // Assuming you want to add the base64 image directly to productImages
      this.accommodation.productImages.push(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
}

removeImageService(index: number) {
  this.accommodation.productImages.splice(index, 1);
}

isBase64Image(image: string): boolean {
  return image.startsWith('data:image/');
}



}
