import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransportationProviderComponent } from './transportation-provider.component';

describe('TransportationProviderComponent', () => {
  let component: TransportationProviderComponent;
  let fixture: ComponentFixture<TransportationProviderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransportationProviderComponent]
    });
    fixture = TestBed.createComponent(TransportationProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
