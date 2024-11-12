import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-accommodation',
  templateUrl: './accommodation.component.html',
  styleUrls: ['./accommodation.component.css'],
})
export class AccommodationComponent implements OnInit {
  accommodationServices: any[] = [];
  currentUser: any;

  constructor(private servicesService: ServicesService, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    
    this.loadTourGuideServices();
  }

  loadTourGuideServices(): void {
    this.servicesService.getTourGuideServices().subscribe(
      (data) => {
        this.accommodationServices = data;
      },
      (error) => {
        console.error('Error fetching accommodation services', error);
      }
    );
  }

  // Navigate to the details page when a service is clicked
  goToDetail(id: string): void {
    this.router.navigate(['/tour-guide', id]);
  }
}
