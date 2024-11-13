import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingTourGuideComponent } from './booking-tour-guide.component';

describe('BookingTourGuideComponent', () => {
  let component: BookingTourGuideComponent;
  let fixture: ComponentFixture<BookingTourGuideComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BookingTourGuideComponent]
    });
    fixture = TestBed.createComponent(BookingTourGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
