import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  services: any[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'Accommodation'; // Track selected category

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    this.loadServices();
  }

  loadServices(): void {
    this.authService.getAllServices().subscribe(services => {
      this.services = services;
    });
  }

  performSearch(): void {
    console.log('category: ', this.selectedCategory);
    console.log('search term: ', this.searchTerm);
    if (this.searchTerm.trim().length > 2) {
      let queryParams: any = { searchTerm: this.searchTerm };
      if (this.selectedCategory) {
        queryParams.category = this.selectedCategory;
      }
      this.router.navigate(['/search-results'], { queryParams: queryParams });
    }
  }

  searchInCategory(category: string): void {
    this.selectedCategory = category;
    this.performSearch(); // Perform search when a category is selected
  }
}
