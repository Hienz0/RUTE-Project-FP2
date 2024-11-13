import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageAccommodationComponent } from './manage-accommodation.component';

describe('ManageAccommodationComponent', () => {
  let component: ManageAccommodationComponent;
  let fixture: ComponentFixture<ManageAccommodationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageAccommodationComponent]
    });
    fixture = TestBed.createComponent(ManageAccommodationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
