import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';
import * as L from 'leaflet';


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


  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService,
    private authService: AuthService
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
