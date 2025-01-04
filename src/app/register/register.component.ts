import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

declare var Swal: any;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  signupForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';  // Add this line
  showPassword: boolean = false; // Flag to toggle password visibility
  showRepeatPassword: boolean = false; // Flag to toggle password visibility

  constructor(private formBuilder: FormBuilder, private router: Router, private authService: AuthService) {
    this.signupForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      repeatPassword: ['', Validators.required],
      agreeTerm: [false, Validators.requiredTrue]
    });
  }

 

  onSubmit() {
    if (this.signupForm.value.password !== this.signupForm.value.repeatPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match',
        confirmButtonText: 'OK'
      });
      return;
    }
  
    const formData = {
      name: this.signupForm.value.name,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      userType: 'user',
    };
  
    // Show loading animation
    Swal.fire({
      title: 'Processing...',
      text: 'Please wait while we create your account.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    this.authService.register(formData).subscribe(
      (response: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Please verify your email.',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      (error) => {
        console.error('Form submission error', error);
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: error.error.message || 'Please try again.',
          confirmButtonText: 'OK'
        });
      }
    );
  }
  
  

  isFormInvalid(): boolean {
    return (
      this.signupForm.invalid ||
      this.signupForm.value.password !== this.signupForm.value.repeatPassword
    );
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Toggle flag to show/hide password
    const passwordInput = document.getElementById('password') as HTMLInputElement; // Get the password input element
    if (passwordInput) {
      passwordInput.type = this.showPassword ? 'text' : 'password'; // Set input type based on flag
    }
  }

  toggleRepeatPasswordVisibility() {
    this.showRepeatPassword = !this.showRepeatPassword; // Toggle flag to show/hide password
    const RepeatPasswordInput = document.getElementById('repeatPassword') as HTMLInputElement; // Get the password input element
    if (RepeatPasswordInput) {
      RepeatPasswordInput.type = this.showRepeatPassword ? 'text' : 'password'; // Set input type based on flag
    }
  }
}
