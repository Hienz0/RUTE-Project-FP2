import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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
      this.errorMessage = 'Passwords do not match';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }
  
    const formData = {
      name: this.signupForm.value.name,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      userType: 'user',
    };
  
    this.authService.register(formData).subscribe(
      (response: any) => {
        this.successMessage = 'Registration successful! Please verify your email.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      (error) => {
        console.error('Form submission error', error);
        this.errorMessage = error.error.message || 'Registration failed. Please try again.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
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
