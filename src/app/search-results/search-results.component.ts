import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {
  searchTerm!: string;
  searchResults: any[] = [];
  currentUser: any;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
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
  
    this.authService.searchServices(this.searchTerm, categoryParam).subscribe(results => {
      this.searchResults = results;
      console.log('search result: ', this.searchResults);
    });
  }

  redirectToAccommodation(serviceId: string, category: string): void {
    if (category === 'Accommodation') {
      // If category is 'accommodation', navigate to /accommodation/{serviceId}
      this.router.navigate([`/accommodation/${serviceId}`]);
    } else if (category === 'Restaurant') {
      // If category is 'restaurant', navigate to /restaurant/{serviceId}
      this.router.navigate([`/restaurant-detail/${serviceId}`]);
    }
  }
  
}