import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-booking-tour-guide',
  templateUrl: './booking-tour-guide.component.html',
  styleUrls: ['./booking-tour-guide.component.css']
})
export class BookingTourGuideComponent {


  tourGuideServices: any[] = [];
  currentUser: any;

  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    private router: Router // Inject Router here
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    this.loadTourGuideServices();
  }

  loadTourGuideServices(): void {
    this.servicesService.getTourGuideServices().subscribe(
      (data) => {
        this.tourGuideServices = data;
      },
      (error) => {
        console.error('Error fetching tour guide services', error); // Fix the error message
      }
    );
  }

  // Navigate to the details page when a service is clicked
  goToDetail(id: string): void {
    this.router.navigate(['/tour-guide', id]);
  }
}

