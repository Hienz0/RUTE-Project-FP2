import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ManageService } from '../services/manage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-manage-services',
  templateUrl: './manage-services.component.html',
  styleUrls: ['./manage-services.component.css']
})
export class ManageServicesComponent implements OnInit {
  services: any[] = [];

  newServiceName: string = '';
  newServiceDescription: string = '';
  newServicePrice: number = 0;
  newServiceImages: File[] = []; // To hold new images as File objects
  existingServiceImages: string[] = []; // To hold existing images as paths
  imagesToRemove: string[] = []; // To track images that are marked for removal
  newServiceCategory: string = '';
  newServiceSubcategory: string = '';
  selectedServiceIndex: number = -1;
  errorMessage: string = '';
  newServiceLocation: string = '';
  newServiceBusinessLicense: File | null = null;
  imagePreviews: string[] = [];

  currentUser: any;

  categories: string[] = ['Accommodation', 'Transportation', 'Tour Guide', 'Restaurant'];
  subcategoryMap: any = {
    'Accommodation': ['Villas', 'Guest Houses', 'Homestays', 'Hostels'],
    'Transportation': ['Motorbikes', 'Cars', 'Bicycles'],
  };

  constructor(private manageService: ManageService, private authService: AuthService, private snackBar: MatSnackBar,     private router: Router ) {}

  ngOnInit() {
    this.loadServices();
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadServices() {
    this.manageService.getServices().subscribe(
      (data) => {
        console.log('Backend response:', data); // Log backend response
        this.services = data.filter(service => service.status === 'accepted'); // Ensure only 'accepted' services are loaded
        this.services.forEach((service, index) => {
          this.fetchImagesForService(service, index);
        });
      },
      (error) => {
        console.error('Failed to load services:', error);
      }
    );
  }

  fetchImagesForService(service: any, index: number): void {
    // Assuming each service has a property 'productImages' which contains image paths
    service.imagePreviews = []; // Initialize image previews array for each service
  
    // Fetch images for the service
    service.productImages.forEach((imagePath: string) => {
      const fullImagePath = this.getFullImagePath(imagePath); // Convert image path to full URL
      service.imagePreviews.push(fullImagePath); // Add full image path to image previews array
    });
  }

  showNotification(message: string, action: string = 'Close', duration: number = 3000) {
    this.snackBar.open(message, action, {
      duration: duration,
      verticalPosition: 'top'
    });
  }

  addService() {
    this.errorMessage = '';
    if (this.isFormValid()) {
      const formData = new FormData();
      formData.append('productName', this.newServiceName);
      formData.append('productDescription', this.newServiceDescription);
      formData.append('productPrice', this.newServicePrice.toString());
      formData.append('productCategory', this.newServiceCategory);
      formData.append('productSubcategory', this.shouldDisplaySubcategoryDropdown() ? this.newServiceSubcategory : '');
      formData.append('location', this.newServiceLocation);
      formData.append('status', 'pending'); // Add default status 'pending'

      this.newServiceImages.forEach((image, index) => {
        formData.append(`productImages`, image, image.name);
      });

      if (this.newServiceBusinessLicense) {
        formData.append('businessLicense', this.newServiceBusinessLicense, this.newServiceBusinessLicense.name);
      }

      this.manageService.addService(formData).subscribe(
        (data) => {
          // this.services.push(data);
          this.clearFormFields();
          this.showNotification('Service added successfully, waiting for approval');
          this.resetForm();
        },
        (error) => {
          console.error('Failed to add service:', error);
          this.showNotification('Failed to add service', 'Close', 5000);
        }
      );
    }
  }

  updateService() {
    this.errorMessage = '';
    if (this.selectedServiceIndex !== -1 && this.updateFormValid()) {
      const formData = new FormData();
      formData.append('productName', this.newServiceName);
      formData.append('productDescription', this.newServiceDescription);
      formData.append('productPrice', this.newServicePrice.toString());

      // Append existing product images as paths
      this.existingServiceImages.forEach((imagePath) => {
        formData.append('existingProductImages', imagePath);
      });

      // Append new product images as File objects
      this.newServiceImages.forEach((image, index) => {
        if (image instanceof File) {
          formData.append('productImages', image, image.name);
        } else {
          console.error('Invalid image file:', image);
        }
      });

      // Append removed image URLs
      this.imagesToRemove.forEach((imageUrl) => {
        formData.append('imagesToRemove', imageUrl);
      });

      if (this.newServiceBusinessLicense instanceof File) {
        formData.append('businessLicense', this.newServiceBusinessLicense, this.newServiceBusinessLicense.name);
      }

      const serviceId = this.services[this.selectedServiceIndex]._id;

      this.manageService.updateService(serviceId, formData).subscribe(
        (data) => {
          this.fetchImagesForService(this.services[this.selectedServiceIndex], this.selectedServiceIndex);
          this.services[this.selectedServiceIndex] = data;
          this.clearFormFields();
          this.selectedServiceIndex = -1;
          this.showNotification('Service updated successfully');
          this.loadServices(); 
        },
        (error) => {
          console.error('Failed to update service:', error);
          this.showNotification('Failed to update service', 'Close', 5000);
        }
      );
    }
  }

  deleteService(index: number) {
    const serviceId = this.services[index]._id;

    this.manageService.deleteService(serviceId).subscribe(
      () => {
        this.services.splice(index, 1);
        this.showNotification('Service deleted successfully');
      },
      (error) => {
        console.error('Failed to delete service:', error);
      }
    );
  }

  isFormValid(): boolean {
    if (
      !this.newServiceName ||
      !this.newServiceDescription ||
      this.newServicePrice <= 0 ||
      this.newServiceImages.length < 3 ||
      !this.newServiceCategory ||
      (this.shouldDisplaySubcategoryDropdown() && !this.newServiceSubcategory)
    ) {
      this.errorMessage =
        'Please fill all fields, add at least 3 images, and select both a category and a subcategory if required.';
      return false;
    }
    this.errorMessage = '';
    return true;
  }

  updateFormValid(): boolean {
    const totalImages = this.existingServiceImages.length + this.imagePreviews.length;
    if (
      !this.newServiceName ||
      !this.newServiceDescription ||
      this.newServicePrice <= 0 ||
      totalImages < 3
    ) {
      this.errorMessage =
        'Please fill all fields, add at least 3 images if required.';
      return false;
    }
    this.errorMessage = '';
    return true;
  }

  shouldDisplaySubcategoryDropdown(): boolean {
    const categoriesWithSubcategory = ['Accommodation', 'Transportation'];
    return categoriesWithSubcategory.includes(this.newServiceCategory);
  }

  clearFormFields() {
    this.newServiceName = '';
    this.newServiceDescription = '';
    this.newServicePrice = 0;
    this.newServiceImages = [];
    this.existingServiceImages = [];
    this.newServiceCategory = '';
    this.newServiceSubcategory = '';
    this.newServiceBusinessLicense = null;
    this.newServiceLocation = '';
    this.newServiceBusinessLicense = null;
    this.imagePreviews = [];
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length) {
      for (let i = 0; i < files.length; i++) {
        this.newServiceImages.push(files[i]);
        // Directly use the file URL for preview purposes only
        const fileUrl = URL.createObjectURL(files[i]);
        this.imagePreviews.push(fileUrl); // Correctly push the URL for preview
        console.log('test', fileUrl);
      }
    }
  }

  readAndPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviews.push(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  removeImage(index: number, isExisting: boolean = false) {
    console.log('Index before removal:', index);
    
    if (isExisting) {
        console.log('Removing an existing image');
        console.log('Length of existingServiceImages before removal:', this.existingServiceImages.length);
        console.log('Existing images:', this.existingServiceImages);
        
        if (index > -1 && index < this.existingServiceImages.length) {
            // Mark the image URL for removal
            const removedImageUrl = this.existingServiceImages[index];
            this.imagesToRemove.push(removedImageUrl);
            console.log('Images marked for removal:', this.imagesToRemove);

            // Remove the image from the existing images array
            this.existingServiceImages.splice(index, 1);
            console.log('Image removed successfully');
        } else {
            console.log('Invalid index or out of bounds');
        }
    } else {
        console.log('Removing a new image preview');
        console.log('Length of imagePreviews before removal:', this.imagePreviews.length);
        console.log('New image previews:', this.imagePreviews);
        
        if (index > -1 && index < this.imagePreviews.length) {
            // Remove the image from the new image previews array
            this.imagePreviews.splice(index, 1);
            console.log('New image preview removed successfully');
        } else {
            console.log('Invalid index or out of bounds');
        }
    }
    
    console.log('Current existing images:', this.existingServiceImages);
    console.log('Current new image previews:', this.imagePreviews);
}

  

  removeImageAdd(index: number) {
    console.log('Index before removal:', index);
    console.log('Length of newServiceImages before removal:', this.newServiceImages.length);
    if (index > -1 && index < this.newServiceImages.length) {
      this.newServiceImages.splice(index, 1);
      this.imagePreviews.splice(index, 1);
      this.existingServiceImages.splice(index, 1);

      console.log('Image removed successfully');
    } else {
      console.log('Invalid index or out of bounds');
    }
  }

  onLicenseSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newServiceBusinessLicense = file;
    }
  }

  openEditModal(index: number) {
    this.selectedServiceIndex = index;
    const selectedService = this.services[index];
    this.fetchImagesForService(selectedService, index);
    // this.imagePreviews = selectedService.imagePreviews || [];

    this.newServiceName = selectedService.productName;
    this.newServiceDescription = selectedService.productDescription;
    this.newServicePrice = selectedService.productPrice;
    // this.newServiceImages = []; // Clear new images array for new uploads
    this.existingServiceImages = selectedService.productImages.slice(); // Store existing images
    this.newServiceCategory = selectedService.productCategory;
    this.newServiceSubcategory = selectedService.productSubcategory;
    this.newServiceBusinessLicense = selectedService.businessLicense;
    this.newServiceLocation = selectedService.location;
  }

  resetForm() {
    this.newServiceName = '';
    this.newServiceDescription = '';
    this.newServicePrice = 0;
    this.newServiceImages = [];
    this.existingServiceImages = [];
    this.newServiceCategory = '';
    this.newServiceSubcategory = ''
    this.existingServiceImages = [];
    this.imagePreviews = [];
    this.newServiceLocation = '';
    this.newServiceBusinessLicense = null;
  }

  confirmDelete(index: number) {
    const confirmation = window.confirm('Are you sure you want to delete this service?');
    if (confirmation) {
      this.deleteService(index);
    }
  }

  getFullImagePath(imagePath: string): string {
    // Check if the imagePath already contains the base URL
    if (imagePath.startsWith('http://localhost:3000/')) {
      return imagePath; // Return imagePath as is
    } else {
      // Append the base URL to the imagePath
      return `http://localhost:3000/${imagePath}`;
    }
  }

    // Method to navigate to manage-accommodation route if the productCategory is Accommodation
    navigateToService(service: any) {
      console.log(service);
      if (service.productCategory === 'Accommodation') {
        this.router.navigate([`/manage-accommodation/${service._id}`]);
      }
      else if (service.productCategory === 'Tour Guide') {
        this.router.navigate([`/manage-tour/${service._id}`]);
      }
    }
}