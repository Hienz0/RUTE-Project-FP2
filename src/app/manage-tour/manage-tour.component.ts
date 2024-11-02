import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-manage-tour',
  templateUrl: './manage-tour.component.html',
  styleUrls: ['./manage-tour.component.css']
})
export class ManageTourComponent implements OnInit {
  serviceId: string = ''; // To store the service ID
  service: any; // To store the fetched service details
  isEditing: boolean = false; // To toggle edit mode

  constructor(
    private route: ActivatedRoute,
    private servicesService: ServicesService
  ) {}

  ngOnInit() {
    // Get the serviceId from route parameters
    this.route.paramMap.subscribe(params => {
      this.serviceId = params.get('serviceId') || '';
      this.fetchTourGuideService();
    });
  }

  fetchTourGuideService() {
    this.servicesService.getTourGuideServiceById(this.serviceId).subscribe(
      (data: any) => {
        this.service = data; // Set the fetched service data
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching tour guide service', error);
      }
    );
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveService() {
    const updatedData = {
        ...this.service,
        location: 'Ubud Palaces' // Default location
    };

    console.log('Sending updated data:', updatedData); // Log data before sending

    this.servicesService.updateTourGuideService(this.serviceId, updatedData).subscribe(
        response => {
            console.log('Service updated successfully', response);
            this.service = response; // Update the local service data
            this.isEditing = false; // Exit edit mode
        },
        (error: HttpErrorResponse) => {
            console.error('Error updating service', error);
        }
    );
}
}
