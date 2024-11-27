import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

declare var Swal: any;


@Component({
  selector: 'app-request-reset-password',
  templateUrl: './request-reset-password.component.html',
  styleUrls: ['./request-reset-password.component.css']
})
export class RequestResetPasswordComponent {
  email: string = '';
  isLoading = false;
  message: string | null = null;
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading = true;
    this.message = null;
    this.error = null;

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
      
// Show SweetAlert2 success message
Swal.fire({
  icon: 'success',
  title: 'Success!',
  text: 'Your password reset request has been sent successfully. Please check your email to reset your password.',
  confirmButtonColor: '#3085d6',
}).then(() => {
  // Redirection happens here
  this.router.navigate(['/login']);
});
        
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Something went wrong';
      
        // Show SweetAlert2 error message
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: this.error,
          confirmButtonColor: '#3085d6',
        });
      },
      
    });
  }
}