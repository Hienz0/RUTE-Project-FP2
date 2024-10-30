import { Component, OnInit } from '@angular/core';
import { TransportationService } from '../services/transportation.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-transportation-services',
  templateUrl: './transportation-services.component.html',
  styleUrls: ['./transportation-services.component.css']
})
export class TransportationServicesComponent implements OnInit {
  services: any[] = [];
  constructor(private service : TransportationService, private router: Router, private route: ActivatedRoute){}
  ngOnInit(): void {

      this.service.getTransportationService().subscribe(
        (data) => {
          this.services = data;
          console.log(data);
        },
        (error) => {
          console.error('Error fetching transportation service:', error);
        }
      );
   
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
