import { Component, AfterViewInit, OnInit } from '@angular/core';
import { WeatherService } from '../services/weather.service';

@Component({
  selector: 'app-weather-widget',
  template: `
<div style="text-align: center; padding: 20px; margin-bottom: 20px; background-color: #f9f9f9; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
  <a 
    class="weatherwidget-io" 
    href="https://forecast7.com/en/n8d51115d26/ubud/" 
    data-label_1="UBUD" 
    data-label_2="WEATHER" 
    data-theme="beige" 
    style="text-decoration: none; color: #6b705c; font-weight: bold; font-size: 1.2rem;">
    UBUD WEATHER
  </a>
</div>

  `,
  styles: [],
})

// style="display: inline-block; width: 420px;">

export class WeatherWidgetComponent implements OnInit,AfterViewInit {
  weather: any;

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    this.weatherService.getWeather().subscribe(
      (data) => {
        this.weather = data; // Assign the weather data to a variable
        console.log('Weather data:', this.weather);
      },
      (error) => {
        console.error('Error fetching weather data:', error);
      }
    );
  }
  ngAfterViewInit(): void {
    this.loadWeatherWidgetScript();
  }

  loadWeatherWidgetScript(): void {
    const scriptId = 'weatherwidget-io-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://weatherwidget.io/js/widget.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }
}
