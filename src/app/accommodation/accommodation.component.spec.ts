import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccommodationComponent } from './accommodation.component';

describe('AccommodationComponent', () => {
  let component: AccommodationComponent;
  let fixture: ComponentFixture<AccommodationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccommodationComponent]
    });
    fixture = TestBed.createComponent(AccommodationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
