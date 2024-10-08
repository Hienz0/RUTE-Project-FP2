import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewServicesComponent } from './review-services.component';

describe('ReviewServicesComponent', () => {
  let component: ReviewServicesComponent;
  let fixture: ComponentFixture<ReviewServicesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewServicesComponent]
    });
    fixture = TestBed.createComponent(ReviewServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
