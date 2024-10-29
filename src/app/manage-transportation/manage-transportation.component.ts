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
  // Add this property to hold the existing or editable productSubcategory items
  displayedProductSubCategories: any[] = [];

  

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
          this.productName = this.transportationData.serviceDetails.productName;
          this.productDescription = this.transportationData.serviceDetails.productDescription;
          this.productImages = this.transportationData.serviceDetails.productImages;
          this.location = this.transportationData.serviceDetails.location;
          console.log('Transportation data:', this.transportationData);
           // Load existing productSubcategory entries if they exist
           if (this.transportationData.transportationData.productSubcategory) {
            this.displayedProductSubCategories = this.transportationData.transportationData.productSubcategory;
            console.log('Existing productSubcategory entries:', this.displayedProductSubCategories);
          }
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
  

  removeVehicleType(index: number, existing: boolean = false): void {
    if (existing) {
      if (this.displayedProductSubCategories[index]) {
        this.displayedProductSubCategories[index].action = "delete";
        this.displayedProductSubCategories.splice(index, 1); // Hapus dari array setelah menandai
      } else {
        console.error('Error: Invalid index for displayedProductSubCategories');
      }
    } else {
      if (this.newProductSubCategory[index]) {
        this.newProductSubCategory[index].action = "delete";
        this.newProductSubCategory.splice(index, 1); // Hapus dari array setelah menandai
      } else {
        console.error('Error: Invalid index for newProductSubCategory');
      }
    }
  }
  
  


  


  saveTransportation(): void {
    // Preserve the existing serviceDetails if it already exists
    this.transportationData = {
      ...this.transportationData,
      serviceId: this.transportationData.serviceDetails?.id || this.transportationData.serviceDetails?._id,
      productName: this.productName,
      productDescription: this.productDescription,
      productImages: this.productImages,
      location: this.location,
    };
    
    console.log('Transportation data saved to variable:', this.transportationData);
    alert('Transportation data saved locally.');
    this.isEditing;
  }
  


  publishTransportation(): void {
    if (!this.currentUser) {
      console.error('User not available');
      return;
    }

    // Gabungkan semua subkategori, termasuk yang baru dan yang perlu dihapus
    const allProductSubCategories = [
      ...this.displayedProductSubCategories,
      ...this.newProductSubCategory
    ];

    const publishData = {
      serviceId: this.transportationData.serviceDetails._id || this.transportationData.serviceDetails.id,
      userId: this.currentUser.userId,
      productName: this.productName,
      productDescription: this.productDescription,
      productImages: this.productImages,
      location: this.location,
      productSubCategory: allProductSubCategories
    };

    console.log('Publish data:', publishData);

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

  



