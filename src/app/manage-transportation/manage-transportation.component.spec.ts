import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTransportationComponent } from './manage-transportation.component';

describe('ManageTransportationComponent', () => {
  let component: ManageTransportationComponent;
  let fixture: ComponentFixture<ManageTransportationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageTransportationComponent]
    });
    fixture = TestBed.createComponent(ManageTransportationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
