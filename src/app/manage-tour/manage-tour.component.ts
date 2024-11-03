import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

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
        Swal.fire('Error', 'Failed to fetch tour guide service data', 'error');
      }
    );
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  saveService() {
    const updatedData = {
        name: this.service.name,
        price: this.service.price,
        description: this.service.description,
        location: this.service.location // Adjust according to your schema
    };

    console.log('Sending updated data:', updatedData); // Check the payload

    this.servicesService.updateTourGuideService(this.serviceId, updatedData).subscribe(
        (response: any) => {
            console.log('Service updated successfully', response);
            this.service = response; // Update the local service data
            this.isEditing = false; // Exit edit mode
            Swal.fire('Success', 'Service updated successfully', 'success');
        },
        (error: HttpErrorResponse) => {
            console.error('Error updating service', error);
            Swal.fire('Error', 'Failed to update service', 'error');
        }
    );
}


  deleteService() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will permanently delete the service.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.servicesService.deleteTourGuideService(this.serviceId).subscribe(
          () => {
            Swal.fire('Deleted!', 'The service has been deleted.', 'success');
          },
          (error: HttpErrorResponse) => {
            console.error('Error deleting service', error);
            Swal.fire('Error', 'Failed to delete service', 'error');
          }
        );
      }
    });
  }

  deleteTourOption(tourOption: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will permanently delete this tour option.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Find the index of the tour option to delete
        const index = this.service.tourOptions.indexOf(tourOption);
        if (index > -1) {
          // Remove the tour option from the array
          this.service.tourOptions.splice(index, 1);
          Swal.fire('Deleted!', 'The tour option has been deleted.', 'success');
        }
      }
    });
  }

}
