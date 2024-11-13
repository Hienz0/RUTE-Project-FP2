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


  constructor(private servicesService: ServicesService, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    
    this.loadAccommodationServices();
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