import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';
import { switchMap, map } from 'rxjs/operators'; // Import necessary operators
import { forkJoin } from 'rxjs'; // Import forkJoin

@Component({
  selector: 'app-booking-tour-guide',
  templateUrl: './booking-tour-guide.component.html',
  styleUrls: ['./booking-tour-guide.component.css']
})
export class BookingTourGuideComponent {


  tourGuideServices: any[] = [];
  currentUser: any;
  Math = Math;
  showBackToPlanningButton = false;


  constructor(
    private servicesService: ServicesService,
    private authService: AuthService,
    private router: Router, // Inject Router here
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    this.loadTourGuideServices();
    this.route.queryParams.subscribe(params => {
      this.showBackToPlanningButton = !!params['planning-itinerary'];
    });
  }

  loadTourGuideServices(): void {
    this.servicesService.getTourGuideServices().pipe(
      // Map over the services data and fetch the ratings for each service
      switchMap((services: any[]) => {
        return forkJoin(
          services.map((service: any) => 
            this.servicesService.getServiceRating(service._id).pipe(
              map((ratingData: any) => ({
                ...service,
                averageRating: ratingData?.averageRating ?? 0,
                reviewCount: ratingData?.reviewCount ?? 0
              }))
            )
          )
        );
      })
    ).subscribe(
      (tourGuideServices: any[]) => {
        this.tourGuideServices = tourGuideServices;
      },
      (error) => {
        console.error('Error fetching tour guide services', error); // Fix the error message
      }
    );
  }

  // Navigate to the details page when a service is clicked

  
  goToDetail(id: string): void {
    const queryParams = this.route.snapshot.queryParams;
    this.router.navigate(['/tour-guide', id], { queryParams });
  }
}

