import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccommodationDetailComponent } from './accommodation-detail.component';

describe('AccommodationDetailComponent', () => {
  let component: AccommodationDetailComponent;
  let fixture: ComponentFixture<AccommodationDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccommodationDetailComponent]
    });
    fixture = TestBed.createComponent(AccommodationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
