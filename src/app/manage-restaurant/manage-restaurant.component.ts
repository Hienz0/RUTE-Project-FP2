import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as L from 'leaflet';



declare const Swal: any;
declare var bootstrap: any;

const BASE_URL = 'http://localhost:3000';

interface Restaurant {
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  productImages: string[];
  businessCoordinates?: { type: string; coordinates: [number, number] };
}

@Component({
  selector: 'app-manage-restaurant',
  templateUrl: './manage-restaurant.component.html',
  styleUrls: ['./manage-restaurant.component.css']
})
export class ManageRestaurantComponent implements OnInit, AfterViewInit{


  originalRestaurantDetail: Restaurant[] = [];
  isEditing: boolean = false; // To toggle edit mode

  restaurant: Restaurant = {
    name: '',
    description: '',
    imageUrl: '',
    location: '',
    productImages: [],
    businessCoordinates: {
      type: 'Point',
      coordinates: [0, 0], // Default coordinates (longitude, latitude)
    },
  };

  restaurantMenu = {
    name: '',
    image: null as string | null,
    file: null as string | null,  // New property for handling both images and PDFs
  };
  

  menuItems: Array<{ name: string; file: string | null }> = [];
  selectedItem: any = null;
  map: any; // Add this to your component class



  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const serviceId = this.route.snapshot.paramMap.get('serviceId');
    console.log('Service ID:', serviceId); // Log the serviceId
    
    if (serviceId) {
      this.servicesService.getRestaurantById(serviceId).subscribe((data) => {
        this.restaurant = {
          name: data.productName,
          description: data.productDescription,
          imageUrl: data.productImages[0] || '',
          location: data.location,
          productImages: data.productImages || [],
          businessCoordinates: data.businessCoordinates,
        };
      });

      this.servicesService.getRestaurantMenu(serviceId).subscribe(
        (menuData) => {
          console.log('Received menu data:', menuData);
          // Ensure menuData contains a valid array for menuFiles
          if (menuData && Array.isArray(menuData.menuFiles)) {
            this.menuItems = menuData.menuFiles.map((file: { fileName: string; fileUrl: string }) => ({
              name: file.fileName,
              file: file.fileUrl,
            }));
          } else {
            console.warn('menuFiles is not an array or is undefined');
            this.menuItems = []; // Clear items if the data format is incorrect
          }
        },
        (error) => {
          console.error('Error fetching menu data:', error);
        }
      );
      
    }
  
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit called');
    if (this.isEditing) {
      this.initializeMap();
    }
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
    const businessCoordinates = this.restaurant?.businessCoordinates;
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
      if (this.restaurant?.businessCoordinates) {
        this.restaurant.businessCoordinates.coordinates = [lng, lat]; // GeoJSON format requires [lng, lat]
        console.log('Updated coordinates:', this.restaurant.businessCoordinates.coordinates);
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
  

  isBase64Image(image: string): boolean {
    return image.startsWith('data:image/');
  }

  toggleEdit(): void {
    if (this.isEditing) {
      // Revert to original data if canceling
      this.restaurant = this.originalRestaurantDetail
        ? JSON.parse(JSON.stringify(this.originalRestaurantDetail))
        : this.restaurant;
    } else {
      // Enter edit mode
      this.originalRestaurantDetail = JSON.parse(JSON.stringify(this.restaurant));
    }
    this.isEditing = !this.isEditing;
    console.log('isEditing:', this.isEditing);
    console.log('restaurant', this.restaurant);
        // Initialize the map if entering edit mode
        if (this.isEditing && !this.map) {
          setTimeout(() => this.initializeMap(), 0); // Delay map initialization
        }
  }


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
            this.restaurant.productImages.push(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }

      removeImageService(index: number) {
        this.restaurant.productImages.splice(index, 1);
      }
      
      saveRestaurant() {
        const serviceId = this.route.snapshot.paramMap.get('serviceId');
        if (serviceId) {

          const restaurantData = {
            productName: this.restaurant.name, // Map to productName
            productDescription: this.restaurant.description, // Map to productDescription
            productImages: this.restaurant.productImages, // Map to productImages
            location: this.restaurant.location // Map to location
          };
      
          // Call the update service function
          this.servicesService.updateRestaurantService(serviceId, restaurantData).subscribe(
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
      
  dummyFunction(){
    
  }


  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.restaurantMenu.image = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true; // Set dragging state
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false; // Reset dragging state
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false; // Reset dragging state

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.restaurantMenu.image = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  addMenuItem(): void {
    if (this.restaurantMenu.name && this.restaurantMenu.file) {
      // Add the new item to the menu items array
      this.menuItems.push({ name: this.restaurantMenu.name, file: this.restaurantMenu.file });
  
      // Reset form after adding item
      this.restaurantMenu = { name: '', image: null, file: null };
  
      console.log('Menu items:', this.menuItems);
    } else {
      // Show SweetAlert2 error when fields are incomplete
      Swal.fire({
        title: 'Error!',
        text: 'Please complete all fields.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK',
      });
    }
  }
  

  triggerFileInput(): void {
    const fileInput = document.getElementById('menuItemImage') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.restaurantMenu.file = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
// Check if file is an image
// fileIsImage(file: string | null): boolean {
//   return !!file && (/\.(jpg|jpeg|png|gif|svg)$/i.test(file) || file.startsWith('data:image'));
// }

// fileIsPDF(file: string | null): boolean {
//   return !!file && (/\.pdf$/i.test(file) || file.startsWith('data:application/pdf'));
// }

// Define a base URL for assets that are not base64-encoded

fileIsImage(file: string | null): boolean {
  return !!file && (/\.(jpg|jpeg|png|gif|svg)$/i.test(file) || file.startsWith('data:image'));
}

fileIsPDF(file: string | null): boolean {
  return !!file && (/\.pdf$/i.test(file) || file.startsWith('data:application/pdf'));
}

// Function to fetch the correct URL for non-base64 images or PDFs
getFileUrl(file: string | null): string | null {
  if (!file) return null;
  // Check if the file is base64 or a URL
  if (file.startsWith('data:')) {
    return file; // Return the base64 string directly
  } else {
    return `${BASE_URL}${file}`; // Prepend the base URL for non-base64 files
  }
}


publishMenu(): void {
  const serviceId = this.route.snapshot.paramMap.get('serviceId') || '';

  // SweetAlert2 confirmation prompt
  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to publish the menu?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, publish it!',
  }).then((result: any) => {
    if (result.isConfirmed) {
      // Check if there are any items in the menuItems array
      if (this.menuItems.length > 0) {
        const formData = new FormData();

        // Loop through each menu item and append to FormData
        this.menuItems.forEach((menuItem, index) => {
          if (menuItem.file && menuItem.name) {
            // Check if the file is base64 (image or PDF)
            if (menuItem.file.startsWith('data:image') || menuItem.file.startsWith('data:application/pdf')) {
              // Convert base64-encoded files to Blob
              const fileBlob = this.dataURLtoBlob(menuItem.file);
              if (fileBlob) {
                const fileName = `${menuItem.name}.${fileBlob.type.split('/')[1]}`;
                formData.append(`file${index}`, fileBlob, fileName);
                formData.append(`name${index}`, menuItem.name);
              } else {
                console.error(`Invalid base64 data for menu item ${index + 1}.`);
              }
            } else {
              // Append non-base64 URLs directly
              formData.append(`fileUrl${index}`, menuItem.file);
              formData.append(`name${index}`, menuItem.name);
            }
          } else {
            console.error(`Menu item ${index + 1} is missing file or name.`);
          }
        });

        // Append serviceId
        formData.append('serviceId', serviceId);

        // Log FormData contents
        formData.forEach((value, key) => {
          console.log(`${key}:`, value);
        });

        // Call the service to upload the menu items
        this.servicesService.uploadMenu(formData).subscribe(
          (response) => {
            console.log('Menus published successfully:', response);
            // Show SweetAlert2 success message
            Swal.fire({
              title: 'Published!',
              text: 'The menu has been published successfully.',
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'OK',
            });
          },
          (error) => {
            console.error('Error uploading menus:', error);
          }
        );
      } else {
        console.error('No menu items to publish.');
      }
    }
  });
}



  

  dataURLtoBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  removeMenuItem(index: number): void {
    // SweetAlert2 confirmation prompt
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this menu item?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!',
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Remove the item at the given index after confirmation
        this.menuItems.splice(index, 1);
        console.log(this.menuItems);
        Swal.fire('Removed!', 'The menu item has been removed.', 'success');
      }
    });
  }
  
  
  // In your component class
trackByIndex(index: number, item: any): number {
  return index; // Use index as unique identifier
}

openPreviewModal(item: any) {
  // Check if `item.file` is null or undefined, and handle it accordingly
  const fileUrl = item.file ? this.getFileUrl(item.file) : null;

  // Determine if the file is an image or PDF and set the sanitized URL if it's not an image
  this.selectedItem = {
    ...item,
    isImage: this.fileIsImage(item.file),
    fileUrl: item.isImage ? fileUrl : fileUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl) : null
  };

  console.log(this.selectedItem);

  // Open the modal using Bootstrap's modal API
  const modalElement = document.getElementById('imagePreviewModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

  // Public method to sanitize URLs for the template
  // Public method to sanitize URLs for the template, with null handling
  sanitizeUrl(url: string | null): SafeResourceUrl | null {
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  }


}