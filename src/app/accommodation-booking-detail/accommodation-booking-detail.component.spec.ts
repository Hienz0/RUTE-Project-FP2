import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccommodationBookingDetailComponent } from './accommodation-booking-detail.component';

describe('AccommodationBookingDetailComponent', () => {
  let component: AccommodationBookingDetailComponent;
  let fixture: ComponentFixture<AccommodationBookingDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccommodationBookingDetailComponent]
    });
    fixture = TestBed.createComponent(AccommodationBookingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
