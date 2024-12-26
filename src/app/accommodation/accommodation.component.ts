import { Component, OnInit, Renderer2, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ServicesService } from '../services/services.service';
import { AuthService } from '../services/auth.service';
import { switchMap, map } from 'rxjs/operators'; // Import necessary operators
import { forkJoin } from 'rxjs'; // Import forkJoin
import { WeatherService } from '../services/weather.service';
import { trigger, transition, style, animate } from '@angular/animations';



@Component({
  selector: 'app-accommodation',
  templateUrl: './accommodation.component.html',
  styleUrls: ['./accommodation.component.css'],
  animations: [
    trigger('fadeAnimation', [
      transition(':leave', [ // Triggered when the element is removed
        style({ opacity: 1, transform: 'scale(1)' }),
        animate('200ms ease-out', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class AccommodationComponent implements OnInit {
  accommodationServices: any[] = [];
  currentUser: any;
  Math = Math;
  isDayTime: boolean = true;
  // frameStyle: Partial<CSSStyleDeclaration> = {
  //   position: 'absolute',
  //   top: '100px',
  //   left: '100px',
  //   cursor: 'grab'
  // };

  frameStyle: any = {
    position: 'absolute',
    bottom: '25px', // Distance from the bottom of the screen
    right: '25px', // Distance from the right side of the screen
    cursor: 'grab',
    zIndex: 9999  // Ensures the element stays on top
  };
  
  
  weatherCondition: string = 'rainy';
  weather: any;
  location: string = 'Ubud'; // Hardcoded location name
  currentTime: string = ''; // Dynamic clock
  showBackToPlanningButton = false;



  constructor(private servicesService: ServicesService, private router: Router, private route: ActivatedRoute, private authService: AuthService, private weatherService: WeatherService, private renderer: Renderer2) {}

  ngOnInit(): void {
    // this.loadGoogleTranslateScript();
    // // chatbot
    //     // Add the first script
    //     const chtlConfigScript = this.renderer.createElement('script');
    //     chtlConfigScript.type = 'text/javascript';
    //     chtlConfigScript.text = `
    //       window.chtlConfig = {
    //         chatbotId: "4482333918"
    //       };
    //     `;
    //     this.renderer.appendChild(document.body, chtlConfigScript);
    
    //     // Add the second script
    //     const chatlingScript = this.renderer.createElement('script');
    //     chatlingScript.src = 'https://chatling.ai/js/embed.js';
    //     chatlingScript.async = true;
    //     chatlingScript.type = 'text/javascript';
    //     chatlingScript.id = 'chatling-embed-script';
    //     chatlingScript.dataset.id = '4482333918';
    //     this.renderer.appendChild(document.body, chatlingScript);


    //     //chatbot closed

    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    this.route.queryParams.subscribe(params => {
      this.showBackToPlanningButton = !!params['planning-itinerary'];
    });
    
     // Check if it's day or night
     this.setDayNight();
      // Set the background style for the frame
    this.setFrameBackground();
    this.loadAccommodationServices();

    this.weatherService.getWeather().subscribe(
      (data) => {
        this.weather = data; // Assign the weather data to a variable
        console.log('Weather data:', this.weather);
        this.updateWeatherCondition(this.weather.current.icon);
      },
      (error) => {
        console.error('Error fetching weather data:', error);
      }
    );

    this.updateClock(); // Initialize the clock
    setInterval(() => {
      this.updateClock(); // Update the clock every minute
    }, 1000);
  }

  loadGoogleTranslateScript(): void {
    const scriptId = 'google-translate';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);

      // Attach the initialization function to the global scope
      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: 'en' },
          'google_translate_element'
        );
      };
    }
  }

    // Function to update the current time
    updateClock() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      this.currentTime = `${hours}:${minutes}`;
    }

    // Method to check if it's day or night based on current time
    setDayNight(): void {
// Daytime is between 6 AM and 6 PM
const currentHour = new Date().getHours();
this.isDayTime = currentHour >= 6 && currentHour < 18; 
    }

    setFrameBackground(): void {
      if (this.isDayTime) {
        // Set the sky to blue during the day
        this.frameStyle = {
          ...this.frameStyle, // Keep existing properties
          backgroundImage: 'linear-gradient(to top, #3a8dff, #61a6f9, #a2c8f9, #e0f3ff)'
        };
      } else {
        // Set the background to night-like colors
        this.frameStyle = {
          ...this.frameStyle, // Keep existing properties
          backgroundImage: 'linear-gradient(to top, #40334f, #2f273c, #272232, #201c29)'
        };
      }
    }
    

    getWeatherProverb(): string {
      switch (this.weatherCondition) {
        case 'rainy':
          return '“Frogs croaking in the lagoon,\nMeans rain will come real soon.”';
        case 'cloudy':
          return '“Gray clouds across the skies,\nA storm is nigh, to no surprise.”';
        case 'clear':
          return '“Clear skies and the sun’s bright ray,\nPromise a lovely day today.”';
        default:
          return '“Nature holds its clues in view,\nFor what the weather will soon do.”';
      }
    }

      // Method to convert wind direction from degrees to cardinal direction
  getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

    // Update weather condition based on the icon
    updateWeatherCondition(icon: string) {
      if (icon === 'rain') {
        this.weatherCondition = 'rainy';
      } else if (icon === 'cloudy') {
        this.weatherCondition = 'cloudy';
      } else if (icon === 'clear-day') {
        this.weatherCondition = 'clear';
      } else {
        this.weatherCondition = 'clear';
      }
    }
  

  loadAccommodationServices(): void {
    this.servicesService.getAccommodationServices().pipe(
      // Map over the services data and fetch the ratings for each service
      switchMap((services: any[]) => {
        return forkJoin(
          services.map((service: any) => 
            this.servicesService.getServiceRating(service._id).pipe(
              map((ratingData: any) => ({
                ...service,
                averageRating: ratingData?.averageRating ?? 0,
                reviewCount: ratingData?.reviewCount ?? 0
              }))
            )
          )
        );
      })
    ).subscribe(
      (accommodationServices: any[]) => {
        this.accommodationServices = accommodationServices;
      },
      (error) => {
        console.error('Error fetching accommodation services', error);
      }
    );
  }

  getStarIcons(rating: number): string[] {
    const filledStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - filledStars - halfStar;
    return [
      ...Array(filledStars).fill('★'),
      ...Array(halfStar).fill('☆'),
      ...Array(emptyStars).fill('✩')
    ];
  }

  

  // Navigate to the details page when a service is clicked
  goToDetail(id: string): void {
    const queryParams = this.route.snapshot.queryParams;
    this.router.navigate(['/accommodation', id], { queryParams });
  }



  // weather widget related



  private isDragging = false;
  private startX = 0;
  private startY = 0;

  onDragStart(event: MouseEvent) {
    this.isDragging = true;
  
    // Get the exact position of the element including any scrolling
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const computedStyle = window.getComputedStyle(event.target as HTMLElement);
  
    // Correctly calculate the `left` and `top` values
    const left = rect.left - parseFloat(computedStyle.marginLeft);
    const top = rect.top - parseFloat(computedStyle.marginTop);
  
    // Calculate the offsets to start dragging smoothly
    this.startX = event.clientX - left;
    this.startY = event.clientY - top;
  
    // Change cursor to indicate dragging
    this.frameStyle.cursor = 'grabbing';
  }
  
  

  onDragEnd() {
    this.isDragging = false;
    this.frameStyle.cursor = 'grab';
  }

  onDragMove(event: MouseEvent) {
    if (this.isDragging) {
      // Calculate new `left` and `top` positions
      const newLeft = event.clientX - this.startX;
      const newTop = event.clientY - this.startY;
  
      // Apply the new position
      this.frameStyle.left = `${newLeft}px`;
      this.frameStyle.top = `${newTop}px`;
  
      // Remove `bottom` and `right` to prevent conflicting styles
      delete this.frameStyle.bottom;
      delete this.frameStyle.right;
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp() {
    this.isDragging = false;
    this.frameStyle.cursor = 'grab';
  }


  isWidgetVisible = true; // Controls the visibility of the widget

closeWidget() {
  this.isWidgetVisible = false;
}

}