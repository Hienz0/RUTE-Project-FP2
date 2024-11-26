import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';


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

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

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
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Something went wrong';
      },
    });
  }
}