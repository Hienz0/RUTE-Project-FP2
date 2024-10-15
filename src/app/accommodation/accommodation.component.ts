import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from '../services/services.service';

@Component({
  selector: 'app-accommodation',
  templateUrl: './accommodation.component.html',
  styleUrls: ['./accommodation.component.css'],
})
export class AccommodationComponent implements OnInit {
  accommodationServices: any[] = [];

  constructor(private servicesService: ServicesService, private router: Router) {}

  ngOnInit(): void {
    this.loadAccommodationServices();
  }

  loadAccommodationServices(): void {
    this.servicesService.getAccommodationServices().subscribe(
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
    this.router.navigate(['/accommodation', id]);
  }
}
