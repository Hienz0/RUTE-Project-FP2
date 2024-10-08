import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-as-provider',
  templateUrl: './register-as-provider.component.html',
  styleUrls: ['./register-as-provider.component.css']
})
export class RegisterAsProviderComponent {
  businessType: string = '';
  businessSubcategory: string = '';
  businessName: string = '';
  businessLocation: string = '';
  businessDesc: string = '';
  price: number | null = null;
  businessLicense: File | null = null;
  imageSelf: File | null = null;
  imageService: File[] = [];
  successMessage: string = '';
  currentUser: any;

  subcategoryMap: any = {
    Accommodation: ['Villas', 'Guest Houses', 'Homestays', 'Hostels'],
    Transportation: ['Motorbikes', 'Cars', 'Bicycles'],
  };


  constructor(private authService: AuthService, private router: Router) { }


  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      console.log('Current user in dashboard:', user); // Debugging current user in the dashboard
    });
  }

  onFileChange(event: any, field: string) {
    if (event.target.files.length > 0) {
      if (field === 'businessLicense') {
        this.businessLicense = event.target.files[0];
      } else if (field === 'imageSelf') {
        this.imageSelf = event.target.files[0];
      } else if (field === 'imageService') {
        this.imageService = Array.from(event.target.files); // Store multiple files
      }
    }
  }

  getPricePlaceholder(): string {
    switch (this.businessType) {
      case 'Accommodation':
        return 'Price per Night';
      case 'TourGuide':
      case 'Restaurant':
        return 'Price per Person';
      case 'Transportation':
        return 'Price per Day';
      default:
        return 'Price';
    }
  }

  onSubmit() {
    if (this.businessLicense && this.imageSelf && this.imageService.length >= 3 && this.price !== null) {
      const formData = new FormData();
      formData.append('businessType', this.businessType);
      formData.append('businessSubcategory', this.businessSubcategory);
      formData.append('businessName', this.businessName);
      formData.append('businessLocation', this.businessLocation);
      formData.append('businessDesc', this.businessDesc);
      formData.append('price', this.price.toString());
      formData.append('businessLicense', this.businessLicense);
      formData.append('imageSelf', this.imageSelf);
      this.imageService.forEach(file => formData.append('imageService', file)); // Append multiple files

      const token = localStorage.getItem('token');
      if (token !== null) { // Check if token is not null
        this.authService.registerProvider(formData, token).subscribe(
          response => {
            // alert(response.message);
            this.successMessage = 'The request has been sent. Your data will be reviewed soon. Please wait for further information.';
            setTimeout(() => {
              this.successMessage = '';
              this.router.navigate(['/dashboard']);
            }, 3000); // Clear message after 5 seconds
          },
          error => {
            console.error('Error:', error);
            alert('An error occurred while registering the provider.');
          }
        );
      } else {
        alert('No token found. Please log in again.');
      }
    } else {
      alert('Please fill in all required fields and upload the necessary files.');
    }
  }
}
