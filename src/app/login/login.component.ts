import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

declare var Swal: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false; // Flag to toggle password visibility

  constructor(private formBuilder: FormBuilder, private router: Router, private route: ActivatedRoute, private authService: AuthService) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const status = params['status'];
      const message = params['message'];
  
      if (status && message) {
        if (status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            confirmButtonText: 'OK',
          });
        } else if (status === 'error') {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            confirmButtonText: 'OK',
          });
        }
      }
    });
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (!this.loginForm) {
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    if (email && password) {
      this.authService.login(email, password).subscribe(
        (response) => {
          console.log('Login successful', response);
          this.successMessage = 'Logging you in...';
          setTimeout(() => {
            this.successMessage = '';
            const userType = response.user.userType; // Get the user type from the response
            if (userType === 'user' || userType === 'provider') {
              this.router.navigate(['/dashboard']);
            } else if (userType === 'admin') {
              this.router.navigate(['/adminDashboard']);
            }
          }, 2000);
        },
        (error) => {
          console.error('Login failed', error);
          this.errorMessage = 'Login failed. Please check your email and password and try again.'; // Set error message
          setTimeout(() => {
            this.errorMessage = '';
          }, 3000); // 3 seconds delay before hiding the error message
        }
      );
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Toggle flag to show/hide password
    const passwordInput = document.getElementById('password') as HTMLInputElement; // Get the password input element
    if (passwordInput) {
      passwordInput.type = this.showPassword ? 'text' : 'password'; // Set input type based on flag
    }
  }
}

