import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';

declare const Swal: any;
declare var bootstrap: any;

interface Restaurant {
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  productImages: string[];
}

@Component({
  selector: 'app-manage-restaurant',
  templateUrl: './manage-restaurant.component.html',
  styleUrls: ['./manage-restaurant.component.css']
})
export class ManageRestaurantComponent {

  originalRestaurantDetail: Restaurant[] = [];
  isEditing: boolean = false; // To toggle edit mode

  restaurant: Restaurant = {
    name: '',
    description: '',
    imageUrl: '',
    location: '',
    productImages: [],
  };

  restaurantMenu = {
    name: '',
    image: null as string | null,
    file: null as string | null,  // New property for handling both images and PDFs
  };

  menuItems: Array<{ name: string; file: string | null }> = [];


  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService
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
        };
      });
    }
  
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
    } else {
      console.error('Please complete all fields.');
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
  
  fileIsImage(file: string | null): boolean {
    return !!file && file.startsWith('data:image/');
  }

  fileIsPDF(file: string | null): boolean {
    return !!file && file.startsWith('data:application/pdf');
  }
  
  

}