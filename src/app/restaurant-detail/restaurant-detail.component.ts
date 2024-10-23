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
    // Initialize the map after the view is initialized and the map container is available
    if (this.mapContainer) {
      this.initMap();
    }
  }

  loadRestaurantDetails(id: string): void {
    this.servicesService.getRestaurantById(id).subscribe(
      (data) => {
        this.restaurant = data;
        if (this.map && this.restaurant.businessCoordinates) {
          // Update map center with restaurant coordinates
          const { coordinates } = this.restaurant.businessCoordinates;
          this.map.setView([coordinates[1], coordinates[0]], 13);
          L.marker([coordinates[1], coordinates[0]]).addTo(this.map);
        }
      },
      (error) => {
        console.error('Error fetching restaurant details', error);
      }
    );
  }

  initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView([-8.5069, 115.2624], 13); // Default view
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  
    this.map.on('load', () => {
      console.log('Map loaded successfully');
    });
  
    // Ensure the map resizes correctly after initialization
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 0);
  }
  
}
