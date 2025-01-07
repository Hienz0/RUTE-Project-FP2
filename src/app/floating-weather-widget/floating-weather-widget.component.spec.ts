import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingWeatherWidgetComponent } from './floating-weather-widget.component';

describe('FloatingWeatherWidgetComponent', () => {
  let component: FloatingWeatherWidgetComponent;
  let fixture: ComponentFixture<FloatingWeatherWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FloatingWeatherWidgetComponent]
    });
    fixture = TestBed.createComponent(FloatingWeatherWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
