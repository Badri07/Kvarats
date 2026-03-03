import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientInsurancesComponent } from './patient-insurances.component';

describe('PatientInsurancesComponent', () => {
  let component: PatientInsurancesComponent;
  let fixture: ComponentFixture<PatientInsurancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientInsurancesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientInsurancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
