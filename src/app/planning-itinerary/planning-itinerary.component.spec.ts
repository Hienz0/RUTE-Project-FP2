import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanningItineraryComponent } from './planning-itinerary.component';

describe('PlanningItineraryComponent', () => {
  let component: PlanningItineraryComponent;
  let fixture: ComponentFixture<PlanningItineraryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlanningItineraryComponent]
    });
    fixture = TestBed.createComponent(PlanningItineraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
