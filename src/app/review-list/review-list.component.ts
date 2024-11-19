import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { TransportationService } from '../services/transportation.service';

@Component({
  selector: 'app-review-list',
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.css']
})
export class ReviewListComponent implements OnInit {
  @Input() serviceId!: string; // Service ID will be passed from parent component
  reviews: any[] = [];
  reviewsPerPage: number = 3; // Jumlah ulasan per halaman
  currentPage: number = 1; // Halaman saat ini
  totalPages: number = 0; // Total halaman

  constructor(private service: TransportationService) {}

  ngOnInit(): void {
    if (this.serviceId) {
      this.fetchReviews(this.serviceId);
      console.log(this.serviceId);
    }
    else{
      console.error("Service ID not provided");
      
    }
    this.calculateTotalPages();
  }

  fetchReviews(serviceId: string) {
    this.service.getReviewList(serviceId).subscribe(
      (data) => {
        if (data && data.length > 0) {
          this.reviews = data;
          this.calculateTotalPages(); // Hitung total halaman setelah data diperoleh
          console.log('review', this.reviews);
        } else {
          console.error('Error: No review data found in the database for the provided service ID.');
        }
      },
      (error) => {
        console.error('Error fetching reviews:', error);
      }
    );
  }
  


  getStarsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < rating);
  }

  getFullImagePath(image: string): string {
    return `http://localhost:3000/${image}`;
  }

  // review-list.component.ts

onMouseOver(event: Event, userAvatar: string): void {
  if (userAvatar) {
      (event.target as HTMLElement).style.transform = 'scale(1.1)';
  }
}

onMouseOut(event: Event, userAvatar: string): void {
  if (userAvatar) {
      (event.target as HTMLElement).style.transform = 'scale(1)';
  }
}

ngOnChanges(changes: SimpleChanges): void {
  // Recalculate total pages whenever reviews change
  if (changes['reviews']) {
    this.calculateTotalPages();
  }
}

calculateTotalPages(): void {
  if (this.reviews && this.reviews.length > 0) {
    this.totalPages = Math.ceil(this.reviews.length / this.reviewsPerPage);
    console.log('Total pages:', this.totalPages); // This should log whenever reviews are updated
  } else {
    this.totalPages = 0;
  }
}

// Pindah ke halaman tertentu
goToPage(page: number): void {
  this.currentPage = page;
}

// Ambil ulasan yang sesuai dengan halaman saat ini
getCurrentPageReviews(): any[] {
  const startIndex = (this.currentPage - 1) * this.reviewsPerPage;
  const endIndex = startIndex + this.reviewsPerPage;
  return this.reviews.slice(startIndex, endIndex);
}

// Ambil daftar tombol pagination
// Ambil daftar tombol pagination
getPaginationButtons(): number[] {
  const buttons: number[] = [];
  const visiblePages = 3; // Jumlah halaman yang ditampilkan sekaligus
  const half = Math.floor(visiblePages / 2);

  let start = Math.max(this.currentPage - half, 1);
  let end = Math.min(this.currentPage + half, this.totalPages);

  // Adjust jika awal atau akhir tidak mencukupi visiblePages
  if (this.totalPages > visiblePages) {
    if (start === 1) {
      end = Math.min(visiblePages, this.totalPages);
    } else if (end === this.totalPages) {
      start = Math.max(this.totalPages - visiblePages + 1, 1);
    }
  }

  // Tambahkan tombol halaman ke dalam array
  for (let i = start; i <= end; i++) {
    buttons.push(i);
  }

  return buttons;
}




}