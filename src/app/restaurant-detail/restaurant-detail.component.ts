import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BookingService } from '../services/booking.service';
import * as L from 'leaflet';
import Panzoom from '@panzoom/panzoom';

// Declare Swal globally
declare var Swal: any;
declare var bootstrap: any;

const BASE_URL = 'http://localhost:3000';


@Component({
  selector: 'app-restaurant-detail',
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css']
})
export class RestaurantDetailComponent implements OnInit, AfterViewInit {
  serviceId: string | null = null;

  restaurant: any;
  restaurantId: string | null = null;
  currentUser: any;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map: L.Map | undefined;
  menuItems: any[] = [];
  isZoomed: boolean = false;

  selectedItem: any = null;
  @ViewChild('imagePreview') imagePreview!: ElementRef;
  panzoomInstance: any;


  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('id');

    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    this.restaurantId = this.route.snapshot.paramMap.get('id');
    if (this.restaurantId) {
      this.loadRestaurantDetails(this.restaurantId);
    }
  }

ngAfterViewInit(): void {
  console.log('ngAfterViewInit called');
  if (this.mapContainer) {
    console.log('Map container available');
    this.initMap();
  } else {
    console.error('Map container not available');
  }

  if (this.imagePreview) {
    this.panzoomInstance = Panzoom(this.imagePreview.nativeElement, {
      maxScale: 3, // Maximum zoom level
      minScale: 1, // Minimum zoom level
      contain: 'outside', // Keeps the image contained within the container
      startScale: 1, // Initial scale when the modal opens
    });

    // Enable mouse wheel zoom
    this.imagePreview.nativeElement.parentElement.addEventListener('wheel', this.panzoomInstance.zoomWithWheel);
  }
}

showMenu(): void {
  const serviceId = this.route.snapshot.paramMap.get('id');
  if (serviceId) {
    this.servicesService.getRestaurantMenu(serviceId).subscribe(
      (data) => {
        this.menuItems = data.menuFiles.map((item: { fileName: string; fileUrl: string; uploadedAt: Date }) => ({
          ...item,
          fileUrl: item.fileUrl.startsWith('http://localhost:3000')
            ? item.fileUrl
            : `http://localhost:3000${item.fileUrl}`
        }));
        
        this.openModal();
        console.log(this.menuItems)
      },
      (error) => {
        console.error('Error fetching menu:', error);
      }
    );
  } else {
    console.error('Service ID is null');
  }
}



openModal(): void {
  const modalElement = document.getElementById('menuModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

openPreviewModal(item: { fileName: string; fileUrl: string; isImage: boolean }) {
  // Sanitize file URL and ensure it's of SafeResourceUrl type
  const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(item.fileUrl || '');
  this.selectedItem = {
    ...item,
    fileUrl: sanitizedUrl // now guaranteed to be SafeResourceUrl
  };
  
  const previewModal = new bootstrap.Modal(
    document.getElementById('imagePreviewModal')
  );
  previewModal.show();
}

viewMenuItem(item: any) {
  // Check if `item.fileUrl` is null or undefined, and handle it accordingly
  const fileUrl = item.fileUrl ? this.getFileUrl(item.fileUrl) : null;

  // Determine if the file is an image or PDF and set the sanitized URL if it's not an image
  this.selectedItem = {
    ...item,
    isImage: this.fileIsImage(item.fileUrl),
    fileUrl: item.isImage ? fileUrl : fileUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl) : null
  };

  console.log('selected item: ', this.selectedItem);

  // Close the menu modal if it's open, then open the preview modal
  this.closeMenuModal();

  const modalElement = document.getElementById('imagePreviewModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}




closeModal() {
  this.selectedItem = null;
  const menuModal = document.getElementById('menuModal');
  const previewModal = document.getElementById('imagePreviewModal');
  if (menuModal) {
    new bootstrap.Modal(menuModal).hide();
  }
  if (previewModal) {
    new bootstrap.Modal(previewModal).hide();
  }

  if (this.panzoomInstance) {
    this.panzoomInstance.destroy();
  }
}

closeMenuModal(): void {
  const modalElement = document.getElementById('menuModal');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal?.hide();
  }
  
  this.isZoomed = false;
}


loadRestaurantDetails(id: string): void {
  this.servicesService.getRestaurantById(id).subscribe(
    (data) => {
      this.restaurant = data;
      console.log(this.restaurant);
      if (this.map && this.restaurant.businessCoordinates) {
        // Update map center with restaurant coordinates
        const { coordinates } = this.restaurant.businessCoordinates;
        this.map.setView([coordinates[1], coordinates[0]], 16); // Center on restaurant with zoom level 16
        L.marker([coordinates[1], coordinates[0]]).addTo(this.map); // Add a marker to the restaurant location
      }
    },
    (error) => {
      console.error('Error fetching restaurant details', error);
    }
  );
}

addToItinerary(): void {
  const bookingDetails = {
    productName: this.restaurant.productName,
    serviceId: this.restaurant._id,
    userId: this.currentUser.userId,
    bookingStatus: 'pending'
  };

  this.bookingService.addBookingToItinerary(bookingDetails).subscribe(
    (response) => {
      console.log('Booking added to itinerary successfully', response);
    },
    (error) => {
      console.error('Error adding booking to itinerary', error);
    }
  );
}


  initMap(): void {
    console.log('map called');
    // Initialize the map with placeholder coordinates
    this.map = L.map(this.mapContainer.nativeElement).setView([-8.5069, 115.2624], 13); // Placeholder or default location
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    
    // Ensure the map resizes correctly after initialization
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }
  fileIsImage(file: string | null): boolean {
    return !!file && (/\.(jpg|jpeg|png|gif|svg)$/i.test(file) || file.startsWith('data:image'));
  }
  
  fileIsPDF(file: string | null): boolean {
    return !!file && (/\.pdf$/i.test(file) || file.startsWith('data:application/pdf'));
  }
  
  // Function to fetch the correct URL for non-base64 images or PDFs
  getFileUrl(file: string | null): string | null {
    if (!file) return null;
    if (file.startsWith('data:') || file.startsWith('http://')) {
      return file; // Return base64 or complete URL directly
    } else {
      return `${BASE_URL}${file}`; // Prepend only for relative paths
    }
  }
  

toggleZoom() {
  this.isZoomed = !this.isZoomed;
}

  // Reset zoom when clicking outside the image
  onModalClick(event: MouseEvent) {
    const modalContent = event.target as HTMLElement;

    // If the click is outside the image (and on the backdrop or modal), reset zoom
    if (!modalContent.closest('img')) {
      this.isZoomed = false; // Reset zoom state
    }
  }

  // Handle image click separately (don't trigger zoom toggle)
  onImageClick(event: MouseEvent) {
    event.stopPropagation(); // Prevent click from propagating to the modal backdrop
  }

  navigateToChat(): void {
    if (this.serviceId) {
      this.router.navigate(['/chat'], { queryParams: { providerId: this.serviceId } });
    } else {
      console.error('Service ID is not available.');
    }
  }
  
}