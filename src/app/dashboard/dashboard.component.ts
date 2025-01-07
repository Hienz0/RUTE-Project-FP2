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

   // Fungsi untuk memuat data layanan
   loadServices(): void {
    this.authService.getRandomServices().subscribe({
      next: (data) => {
        this.services = data; // Menyimpan hasil data ke dalam array services
      },
      error: (err) => {
        console.error('Error loading services:', err);
      }
    });
  }
  getStars(rating: number): string {
    const fullStars = '★'.repeat(Math.floor(rating)); // Bintang penuh
    const halfStar = rating % 1 !== 0 ? '☆' : ''; // Setengah bintang jika ada
    const emptyStars = '☆'.repeat(5 - Math.ceil(rating)); // Bintang kosong
    return fullStars + halfStar + emptyStars; // Gabungkan semua
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
  getFullImagePath(image: string): string {
    return `http://localhost:3000/${image}`;
  }

  navigateToCategory(service: any): void {
    switch (service.productCategory) {
      case 'Accommodation':
        this.router.navigate([`accommodation`, service._id]);
        break;
      case 'Transportation':
        this.router.navigate([`transportationDetail`, service._id]);
        break;
      case 'Tour Guide':
        this.router.navigate([`tour-guide`, service._id]);
        break;
      case 'Restaurant':
        this.router.navigate([`restaurant-detail`, service._id]);
        break;
      default:
        console.error('Unknown category:', service.productCategory);
    }
  }

  formatProductName(name: string): string {
    // Mengonversi nama menjadi huruf kapital di depan setiap kata
    return name
      .split(' ') // Pisahkan berdasarkan spasi
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Kapitalisasi huruf pertama
      .join(' '); // Gabungkan kembali dengan spasi
  }
  
  
}