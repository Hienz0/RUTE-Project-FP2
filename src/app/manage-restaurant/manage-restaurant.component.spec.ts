import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRestaurantComponent } from './manage-restaurant.component';

describe('ManageRestaurantComponent', () => {
  let component: ManageRestaurantComponent;
  let fixture: ComponentFixture<ManageRestaurantComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageRestaurantComponent]
    });
    fixture = TestBed.createComponent(ManageRestaurantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
