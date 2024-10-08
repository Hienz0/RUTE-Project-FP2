import { Component, ElementRef, ViewChild } from '@angular/core';


@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  @ViewChild('aboutUs') aboutUs!: ElementRef;

  scrollToSection() {
    this.aboutUs.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }


}
