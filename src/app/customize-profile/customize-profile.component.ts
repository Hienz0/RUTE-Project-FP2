import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customize-profile',
  templateUrl: './customize-profile.component.html',
  styleUrls: ['./customize-profile.component.css']
})
export class CustomizeProfileComponent implements OnInit {
  currentUser: any;
  previewAvatarUrl: string | ArrayBuffer | null = null;
  profileData = {
    name: '',
    address: '',
    contact: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    avatar: null as File | null
  };

  constructor(private authService: AuthService, private userService: UserService, private router: Router){}
  
  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.previewAvatarUrl = this.getFullImagePath(this.currentUser.avatar);
    console.log(this.currentUser);
  }

  // Handle profile picture selection
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.profileData.avatar = input.files[0];

      // Create a temporary URL for the new profile picture preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewAvatarUrl = reader.result;
      };
      reader.readAsDataURL(this.profileData.avatar);
    }
  }

  // Update profile information
  saveChanges(): void {
    const formData = new FormData();
    formData.append('userId', this.currentUser._id);
    formData.append('name', this.profileData.name);
    formData.append('address', this.profileData.address);
    formData.append('contact', this.profileData.contact);
    if (this.profileData.currentPassword) formData.append('currentPassword', this.profileData.currentPassword);
    if (this.profileData.newPassword) formData.append('newPassword', this.profileData.newPassword);
    if (this.profileData.confirmNewPassword) formData.append('confirmNewPassword', this.profileData.confirmNewPassword);
    if (this.profileData.avatar) formData.append('avatar', this.profileData.avatar);

    this.userService.customizeProfile(formData).subscribe(
      response => {
        console.log('Profile updated successfully:', response);
        this.authService.updateCurrentUser(response.user);
        this.showAlert(
          'success',
          'Profile Updated!',
          'Your profile has been updated successfully.',
          '/dashboard'
        );
      },
      error => {
        console.error('Error updating profile:', error);
        this.showAlert(
          'error',
          'Update Failed',
          'There was an error updating your profile. Please try again.'
        );
      }
    );
  }

  cancelChanges(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Your unsaved changes will be lost!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        // Jika pengguna memilih untuk membatalkan, reset form dan arahkan ke /dashboard
        this.resetProfileData();
        this.router.navigate(['/dashboard']);
      } 
      // Jika pengguna memilih untuk tetap, tidak ada aksi tambahan yang perlu dilakukan
    });
  }
  
  // Fungsi untuk mereset data profil ke nilai awal dari currentUser
  resetProfileData(): void {
    this.profileData.name = this.currentUser.name;
    this.profileData.address = this.currentUser.address;
    this.profileData.contact = this.currentUser.contact;
    this.profileData.currentPassword = '';
    this.profileData.newPassword = '';
    this.profileData.confirmNewPassword = '';
    this.profileData.avatar = null;
    this.previewAvatarUrl = this.getFullImagePath(this.currentUser.avatar);
  }

  getFullImagePath(image: string): string {
    return image ? `http://localhost:3000/${image}` : 'https://via.placeholder.com/120';
  }

  showAlert(
    icon: 'success' | 'error' | 'warning' | 'info',
    title: string,
    text: string,
    redirectTo?: string // optional redirect path
  ): void {
    Swal.fire({
      icon: icon,
      title: title,
      text: text,
      confirmButtonText: 'OK'
    }).then((result) => {
      if (result.isConfirmed && redirectTo) {
        this.router.navigate([redirectTo]);
      }
    });
  }
}
