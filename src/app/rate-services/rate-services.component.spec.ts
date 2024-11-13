import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RateServicesComponent } from './rate-services.component';

describe('RateServicesComponent', () => {
  let component: RateServicesComponent;
  let fixture: ComponentFixture<RateServicesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RateServicesComponent]
    });
    fixture = TestBed.createComponent(RateServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
