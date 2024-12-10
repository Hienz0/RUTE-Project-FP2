import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-user-navbar',
  templateUrl: './user-navbar.component.html',
  styleUrls: ['./user-navbar.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      state('closed', style({ opacity: 0, transform: 'translateY(-10px)', display: 'none' })),
      state('open', style({ opacity: 1, transform: 'translateY(0)', display: 'block' })),
      transition('closed => open', [animate('300ms ease-out')]),
      transition('open => closed', [animate('200ms ease-in')]),
    ]),
  ],
})
export class UserNavbarComponent implements OnInit {

  currentUser: any;
  isDropdownOpen = false;
  @ViewChild('dropdownButton') dropdownButton!: ElementRef;
  isDarkMode: boolean = false;
  constructor(private authService: AuthService, private themeService: ThemeService) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
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
}
