import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterAsProviderComponent } from './register-as-provider.component';

describe('RegisterAsProviderComponent', () => {
  let component: RegisterAsProviderComponent;
  let fixture: ComponentFixture<RegisterAsProviderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegisterAsProviderComponent]
    });
    fixture = TestBed.createComponent(RegisterAsProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
