import { Component, OnInit } from '@angular/core';
import { TransportationService } from '../services/transportation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesService } from '../services/services.service';

@Component({
  selector: 'app-transportation-services',
  templateUrl: './transportation-services.component.html',
  styleUrls: ['./transportation-services.component.css']
})
export class TransportationServicesComponent implements OnInit {
  services: any[] = [];
  Math = Math;
  constructor(private service : TransportationService, private servicesService: ServicesService, private router: Router, private route: ActivatedRoute){}
  ngOnInit(): void {
    this.service.getTransportationService().subscribe(
      async (data) => {
        this.services = await Promise.all(data.map(async (service: any) => {
          const ratingData = await this.servicesService.getServiceRating(service.serviceId).toPromise();
          return { 
            ...service, 
            averageRating: ratingData?.averageRating ?? 0, 
            reviewCount: ratingData?.reviewCount ?? 0 
          };
        }));
      },
      (error) => {
        console.error('Error fetching transportation service:', error);
      }
    );
  }
  
  
  getStarIcons(rating: number): string[] {
    const filledStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - filledStars - halfStar;
    return [
      ...Array(filledStars).fill('★'),
      ...Array(halfStar).fill('☆'),
      ...Array(emptyStars).fill('✩')
    ];
  }



  getFullImagePath(image: string): string {
    // Assuming images are stored in the /uploads/ folder on the server
    return `http://localhost:3000/${image}`;
  }

  navigateToDetails(serviceId: string): void {
    this.router.navigate(['/transportationDetail', serviceId]);
  
  }

 // transportation-services.component.ts
 getUniqueSubcategories(service: any): string {
  if (!service?.productSubcategory) return '';
  
  return Array.from(new Set(service.productSubcategory.map((sub: any) => sub.type))).join(', ');
}

  
  
}
