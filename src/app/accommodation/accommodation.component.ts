import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';
import { switchMap, map } from 'rxjs/operators'; // Import necessary operators
import { forkJoin } from 'rxjs'; // Import forkJoin


@Component({
  selector: 'app-accommodation',
  templateUrl: './accommodation.component.html',
  styleUrls: ['./accommodation.component.css'],
})
export class AccommodationComponent implements OnInit {
  accommodationServices: any[] = [];
  currentUser: any;
  Math = Math;
  isDayTime: boolean = true;
  frameStyle: any;
  weatherCondition: string = 'rainy';


  constructor(private servicesService: ServicesService, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    
     // Check if it's day or night
     this.setDayNight();
      // Set the background style for the frame
    this.setFrameBackground();
    this.loadAccommodationServices();
  }

    // Method to check if it's day or night based on current time
    setDayNight(): void {
// Daytime is between 6 AM and 6 PM
const currentHour = new Date().getHours();
this.isDayTime = currentHour >= 6 && currentHour < 18; 
    }

    setFrameBackground(): void {
      if (this.isDayTime) {
        // Set the sky to blue during the day
        this.frameStyle = {
          backgroundImage: 'linear-gradient(to top, #3a8dff, #61a6f9, #a2c8f9, #e0f3ff)', 


        };
      } else {
        // Set the background to night-like colors
        this.frameStyle = {
          backgroundImage: 'linear-gradient(to top, #40334f, #2f273c, #272232, #201c29)', // Night gradient
        };
      }
    }
  

  loadAccommodationServices(): void {
    this.servicesService.getAccommodationServices().pipe(
      // Map over the services data and fetch the ratings for each service
      switchMap((services: any[]) => {
        return forkJoin(
          services.map((service: any) => 
            this.servicesService.getServiceRating(service._id).pipe(
              map((ratingData: any) => ({
                ...service,
                averageRating: ratingData?.averageRating ?? 0,
                reviewCount: ratingData?.reviewCount ?? 0
              }))
            )
          )
        );
      })
    ).subscribe(
      (accommodationServices: any[]) => {
        this.accommodationServices = accommodationServices;
      },
      (error) => {
        console.error('Error fetching accommodation services', error);
      }
    );
  }

  getStarIcons(rating: number): string[] {
    const filledStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - filledStars - halfStar;
    return [
      ...Array(filledStars).fill('★'),
      ...Array(halfStar).fill('☆'),
      ...Array(emptyStars).fill('✩')
    ];
  }

  

  // Navigate to the details page when a service is clicked
  goToDetail(id: string): void {
    this.router.navigate(['/accommodation', id]);
  }
}