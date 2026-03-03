import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPatientAssessmentsComponent } from './list-patient-assessments.component';

describe('ListPatientAssessmentsComponent', () => {
  let component: ListPatientAssessmentsComponent;
  let fixture: ComponentFixture<ListPatientAssessmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListPatientAssessmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListPatientAssessmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
