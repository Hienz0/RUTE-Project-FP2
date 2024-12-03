import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeKey = 'theme'; // Key untuk localStorage
  private defaultTheme = 'light'; // Tema default

  constructor() {
    this.applyTheme(this.getTheme());
  }

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.themeKey, theme);
    this.applyTheme(theme);
  }

  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(this.themeKey) as 'light' | 'dark') || this.defaultTheme;
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }
}
