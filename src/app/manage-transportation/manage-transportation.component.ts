import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransportationService } from '../services/transportation.service';

@Component({
  selector: 'app-manage-transportation',
  templateUrl: './manage-transportation.component.html',
  styleUrls: ['./manage-transportation.component.css']
})
export class ManageTransportationComponent implements OnInit{
  transportationForm: FormGroup;
  message: string = '';
  transportationData: any;
  transportID: string | null = null;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder,
    private service: TransportationService,
    private route: ActivatedRoute){
      this.transportationForm = this.fb.group({
        userId: ['', Validators.required],
        serviceId: ['', Validators.required],
        productName: [''],
        productDescription: [''],
        productImages: [''],
        location: [''],
        productSubcategory: ['']
      });
    }
    

    ngOnInit(): void {
      // Get transportID from route parameters
      this.transportID = this.route.snapshot.paramMap.get('id');
      
      if (this.transportID) {
        // Fetch transportation service by ID
        this.service.getTransporationServicesByID(this.transportID).subscribe(
          (response) => {
            this.transportationData = response;
            this.transportationForm.patchValue(this.transportationData); // Fill form with data
            console.log(this.transportationData);
          },
          (error) => {
            console.error('Error fetching transportation data:', error);
          }
        );
      }
    }

    toggleEdit() {
      this.isEditing = !this.isEditing;
    }


    
     
    
  
}
