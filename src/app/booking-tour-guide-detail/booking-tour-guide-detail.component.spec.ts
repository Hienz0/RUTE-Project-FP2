import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingTourGuideDetailComponent } from './booking-tour-guide-detail.component';

describe('BookingTourGuideDetailComponent', () => {
  let component: BookingTourGuideDetailComponent;
  let fixture: ComponentFixture<BookingTourGuideDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BookingTourGuideDetailComponent]
    });
    fixture = TestBed.createComponent(BookingTourGuideDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
