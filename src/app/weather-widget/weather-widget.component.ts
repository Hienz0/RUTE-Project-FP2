import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-weather-widget',
  template: `
    <div>
      <a 
        class="weatherwidget-io" 
        href="https://forecast7.com/en/n8d51115d26/ubud/" 
        data-label_1="UBUD" 
        data-label_2="WEATHER" 
        data-theme="weather_one">
        UBUD WEATHER
      </a>
    </div>
  `,
  styles: [],
})

// style="display: inline-block; width: 420px;">

export class WeatherWidgetComponent implements AfterViewInit {
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
