import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransportationServicesComponent } from './transportation-services.component';

describe('TransportationServicesComponent', () => {
  let component: TransportationServicesComponent;
  let fixture: ComponentFixture<TransportationServicesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransportationServicesComponent]
    });
    fixture = TestBed.createComponent(TransportationServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
