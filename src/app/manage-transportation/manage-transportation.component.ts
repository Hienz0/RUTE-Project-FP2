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
  transportationForm: FormGroup;
  message: string = '';
  currentUser: any;
  transportationData: any = {
    productSubCategory: []
  };
  transportID: string | null = null;
  isEditing: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: TransportationService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.transportationForm = this.fb.group({
      userId: ['', Validators.required],
      serviceId: ['', Validators.required],
      productName: [''],
      productDescription: [''],
      productImages: [''],
      location: [''],
      productSubCategor: this.fb.array([]) // Array untuk menyimpan kategori kendaraan
    });
  }

  ngOnInit(): void {
    // Get the logged-in user
    this.currentUser = this.authService.currentUserValue;
    this.transportID = this.route.snapshot.paramMap.get('id');
  
    if (this.transportID) {
      this.service.getTransporationServicesByID(this.transportID).subscribe(
        (response) => {
          this.transportationData = response || {}; // Pastikan response ada
          this.transportationData.productSubCategory = this.transportationData.productSubCategory || []; // Pastikan productSubCategory array
          this.transportationForm.patchValue(this.transportationData); // Isi form dengan data dari server
        },
        (error) => {
          console.error('Error fetching transportation data:', error);
        }
      );
    }
  }
  

 

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  addVehicleType(): void {
    if (!Array.isArray(this.transportationData.productSubCategory)) {
      this.transportationData.productSubCategory = [];
    }
  
    this.transportationData.productSubCategory.push({
      name: '',
      category: '',
      quantity: 0,
      price: 0
    });
  }
  

  removeVehicleType(index: number): void {
    this.transportationData.productSubCategory.splice(index, 1);
  }

  saveTransportation(): void {
    this.transportationData = {
      ...this.transportationForm.value,
      productSubCategory: this.transportationData.productSubCategory
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
      ...this.transportationData,
      userId: this.currentUser.userId,
      serviceId: this.transportationData._id || this.transportationData.id,
    };

    // Send data to server for publishing
    this.service.saveTransportation(publishData).subscribe(
      (response) => {
        console.log('Transportation published successfully:', response);
        this.message = 'Transportation published successfully';
      },
      (error) => {
        console.error('Error publishing transportation:', error);
        this.message = 'Failed to publish transportation';
      }
    );
  }

  
}


