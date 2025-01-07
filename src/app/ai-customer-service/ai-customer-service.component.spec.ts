import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiCustomerServiceComponent } from './ai-customer-service.component';

describe('AiCustomerServiceComponent', () => {
  let component: AiCustomerServiceComponent;
  let fixture: ComponentFixture<AiCustomerServiceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AiCustomerServiceComponent]
    });
    fixture = TestBed.createComponent(AiCustomerServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
