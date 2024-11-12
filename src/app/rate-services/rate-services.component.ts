import { Component } from '@angular/core';

@Component({
  selector: 'app-rate-services',
  templateUrl: './rate-services.component.html',
  styleUrls: ['./rate-services.component.css']
})
export class RateServicesComponent {


  productName = 'Sample Product';
  productDescription = 'This is a detailed description of the product.';
  productImage = 'https://via.placeholder.com/200';
  productCategory = 'Sample Category';
  averageRating = 3; // Example average rating
  totalReviews = 120;
  
  rating = 0; // User's selected rating
  hoveredRating = 0; // Current hover rating
  reviewComment = ''; // User's review comment

  selectRating(star: number) {
    this.rating = star; // Set the selected rating
  }

  setHoveredRating(star: number) {
    this.hoveredRating = star; // Set the temporary hovered rating
  }

  resetHoveredRating() {
    this.hoveredRating = 0; // Clear the hovered rating on mouse leave
  }

  submitReview() {
    // Handle review submission
    console.log('Rating:', this.rating);
    console.log('Comment:', this.reviewComment);
  }
}
