import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewRegisterComponent } from './review-register.component';

describe('ReviewRegisterComponent', () => {
  let component: ReviewRegisterComponent;
  let fixture: ComponentFixture<ReviewRegisterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewRegisterComponent]
    });
    fixture = TestBed.createComponent(ReviewRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
