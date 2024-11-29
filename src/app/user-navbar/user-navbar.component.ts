import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

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
  isDropdownOpen = false;
  @ViewChild('dropdownButton') dropdownButton!: ElementRef;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
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
}
