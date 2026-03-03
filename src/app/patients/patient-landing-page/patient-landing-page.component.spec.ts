import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientLandingPageComponent } from './patient-landing-page.component';

describe('PatientLandingPageComponent', () => {
  let component: PatientLandingPageComponent;
  let fixture: ComponentFixture<PatientLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientLandingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
