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
  confirmPassword: string = '';

  constructor(private authService: AuthService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
  }

  onSubmit() {
    if (!this.token) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Token',
        text: 'The token provided is invalid or missing.',
        confirmButtonColor: '#d33',
      });
      return;
    }
  
    if (this.newPassword.length < 8) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Too Short',
        text: 'Your password must be at least 8 characters long.',
        confirmButtonColor: '#f39c12',
      });
      return;
    }
  
    if (this.newPassword !== this.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Passwords Do Not Match',
        text: 'The new password and confirmation password must be the same.',
        confirmButtonColor: '#d33',
      });
      return;
    }
  
    this.isLoading = true;
  
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
  
        Swal.fire({
          icon: 'success',
          title: 'Password Reset Successful',
          text: 'Your password has been successfully reset. You can now log in with your new password.',
          confirmButtonColor: '#3085d6',
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (err) => {
        this.isLoading = false;
  
        Swal.fire({
          icon: 'error',
          title: 'Password Reset Failed',
          text: err.error?.message || 'Something went wrong during the password reset process.',
          confirmButtonColor: '#d33',
        });
      },
    });
  }
  
  
}