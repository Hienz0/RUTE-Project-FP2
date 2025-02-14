// restaurant.component.ts
import { Component, OnInit } from '@angular/core';
import { ServicesService } from '../services/services.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { switchMap, map } from 'rxjs/operators'; // Import necessary operators
import { forkJoin } from 'rxjs'; // Import forkJoin


@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.css']
})
export class RestaurantComponent implements OnInit {
  restaurants: any[] = [];
  currentUser: any;
  Math = Math;

  showBackToPlanningButton = false;



  constructor(private ServicesService: ServicesService, private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    this.loadRestaurants();

    this.route.queryParams.subscribe(params => {
      this.showBackToPlanningButton = !!params['planning-itinerary'];
    });
  }

  loadRestaurants(): void {
    this.ServicesService.getRestaurants().pipe(
      // Map over the restaurant data and fetch the ratings for each restaurant
      switchMap((restaurants: any[]) => {
        return forkJoin(
          restaurants.map((restaurant: any) =>
            this.ServicesService.getServiceRating(restaurant._id).pipe(
              map((ratingData: any) => ({
                ...restaurant,
                averageRating: ratingData?.averageRating ?? 0,
                reviewCount: ratingData?.reviewCount ?? 0
              }))
            )
          )
        );
      })
    ).subscribe(
      (restaurantsWithRatings: any[]) => {
        this.restaurants = restaurantsWithRatings;
      },
      (error) => {
        console.error('Error fetching restaurants', error);
      }
    );
  }
  


  
  goToDetail(id: string): void {
    const queryParams = this.route.snapshot.queryParams;
    this.router.navigate(['/restaurant-detail', id], { queryParams });
  }

    // Method to navigate to the chat page
    navigateToChat(providerId: string): void {
      this.router.navigate(['/chat'], { queryParams: { providerId } });
    }
}