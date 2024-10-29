import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TransportationService } from '../services/transportation.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-manage-transportation',
  templateUrl: './manage-transportation.component.html',
  styleUrls: ['./manage-transportation.component.css']
})
export class ManageTransportationComponent implements OnInit {
  message: string = '';
  currentUser: any;
  transportationData: any = {}; // Adjusted to no longer use form data directly
  transportID: string | null = null;
  isEditing: boolean = false;
  productName: string = '';
  productDescription: string = '';
  productImages: string = '';
  location: string = '';
  newProductSubCategory: any[] = []; // New variable for productSubCategory

  constructor(
    private fb: FormBuilder,
    private service: TransportationService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    
  }

  ngOnInit(): void {
    // Fetch user and initialize transportation data here if necessary
    this.currentUser = this.authService.currentUserValue;
    this.transportID = this.route.snapshot.paramMap.get('id');

    if (this.transportID) {
      this.service.getTransporationServicesByID(this.transportID).subscribe(
        (response) => {
          this.transportationData = response || {};
          this.productName = this.transportationData.productName;
          this.productDescription = this.transportationData.productDescription;
          this.productImages = this.transportationData.productImages;
          this.location = this.transportationData.location;
        },
        (error) => console.error('Error fetching transportation data:', error)
      );
    }
  }
  

 

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  addVehicleType(): void {
    this.newProductSubCategory.push({
      name: '',
      category: '',
      quantity: 0,
      price: 0
    });
  }
  

  removeVehicleType(index: number): void {
    this.newProductSubCategory.splice(index, 1);
  }

  saveTransportation(): void {
    this.transportationData = {
      serviceId: this.transportationData._id || this.transportationData.id,
      productName: this.productName,
      productDescription: this.productDescription,
      productImages: this.productImages,
      location: this.location,
     
    };
    
    console.log('Transportation data saved to variable:', this.transportationData);
    alert('Transportation data saved locally.');
}


  publishTransportation(): void {
    if (!this.currentUser) {
      console.error('User not available');
      return;
    }

    const publishData = {
      serviceId: this.transportationData._id || this.transportationData.id,
      userId: this.currentUser.userId,
      productName: this.productName,
      productDescription: this.productDescription,
      productImages: this.productImages,
      location: this.location,
      productSubCategory: this.newProductSubCategory // Use the new variable here
    };

    console.log('Publish data:', publishData);

    this.service.saveTransportation(publishData).subscribe(
      (response) => {
        console.log('Transportation published successfully:', response);
        this.message = 'Transportation published successfully';

      },
      (error) => {
        console.error('Error publishing transportation:', );
        this.message = 'Failed to publish transportation';
      }
    );
  }
}

  



