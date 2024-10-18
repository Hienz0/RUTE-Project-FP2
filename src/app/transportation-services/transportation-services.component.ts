import { Component, OnInit } from '@angular/core';
import { TransportationService } from '../services/transportation.service';

@Component({
  selector: 'app-transportation-services',
  templateUrl: './transportation-services.component.html',
  styleUrls: ['./transportation-services.component.css']
})
export class TransportationServicesComponent implements OnInit {
  services: any[] = [];
  constructor(private service : TransportationService){}
  ngOnInit(): void {
    this.service.getTransporationServices().subscribe(
      (data: any[]) => {
        this.services = data;
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
  
  
}
