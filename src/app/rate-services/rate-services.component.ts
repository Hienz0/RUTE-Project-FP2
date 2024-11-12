import { Component, OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router'; // Untuk mendapatkan serviceId dari URL
import { TransportationService } from '../services/transportation.service';

@Component({
  selector: 'app-rate-services',
  templateUrl: './rate-services.component.html',
  styleUrls: ['./rate-services.component.css']
})
export class RateServicesComponent implements OnInit {
  productName = '';
  productDescription = '';
  productImages: string[] = [];
  currentImageIndex = 0;
  productCategory = '';
  averageRating = 0;
  totalReviews = 0;

  rating = 0; // User's selected rating
  hoveredRating = 0; // Current hover rating
  reviewComment = ''; // User's review comment

  constructor(
    private service: TransportationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Dapatkan serviceId dari URL atau gunakan ID contoh untuk testing
    const serviceId = this.route.snapshot.paramMap.get('serviceId') || '6728123734ac03d88dd3ecff';
  
    // Panggil service untuk mendapatkan detail produk berdasarkan serviceId
    this.service.getServiceById(serviceId).subscribe({
      next: (data) => {
        this.productName = data.productName;
        this.productDescription = data.productDescription;
        
        // Access correct property for product images
        this.productImages = data.productImages 
          ? data.productImages.map((image: string) => this.getFullImagePath(image.replace(/\\/g, '/')))
          : [];
        console.log('Processed Image URLs:', this.productImages);

        this.productCategory = data.productCategory;
        this.averageRating = data.averageRating || 3;
        this.totalReviews = data.totalReviews || 120;
      },
      error: (error) => {
        console.error('Error fetching service:', error);
      }
    });
}

  
  

  selectRating(star: number) {
    this.rating = star;
  }

  setHoveredRating(star: number) {
    this.hoveredRating = star;
  }

  resetHoveredRating() {
    this.hoveredRating = 0;
  }

  submitReview() {
    console.log('Rating:', this.rating);
    console.log('Comment:', this.reviewComment);
  }

  previousImage(): void {
    this.currentImageIndex = (this.currentImageIndex === 0)
      ? this.productImages.length - 1
      : this.currentImageIndex - 1;
  }

  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex === this.productImages.length - 1)
      ? 0
      : this.currentImageIndex + 1;
  }

  getFullImagePath(image: string): string {
    return `http://localhost:3000/${image}`;
  }
  
}
