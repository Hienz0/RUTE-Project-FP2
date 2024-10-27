import { Component, OnInit } from '@angular/core';
import { TransportationService } from '../services/transportation.service';
import { Router } from '@angular/router'

@Component({
  selector: 'app-transportation-provider',
  templateUrl: './transportation-provider.component.html',
  styleUrls: ['./transportation-provider.component.css']
})
export class TransportationProviderComponent implements OnInit {
  services : any[]=[]

  constructor(private service : TransportationService, private router: Router){}

  ngOnInit(): void {
    this.service.getTransportationProviders().subscribe(
      (data: any[]) => {
        this.services = data;
        console.log(this.services);
      },
      (error) => {
        console.error('Error fetching services', error);
      }
    );
  }

  getFullImagePath(image: string): string {
    // Assuming images are stored in the /uploads/ folder on the server
    return `http://localhost:3000/${image}`;
  }

  navigateToDetails(serviceId: string): void {
    this.router.navigate(['/transportationService', serviceId]);
  
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
  
}
