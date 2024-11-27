import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

declare var Swal: any;

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  newPassword: string = '';
  isLoading = false;
  message: string | null = null;
  error: string | null = null;
  token: string | null = null;

  constructor(private authService: AuthService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
  }

  onSubmit() {
    if (!this.token) {
      this.error = 'Invalid token';
      return;
    }

    this.isLoading = true;
    this.message = null;
    this.error = null;

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
        
        // Show SweetAlert2 success message for password reset
        Swal.fire({
          icon: 'success',
          title: 'Password Reset Successful',
          text: 'Your password has been successfully reset. You can now log in with your new password.',
          confirmButtonColor: '#3085d6',
        }).then(() => {
          // Optionally redirect to login or other page
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Something went wrong';
        
        // Show SweetAlert2 error message for password reset failure
        Swal.fire({
          icon: 'error',
          title: 'Password Reset Failed',
          text: this.error,
          confirmButtonColor: '#d33',
        });
      },
      
    });
  }
}