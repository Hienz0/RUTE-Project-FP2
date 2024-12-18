import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ThemeService } from '../services/theme.service';
import { WeatherService } from '../services/weather.service';
import { Router } from '@angular/router';  // To redirect the user after logging out

@Component({
  selector: 'app-user-navbar',
  templateUrl: './user-navbar.component.html',
  styleUrls: ['./user-navbar.component.css'],
  animations: [
    // Existing Dropdown Animation
    trigger('dropdownAnimation', [
      state('closed', style({ opacity: 0, transform: 'translateY(-10px)', display: 'none' })),
      state('open', style({ opacity: 1, transform: 'translateY(0)', display: 'block' })),
      transition('closed => open', [animate('300ms ease-out')]),
      transition('open => closed', [animate('200ms ease-in')]),
    ]),
    // New Slide Toggle Animation
    trigger('slideToggle', [
      state('closed', style({ maxHeight: '0', overflow: 'hidden' })),
      state('open', style({ maxHeight: '300px', overflow: 'visible' })), // Adjust maxHeight as needed
      transition('closed <=> open', animate('0.5s ease-in-out')),
    ]),
  ],
})
export class UserNavbarComponent implements OnInit {

  currentUser: any;
  weatherWidgetToggle: boolean = false; // Default value for the weather widget visibility

  isDropdownOpen = false;
  @ViewChild('dropdownButton') dropdownButton!: ElementRef;
  isDarkMode: boolean = false;
  

  constructor(private authService: AuthService, private weatherService: WeatherService, private router: Router,private themeService: ThemeService) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
            // Set weatherWidgetToggle based on the user data (if available)
            if (this.currentUser && this.currentUser.weatherWidgetToggle !== undefined) {
              this.weatherWidgetToggle = this.currentUser.weatherWidgetToggle;
            }
            console.log('Current User:', this.currentUser);
    });
    this.isDarkMode = this.themeService.getTheme() === 'dark';
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
  }


  getFullImagePath(image: string): string {
    return `http://localhost:3000/${image}`;
  }

  toggleDropdown(): void {
    // Toggle the dropdown state when the button is clicked
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    // Explicitly close the dropdown
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const targetElement = event.target as HTMLElement;

    // Close the dropdown if the click is outside the dropdown and trigger button
    if (!targetElement.closest('.dropdown-menu') && !this.dropdownButton.nativeElement.contains(targetElement)) {
      this.closeDropdown();
    }
  }

  isWeatherWidgetVisible = false;

  toggleWeatherWidget() {
    this.isWeatherWidgetVisible = !this.isWeatherWidgetVisible;
  }

  toggleFloatingWeatherWidget(): void {
    console.log('Weather Widget Toggle:', this.weatherWidgetToggle);
    // this.weatherWidgetToggle = !this.weatherWidgetToggle;
    // Optionally update the user's preference here (e.g., API call to save the state)
    // this.authService.updateWeatherWidgetPreference(this.weatherWidgetToggle);
    if(this.currentUser){
      this.weatherService.updateWeatherWidgetToggle(this.currentUser.userId, this.weatherWidgetToggle).subscribe(
        (response) => {
          console.log('Weather widget updated successfully:', response);
                    // Update the current user in AuthService
                    const updatedUser = {
                      ...this.currentUser,
                      weatherWidgetToggle: this.weatherWidgetToggle
                    };
                    this.authService.updateCurrentUser(updatedUser);
        },
        (error) => {
          console.error('Error updating weather widget:', error);
        }
      );
    }
    else {
      console.error('User not available');
    }
  }

  onWidgetClosed(): void {
    console.log('Widget closed from child component');
    this.weatherWidgetToggle = false; // Reflect the closed state
    if(this.currentUser){
      this.weatherService.updateWeatherWidgetToggle(this.currentUser.userId, this.weatherWidgetToggle).subscribe(
        (response) => {
          console.log('Weather widget updated successfully:', response);
                    // Update the current user in AuthService
                    const updatedUser = {
                      ...this.currentUser,
                      weatherWidgetToggle: this.weatherWidgetToggle
                    };
                    this.authService.updateCurrentUser(updatedUser);
        },
        (error) => {
          console.error('Error updating weather widget:', error);
        }
      );
    }
    else {
      console.error('User not available');
    }
  }

  logout(): void {
    this.authService.logout();  // Call the logout method in AuthService

    // Optionally, navigate to login page after logging out
    this.router.navigate(['/login']);
  }
}
