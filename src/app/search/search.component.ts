import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {
  searchTerm: string = '';
  selectedCategory: string = 'Accommodation';

  constructor(
    private router: Router,
  ) {}
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
