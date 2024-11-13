import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesService } from '../services/services.service';


declare const Swal: any;
declare var bootstrap: any;


interface TourGuide {
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  productImages: string[];
  productPrice: number;
}

@Component({
  selector: 'app-manage-tour',
  templateUrl: './manage-tour.component.html',
  styleUrls: ['./manage-tour.component.css']
})
export class ManageTourComponent implements OnInit {
  originalTourGuideDetail: TourGuide[] = [];
  isEditing: boolean = false; // To toggle edit mode
  serviceId: string | null = null;


  tourGuide: TourGuide = {
    name: '',
    description: '',
    imageUrl: '',
    location: '',
    productImages: [],
    productPrice: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('serviceId');
    console.log('Service ID:', this.serviceId); // Log the serviceId
    
    if (this.serviceId) {
      this.servicesService.getTourGuideServiceById(this.serviceId).subscribe((data) => {
        this.tourGuide = {
          name: data.productName,
          description: data.productDescription,
          imageUrl: data.productImages[0] || '',
          location: data.location,
          productImages: data.productImages || [],
          productPrice: data.productPrice,
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
      this.tourGuide = this.originalTourGuideDetail
        ? JSON.parse(JSON.stringify(this.originalTourGuideDetail))
        : this.tourGuide;
    } else {
      // Enter edit mode
      this.originalTourGuideDetail = JSON.parse(JSON.stringify(this.tourGuide));
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
            this.tourGuide.productImages.push(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }

      removeImageService(index: number) {
        this.tourGuide.productImages.splice(index, 1);
      }
      
      saveTourGuide() {
        const serviceId = this.route.snapshot.paramMap.get('serviceId');
        if (serviceId) {

          const tourGuideData = {
            productName: this.tourGuide.name, // Map to productName
            productDescription: this.tourGuide.description, // Map to productDescription
            productPrice: this.tourGuide.productPrice, 
            productImages: this.tourGuide.productImages, // Map to productImages
            location: this.tourGuide.location // Map to location
          };
      
          // Call the update service function
          this.servicesService.updateTourGuideService(serviceId, tourGuideData).subscribe(
            (response) => {
              console.log('Update response:', response); // Log the response from the server
              Swal.fire({
                icon: 'success',
                title: 'Changes Successful!',
                text: 'Your tour or guide has been Updated successfully.',
                confirmButtonColor: '#3085d6',
              });
              this.isEditing = false; // Close editing mode
              // Optionally display a success message
            },
            (error) => {
              console.error('Update error:', error); // Log any errors
              Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'There was an error processing your Update. Nice try again.',
                confirmButtonColor: '#d33',
              });
            }
          );
        }
      }

      viewBookings(): void {
        if (this.serviceId) {
          this.router.navigate(['/manage-bookings', this.serviceId]);
        }
      }
      
  


}
