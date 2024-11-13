import { Component, OnInit  } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  searchTerm: string = '';
  selectedCategory: string = '';

  constructor(
    private router: Router,
  ) {}


  ngOnInit(): void {
    // Check if the current path is '/accommodation'
    if (this.router.url === '/accommodation') {
      this.selectedCategory = 'Accommodation';
    }
    else if (this.router.url === '/restaurant') {
      this.selectedCategory = 'Restaurant';
    }
    else if (this.router.url === '/transportationService') {
      this.selectedCategory = 'Transportation';
    }
    else if (this.router.url === '/booking-tour-guide') {
      this.selectedCategory = 'Tour & Guide';
    }
  }

  performSearch(): void {
    console.log('category:', this.selectedCategory);
    console.log('search term:', this.searchTerm);
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

  selectCategory(category: string): void {
    this.selectedCategory = category; // Set the selected category
  }
}