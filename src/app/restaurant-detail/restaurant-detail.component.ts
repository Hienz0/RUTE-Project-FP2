import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as L from 'leaflet';

// Declare Swal globally
declare var Swal: any;
declare var bootstrap: any;

@Component({
  selector: 'app-restaurant-detail',
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.css']
})
export class RestaurantDetailComponent implements OnInit, AfterViewInit {
  restaurant: any;
  restaurantId: string | null = null;
  currentUser: any;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map: L.Map | undefined;
  menuItems: any[] = [];
  selectedItem: { fileName: string; fileUrl: SafeResourceUrl; isImage: boolean } | null = null;


  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
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
}

closeMenuModal(): void {
  const modalElement = document.getElementById('menuModal');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal?.hide();
  }
}


loadRestaurantDetails(id: string): void {
  this.servicesService.getRestaurantById(id).subscribe(
    (data) => {
      this.restaurant = data;
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
  
  
}
