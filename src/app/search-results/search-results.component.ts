import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { switchMap, map } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { ServicesService } from '../services/services.service';


@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {
  searchTerm!: string;
  searchResults: any[] = [];
  currentUser: any;
  Math = Math;



  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private ServicesService: ServicesService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['searchTerm'] || '';
      if (this.searchTerm) {
        console.log('search term 2" ', this.searchTerm);
        this.performSearch();
      }
    });

    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  performSearch(): void {
    const category = this.route.snapshot.queryParamMap.get('category');
    const categoryParam = category !== null ? category : undefined; // Convert null to undefined
    console.log('search category: ', category);
  
    this.authService.searchServices(this.searchTerm, categoryParam).pipe(
      // Use switchMap to transform the results into a list of observables for ratings
      switchMap((results: any[]) => {
        // If no results, return an empty observable array
        if (!results || results.length === 0) {
          return of([]); 
        }
  
        return forkJoin(
          results.map((result: any) =>
            this.ServicesService.getServiceRating(result._id).pipe(
              map((ratingData: any) => ({
                ...result,
                averageRating: ratingData?.averageRating ?? 0,
                reviewCount: ratingData?.reviewCount ?? 0
              }))
            )
          )
        );
      })
    ).subscribe(
      (resultsWithRatings: any[]) => {
        this.searchResults = resultsWithRatings;
        console.log('search results with ratings: ', this.searchResults);
      },
      (error) => {
        console.error('Error fetching search results', error);
      }
    );
  }
  

  redirectToAccommodation(serviceId: string, category: string): void {
    if (category === 'Accommodation') {
      // If category is 'accommodation', navigate to /accommodation/{serviceId}
      this.router.navigate([`/accommodation/${serviceId}`]);
    } else if (category === 'Restaurant') {
      // If category is 'restaurant', navigate to /restaurant/{serviceId}
      this.router.navigate([`/restaurant-detail/${serviceId}`]);
    }

    else if (category === 'Transportation') {
      // If category is 'restaurant', navigate to /restaurant/{serviceId}
      this.router.navigate([`/transportationDetail/${serviceId}`]);
    }

    else if (category === 'Tour Guide') {
      // If category is 'restaurant', navigate to /restaurant/{serviceId}
      this.router.navigate([`/tour-guide/${serviceId}`]);
    }
  }
  
}