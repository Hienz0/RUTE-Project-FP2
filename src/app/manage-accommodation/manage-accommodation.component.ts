import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { BookingService } from '../services/booking.service'; // Import the booking service
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OverlayContainer } from '@angular/cdk/overlay';
import * as L from 'leaflet';








declare const Swal: any;
declare var bootstrap: any;


interface Room {
  number: string;
  status: string;
  isLocked: boolean;
  lockReason: string;
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
  businessCoordinates?: { type: string; coordinates: [number, number] };
}

@Component({
  selector: 'app-manage-accommodation',
  templateUrl: './manage-accommodation.component.html',
  styleUrls: ['./manage-accommodation.component.css'],
})
export class ManageAccommodationComponent implements OnInit, AfterViewInit {
  currentUser: any;

  accommodationDetail: any = null; // Add this line
  @ViewChild('amenitiesModal') amenitiesModal!: ElementRef;
  @ViewChild('imageModal') imageModal!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('lockModal', { static: false }) lockModal!: ElementRef;
  @ViewChild('lockRoomModal', { static: false }) lockRoomModal!: ElementRef;


  originalAccommodationDetail: Accommodation[] = [];
  selectedImages: File[] = [];
  previewUrls: string[] = [];
  isEditing = false;
  amenitiesList: string[] = ['Wi-Fi', 'TV', 'Mini-bar', 'Air Conditioning', 'Breakfast Included'];
  selectedAmenities: string[] = [];
  customAmenity = '';
  selectedRoomTypeIndex: number | null = null;
  lockReason: string = 'Maintenance';
customReason: string = '';


selectedRoomIndex: number | null = null;  // Add this line
roomLockReason: string = 'Maintenance';
roomCustomReason: string = '';

  isModalOpen: boolean = false;
  accommodation: Accommodation = {
    name: '',
    description: '',
    imageUrl: '',
    location: '',
    roomTypes: [],
    productImages: [],
    businessCoordinates: {
      type: 'Point',
      coordinates: [0, 0], // Default coordinates (longitude, latitude)
    },
  };
  



  // for booking offline

  minDate = new Date();
  maxDate: string = '';
  
  serviceId: string | null = null;
  accommodationData: any = null;
  bookingDetails = {
    guestName: '',
    accommodationType: 'Hotel', // Default accommodation type
    numberOfGuests: 1,
    checkInDate: '',
    checkOutDate: '',
    roomTypeId: '', // Added to store the selected room type ID
    roomId: '', // To store the selected room ID
    accommodationId: '', // To store the accommodation ID
    specialRequest: ''
  };
  selectedImage: string | null = null;
  bookingModal: any;
  bookedDates: string[] = [];
  minCheckOutDate: Date | null = null;
  businessCoordinates: { lat: number, lng: number } | null = null;
  map: any; // Add this to your component class


  


  //

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private bookingService: BookingService,
    private router: Router,
    private authService: AuthService,
    private overlayContainer: OverlayContainer,

  ) {}

  ngOnInit(): void {

    this.overlayContainer.getContainerElement().classList.add('custom-overlay-container');

    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.bookingDetails.guestName = user?.name || '';
    });
    
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    console.log('Service ID:', serviceId); // Log the serviceId

    this.serviceId = this.route.snapshot.paramMap.get('serviceId');

    
    if (serviceId) {
      this.servicesService.getAccommodationServiceById(serviceId).subscribe((data) => {
        this.bookingDetails.accommodationType = data.productSubcategory;

        console.log('Accommodation Service:', data);
        this.accommodation = {
          name: data.productName,
          description: data.productDescription,
          imageUrl: data.productImages[0] || '',
          location: data.location,
          roomTypes: data.roomTypes || [],
          productImages: data.productImages || [],
          businessCoordinates: data.businessCoordinates,
        };
        this.bookingDetails.accommodationType = data.productSubcategory;
        console.log('productSubcategory:', this.bookingDetails.accommodationType);
      });

      this.loadAccommodationData(serviceId);
      this.loadBookedDates();
    }
  
    if (serviceId !== null) {
      this.loadAccommodationDetail(serviceId);
    }
  }

  ngAfterViewInit(): void {
    const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
    if (overlayContainer) {
      overlayContainer.style.zIndex = '1200';
    }
    console.log('ngAfterViewInit called');
    if (this.isEditing) {
      this.initializeMap();
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
        console.log('selectedAccommodationIndex:', this.selectedAccommodationIndex);
  
        // Initialize editing states
        this.accommodationDetail.forEach((accommodation: Accommodation) => {
          accommodation.roomTypes.forEach((roomType: RoomType) => {
            roomType.isEditing = false;
          });
        });

        console.log('accommodationDetail:', this.accommodationDetail);

              // Deep copy of accommodationDetail to store original data
      this.originalAccommodationDetail = JSON.parse(JSON.stringify(this.accommodationDetail));
      },
      (error) => {
        console.error('Error fetching accommodation details', error);
      }
    );
  }

  initializeMap() {
    const initialCoordinates: [number, number] = [-8.5069, 115.2624]; // Default coordinates (Ubud, Bali)
    const zoomLevel = 13;
  
    // Initialize the map and set the initial view
    const map = L.map('map').setView(initialCoordinates, zoomLevel);
    console.log('Map Initialized:', map);
  
    // Add the tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
  
    // Initialize the marker at default coordinates
    const marker = L.marker(initialCoordinates).addTo(map);
  
    // Check if businessCoordinates exist and are valid
    const businessCoordinates = this.accommodation?.businessCoordinates;
    if (
      businessCoordinates &&
      businessCoordinates.coordinates &&
      businessCoordinates.coordinates[0] !== 0 &&
      businessCoordinates.coordinates[1] !== 0
    ) {
      const [lng, lat] = businessCoordinates.coordinates;
      marker.setLatLng([lat, lng]); // Set marker to the saved coordinates
      map.setView([lat, lng], zoomLevel); // Focus the map on the saved marker location
    }
  
    // Add a click event listener for the map
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]); // Update marker position
  
      // Update accommodation businessCoordinates
      if (this.accommodation?.businessCoordinates) {
        this.accommodation.businessCoordinates.coordinates = [lng, lat]; // GeoJSON format requires [lng, lat]
        console.log('Updated coordinates:', this.accommodation.businessCoordinates.coordinates);
      } else {
        console.warn('Accommodation or businessCoordinates is undefined');
      }
  
      // Center the map on the new marker position
      map.flyTo([lat, lng], zoomLevel);
    });
  
    // Ensure the map resizes correctly when the window is resized
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }
  


  
  

  toggleEdit(): void {
    if (this.isEditing) {
      this.accommodation = this.originalAccommodationDetail
        ? JSON.parse(JSON.stringify(this.originalAccommodationDetail))
        : this.accommodation;
    } else {
      this.originalAccommodationDetail = JSON.parse(JSON.stringify(this.accommodation));
    }

    this.isEditing = !this.isEditing;

    // Initialize the map if entering edit mode
    if (this.isEditing && !this.map) {
      setTimeout(() => this.initializeMap(), 0); // Delay map initialization
    }
  }
  

  // toggleEdit() {
  //   this.isEditing = !this.isEditing;
  // }

  saveAccommodation() {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    if (serviceId) {
      Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to save the changes to the accommodation?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, save it!',
      }).then((result: any) => {
        if (result.isConfirmed) {
          // Prepare the accommodation object with the necessary fields
          const accommodationData = {
            productName: this.accommodation.name,
            productDescription: this.accommodation.description,
            productImages: this.accommodation.productImages,
            location: this.accommodation.location,
            businessCoordinates: this.accommodation.businessCoordinates, // Include coordinates
          };
  
          // Call the update service function
          this.servicesService.updateAccommodationService(serviceId, accommodationData).subscribe(
            (response) => {
              console.log('Update response:', response); // Log the response from the server
              this.isEditing = false; // Close editing mode
              Swal.fire('Saved!', 'Your accommodation has been updated.', 'success'); // Show success message
            },
            (error) => {
              console.error('Update error:', error); // Log any errors
              Swal.fire('Error!', 'There was an error updating the accommodation.', 'error'); // Show error message
            }
          );
        }
      });
    }
  }
  
  
  
  

  addRoomType() {
    this.accommodation.roomTypes.push({ name: '', price: 0, rooms: [], amenities: [], images: [] });
  }

  addRoom(roomType: RoomType) {
    roomType.rooms.push({ 
      number: '', 
      status: 'available', // Default status value
      isLocked: false,     // Default isLocked value
      lockReason: ''       // Default lockReason value
    });
  }
  

  publishAccommodation() {
    // SweetAlert2 confirmation prompt
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to publish this accommodation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, publish it!',
    }).then((result: any) => {
      if (result.isConfirmed) {
        const formData = new FormData();
        const serviceId = this.route.snapshot.paramMap.get('serviceId');
        if (serviceId) formData.append('serviceId', serviceId);
    
        this.accommodation.roomTypes.forEach((roomType, roomIndex) => {
          // Create a temporary array to hold the file URLs
          const uploadedImageUrls: string[] = [];
    
          // Append room type details as a JSON string
          formData.append(`roomTypes[${roomIndex}]`, JSON.stringify({
            name: roomType.name,
            price: roomType.price,
            amenities: roomType.amenities,
            rooms: roomType.rooms,
            images: JSON.stringify(uploadedImageUrls) // Make sure to stringify for consistency
          }));
  
          console.log('roomType:', roomType);
          console.log('formData:', formData);
    
          // Append each image and store their filenames for later use
          roomType.images.forEach((imageBase64, imageIndex) => {
            const file = this.base64ToFile(imageBase64, `image_${roomIndex}_${imageIndex}.png`);
            if (file) {
              // Store the file in formData
              formData.append('images', file);  // Changed from unique key to 'images'
              uploadedImageUrls.push(`uploads/image_${roomIndex}_${imageIndex}.png`); // This URL structure should match your backend URL for uploaded images
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

  // Ensure files and selectedRoomTypeIndex are valid
  if (files && this.selectedRoomTypeIndex !== null) {
    let roomType;

    // Check if we're editing an existing accommodation or adding to a new one
    if (this.isEditing && this.selectedAccommodationIndex !== null && this.accommodationDetail) {
      // Editing existing accommodation
      const accommodation = this.accommodationDetail[this.selectedAccommodationIndex];
      roomType = accommodation?.roomTypes[this.selectedRoomTypeIndex];
    } else if (this.accommodation) {
      // Adding a new room type to a new accommodation
      roomType = this.accommodation.roomTypes[this.selectedRoomTypeIndex];
    }

    // Validate roomType existence
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
  } else {
    console.error("Files or selectedRoomTypeIndex not set correctly.");
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

  // SweetAlert2 confirmation prompt
  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to save these changes to this room type?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, save it!',
  }).then((result: any) => {
    if (result.isConfirmed) {
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
            Swal.fire('Saved!', 'The room type changes have been saved.', 'success');
          },
          (error) => {
            console.error('Error saving room type:', error);
            Swal.fire('Error!', 'There was an error saving the room type.', 'error');
          }
        );
    }
  });
}





    
    
    


    logAllData(): void {
      console.log('Accommodation Detail:', this.accommodationDetail);
    }
    
    





    openLockModal(accommodationIndex: number, roomTypeIndex: number): void {
      this.selectedAccommodationIndex = accommodationIndex;
      this.selectedRoomTypeIndex = roomTypeIndex;
      console.log('testing');
      
      console.log('accomodation ', this.accommodationDetail);
      console.log('accomodation room type ', this.accommodationDetail[0].roomTypes);
    
      const roomType = this.accommodationDetail[0].roomTypes[roomTypeIndex];
      console.log('Room Type:', roomType);
    
      // Check if all rooms in the room type are locked
      if (this.isAllRoomsLocked(roomType)) {
        // Unlock all rooms in the room type
        roomType.rooms.forEach((room: any) => {
          room.isLocked = false;
          room.lockReason = ''; // Clear the lock reason
        });
        console.log('All rooms were locked. They have been unlocked.');
        return; // Exit the function, do not show the modal
      }
    
      // Show the lock modal if not all rooms are locked
      const modalElement = this.lockModal.nativeElement;
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
    
    
    lockRoomType(): void {
      if (this.selectedAccommodationIndex === null || this.selectedRoomTypeIndex === null) {
        return;
      }
    
      const reason = this.lockReason === 'Other' ? this.customReason : this.lockReason;
      if (!reason) {
        alert('Please provide a reason for locking the rooms.');
        return;
      }
    
      const roomType = this.accommodationDetail[this.selectedAccommodationIndex].roomTypes[this.selectedRoomTypeIndex];
      roomType.rooms.forEach((room: Room) => { // Define 'room' as Room type
        room.isLocked = true;
        room.lockReason = reason;
        room.status = 'locked'; // Optional: change status to indicate it's locked
      });
    
      this.servicesService.updateRoomStatus(this.accommodationDetail[this.selectedAccommodationIndex]._id, roomType)
        .subscribe(response => {
          alert('Rooms locked successfully.');
        }, error => {
          console.error('Error locking rooms:', error);
        });
    
      // Reset modal variables
      this.selectedAccommodationIndex = null;
      this.selectedRoomTypeIndex = null;
      this.lockReason = 'Maintenance';
      this.customReason = '';
    
      const modalElement = this.lockModal.nativeElement;
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    }

    openLockRoomModal(accommodationIndex: number, roomTypeIndex: number, roomIndex: number): void {
      this.selectedAccommodationIndex = accommodationIndex;
      this.selectedRoomTypeIndex = roomTypeIndex;
      this.selectedRoomIndex = roomIndex;
    
      const roomType = this.accommodationDetail[accommodationIndex].roomTypes[roomTypeIndex];
      const room = roomType.rooms[roomIndex];
    
      // Toggle lock status for the selected room
      if (room.isLocked) {
        // Unlock the room
        room.isLocked = false;
        room.lockReason = ''; // Clear the lock reason if unlocking
        console.log('Room unlocked:', room);
      } else {
        // Lock the room (show modal to provide lock reason)
        const modalElement = this.lockRoomModal.nativeElement;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }
    

    lockRoom(): void {
      if (this.selectedAccommodationIndex === null || this.selectedRoomTypeIndex === null || this.selectedRoomIndex === null) {
        return;
      }
    
      const reason = this.roomLockReason === 'Other' ? this.roomCustomReason : this.roomLockReason;
      if (!reason) {
        alert('Please provide a reason for locking the room.');
        return;
      }
    
      const room = this.accommodationDetail[this.selectedAccommodationIndex].roomTypes[this.selectedRoomTypeIndex].rooms[this.selectedRoomIndex];
      room.isLocked = true;
      room.lockReason = reason;
      room.status = 'locked';
    
      this.servicesService.updateSelectedRoomStatus(
        this.accommodationDetail[this.selectedAccommodationIndex]._id,
        this.accommodationDetail[this.selectedAccommodationIndex].roomTypes[this.selectedRoomTypeIndex]._id,
        room._id,
        room.status,
        room.isLocked,
        room.lockReason
      ).subscribe(
        response => alert('Room locked successfully.'),
        error => console.error('Error locking room:', error)
      );
    
      // Reset modal variables
      this.selectedAccommodationIndex = null;
      this.selectedRoomTypeIndex = null;
      this.selectedRoomIndex = null;
      this.roomLockReason = 'Maintenance';
      this.roomCustomReason = '';
    
      const modalElement = this.lockRoomModal.nativeElement;
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
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

removeImageService(index: number): void {
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
      this.accommodation.productImages.splice(index, 1); // Remove the image from the array
      Swal.fire('Deleted!', 'Your image has been deleted.', 'success');
    }
  });
}


isBase64Image(image: string): boolean {
  return image.startsWith('data:image/');
}





//for bookings


onCheckInDateChange(date: Date): void {
  console.log('Check-in date changed:', date);

  if (date) {
    // Set the time to noon to avoid any time zone issues
    date.setHours(12, 0, 0, 0);

    // Format the date to 'YYYY-MM-DD' without using toISOString()
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    this.bookingDetails.checkInDate = `${year}-${month}-${day}`;
    console.log('Updated Check-in date:', this.bookingDetails.checkInDate);
  } else {
    this.bookingDetails.checkInDate = '';
  }
}


loadAccommodationData(serviceId: string): void {
  this.servicesService.getAccommodationDataById(serviceId).subscribe(
    (data) => {
            // Assign accommodationId to bookingDetails
    this.bookingDetails.accommodationId = data._id;
      // Filter out 'rooms' for each room type
    // Filter out 'rooms' and 'roomTypeId' for each room type
    this.accommodationData = data.roomTypes.map((roomType: any) => ({
      name: roomType.name,
      price: roomType.price,
      amenities: roomType.amenities,
      images: roomType.images,
      roomTypeId: roomType._id,
      accommodationId: data._id,
      rooms: roomType.rooms.map((room: any) => ({
        roomId: room._id,
        number: room.number,
        status: room.status,
      })),
    }));
      console.log(this.accommodationData)
    },
    (error) => {
      console.error('Error loading accommodation details:', error);
    }
  );
}

// Fetch dates for the selected room type
loadBookedDates(): void {
  console.log('Room type selected:', this.bookingDetails.roomTypeId);
  console.log('Service ID:', this.serviceId);
if (this.serviceId && this.bookingDetails.roomTypeId) {
    this.bookingService.getBookedDates(this.serviceId, this.bookingDetails.roomTypeId).subscribe(
        (dates: string[]) => {
            this.bookedDates = dates;
            console.log('Booked dates:', this.bookedDates);
        },
        (error) => {
            console.error('Error loading booked dates:', error);
        }
    );
}
}

// Detect room type selection change to trigger date fetch
onRoomTypeChange(): void {
this.loadBookedDates(); // Fetch new dates based on selected room type
console.log('booked dates',this.bookedDates);
this.bookingDetails.checkInDate = '';
this.bookingDetails.checkOutDate = 'null';

}

isDateDisabled(date: string): boolean {
  return this.bookedDates.includes(date);
}

// Reset or adjust check-out date if check-in date changes
onDateChange(): void {
if (this.bookingDetails.checkOutDate <= this.bookingDetails.checkInDate) {
  this.bookingDetails.checkOutDate = ''; // Reset check-out date
}
}

disableBookedDates = (date: Date | null): boolean => {
if (!date) {
  return false; // Allow selection if the date is null (no date selected)
}

// Get today's date in local time
const today = new Date();
today.setHours(0, 0, 0, 0); // Set to the start of today in local time

// Set the time of the selected date to local time (start of the day)
date.setHours(0, 0, 0, 0);

// Manually format the date as 'YYYY-MM-DD' in local time
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
const day = String(date.getDate()).padStart(2, '0');
const dateString = `${year}-${month}-${day}`;

console.log('Today (local time):', today);
console.log('Selected date (local time):', dateString);

// Disable if the date is before today or if it's in the list of booked dates
return date >= today && !this.bookedDates.includes(dateString);
};


disablePastAndBookedDatesForCheckOut = (date: Date | null): boolean => {
if (!date || !this.bookingDetails.checkInDate) {
  return false;
}

// Parse and set the check-in date at midnight
const checkInDate = new Date(this.bookingDetails.checkInDate);
checkInDate.setHours(0, 0, 0, 0);
date.setHours(0, 0, 0, 0); // Set selected date to midnight for comparison

// Find the next booked date after the check-in date
const nextBookedDate = this.bookedDates
  .map(booked => new Date(booked))
  .filter(booked => booked > checkInDate)
  .sort((a, b) => a.getTime() - b.getTime())[0]; // Get the closest booked date after check-in

// Format selected date for comparison with booked dates
const dateString = this.formatDate(date);

// Calculate the day before the next booked date
let maxCheckOutDate = nextBookedDate ? new Date(nextBookedDate) : null;
if (maxCheckOutDate) {
  maxCheckOutDate.setDate(maxCheckOutDate.getDate() - 1);
}

// Ensure the selected date is:
// 1. After check-in date
// 2. Not in booked dates
// 3. Before the day before the next booked date (if it exists)
const isAfterCheckInDate = date > checkInDate;
const isNotBookedOrExceedingMax = (!this.bookedDates.includes(dateString) && 
  (!maxCheckOutDate || date <= maxCheckOutDate));

return isAfterCheckInDate && isNotBookedOrExceedingMax;
};

// Helper method to format date to 'YYYY-MM-DD'
formatDate(date: Date): string {
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
return `${year}-${month}-${day}`;
}




onCheckOutDateChange(date: Date): void {
console.log('Check-out date changed (raw):', date);

if (date) {
  // Set the time to noon to avoid time zone issues and treat the date as local
  date.setHours(12, 0, 0, 0);

  // Manually format the date to 'YYYY-MM-DD' in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');

  // Store the formatted local date string
  this.bookingDetails.checkOutDate = `${year}-${month}-${day}`;
  console.log('Updated Check-out date (local time):', this.bookingDetails.checkOutDate);
} else {
  this.bookingDetails.checkOutDate = '';
}
}



// Call this function whenever checkInDate changes
updateMinCheckOutDate() {
  if (this.bookingDetails.checkInDate) {
    this.minCheckOutDate = new Date(this.bookingDetails.checkInDate);
    this.minCheckOutDate.setDate(this.minCheckOutDate.getDate() + 1); // Set minimum to the day after check-in
  } else {
    this.minCheckOutDate = null; // Reset if checkInDate is null
  }
}




// Open the booking modal
openModal(): void {
  const modalElement = document.getElementById('bookingModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

closeModal(): void {
  const modalElement = document.getElementById('bookingModal');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal?.hide();
  }
}




// temporary commented Submit the booking form
// submitBooking(): void {
//   console.log('Booking form submitted');
//   console.log('Booking details:', this.bookingDetails);
// }

submitBooking(): void {
  const today = new Date().toISOString().split('T')[0];

  // Check if all required fields are filled
  if (!this.bookingDetails.guestName || !this.bookingDetails.accommodationType || 
      !this.bookingDetails.numberOfGuests || !this.bookingDetails.checkInDate || 
      !this.bookingDetails.checkOutDate || !this.bookingDetails.roomTypeId) {

    Swal.fire({
      icon: 'error',
      title: 'Missing Fields',
      text: 'Please fill in all the required fields.',
      confirmButtonColor: '#3085d6',
    });
    return;
  }

  // Check if check-in date is in the past
  if (this.bookingDetails.checkInDate < today) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Check-in Date',
      text: 'Check-in date cannot be in the past.',
      confirmButtonColor: '#d33',
    });
    return;
  }

  // Check if check-out date is earlier than check-in date
  if (this.bookingDetails.checkOutDate < this.bookingDetails.checkInDate) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Check-out Date',
      text: 'Check-out date cannot be earlier than the check-in date.',
      confirmButtonColor: '#d33',
    });
    return;
  }

  // Find an available room ID for the selected room type
  this.servicesService.getAvailableRoom(
    this.bookingDetails.roomTypeId,
    this.bookingDetails.checkInDate,
    this.bookingDetails.checkOutDate
  ).subscribe(
    (rooms: any[]) => {
      if (!rooms || rooms.length === 0) {  // If rooms is null or an empty array
        Swal.fire({
          icon: 'info',
          title: 'No Rooms Available',
          text: 'There are no available rooms for the selected room type.',
          confirmButtonColor: '#d33',
        });
        return;
      }
  
      // Safely check for an available room
      const availableRoom = rooms[0];
      if (availableRoom && availableRoom._id) {
        this.bookingDetails.roomId = availableRoom._id;
        console.log('Available room ID:', this.bookingDetails.roomId);
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Room is Full',
          text: 'The selected room type has no available rooms at the moment.',
          confirmButtonColor: '#3085d6',
        });
        return;
      }

      const bookingData = {
        ...this.bookingDetails,
        serviceId: this.serviceId,
        userId: this.currentUser?.userId,
      };

      // Submit the booking data
      this.bookingService.bookAccommodation(bookingData).subscribe(
        (response) => {
          console.log('Booking Response:', response); // Log the response here
          Swal.fire({
            icon: 'success',
            title: 'Booking Successful!',
            text: 'Your accommodation has been booked successfully.',
            confirmButtonColor: '#3085d6',
          });
          this.closeModal();

                // Redirect to accommodation-booking-detail page with the booking ID
                const bookingId = response.booking._id;
                // Assume response contains bookingId
    this.router.navigate([`/accommodation-booking-detail/${bookingId}`]);
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Booking Failed',
            text: 'There was an error processing your booking. Please try again.',
            confirmButtonColor: '#d33',
          });
        }
      );
    },
    (error) => {
      // Handle the 404 "No Room Available" response specifically
      if (error.status === 404) {
        Swal.fire({
          icon: 'info',
          title: 'No Room Available',
          text: 'There are no rooms available for the selected room type at this time.',
          confirmButtonColor: '#d33',
        });
      } else {
        // Handle other errors
        Swal.fire({
          icon: 'error',
          title: 'Error Finding Room',
          text: 'An error occurred while finding an available room. Please try again later.',
          confirmButtonColor: '#d33',
        });
      }
    }
  );
}



// Function to show image preview
// Function to show image preview and open the modal
get checkInDateAsDate(): Date {
  return new Date(this.bookingDetails.checkInDate);
}

// Method to check if all rooms in a room type are locked
isAllRoomsLocked(roomType: any): boolean {
  return roomType.rooms.every((room: any) => room.isLocked);
}

// accommodation-detail.component.ts
viewBookings(): void {
  if (this.serviceId) {
    this.router.navigate(['/manage-bookings', this.serviceId]);
  }
}



}