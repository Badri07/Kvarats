import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientsRegistrationComponent } from './patients-registration.component';

describe('PatientsRegistrationComponent', () => {
  let component: PatientsRegistrationComponent;
  let fixture: ComponentFixture<PatientsRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientsRegistrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientsRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
