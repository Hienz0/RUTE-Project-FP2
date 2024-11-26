import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';


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

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.isLoading = true;
    this.message = null;
    this.error = null;

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Something went wrong';
      },
    });
  }
}