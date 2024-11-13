// restaurant.component.ts
import { Component, OnInit } from '@angular/core';
import { ServicesService } from '../services/services.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.css']
})
export class RestaurantComponent implements OnInit {
  restaurants: any[] = [];
  currentUser: any;


  constructor(private ServicesService: ServicesService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.ServicesService.getRestaurants().subscribe(
      (data) => {
        this.restaurants = data;
      },
      (error) => {
        console.error('Error fetching restaurants', error);
      }
    );
  }

  goToDetail(restaurantId: string): void {
    this.router.navigate(['/restaurant-detail', restaurantId]);
  }
}