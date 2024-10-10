import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizeProfileComponent } from './customize-profile.component';

describe('CustomizeProfileComponent', () => {
  let component: CustomizeProfileComponent;
  let fixture: ComponentFixture<CustomizeProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomizeProfileComponent]
    });
    fixture = TestBed.createComponent(CustomizeProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
