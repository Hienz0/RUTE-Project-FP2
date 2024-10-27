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
    const transportID = this.route.snapshot.paramMap.get('id');
    console.log('Transport ID from route:', transportID);
    if (transportID) {
      this.service.getTransportationService(transportID).subscribe(
        (data) => {
          this.services = data;
          console.log(data);
        },
        (error) => {
          console.error('Error fetching transportation service:', error);
        }
      );
    } else {
      console.error('Transport ID is null or invalid');
    }
  }


  getFullImagePath(image: string): string {
    // Assuming images are stored in the /uploads/ folder on the server
    return `http://localhost:3000/${image}`;
  }

  navigateToDetails(serviceId: string): void {
    this.router.navigate(['/transportationDetail', serviceId]);
  
  }
  
  
}
