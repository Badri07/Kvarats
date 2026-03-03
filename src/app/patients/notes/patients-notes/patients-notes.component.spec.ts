import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientsNotesComponent } from './patients-notes.component';

describe('PatientsNotesComponent', () => {
  let component: PatientsNotesComponent;
  let fixture: ComponentFixture<PatientsNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientsNotesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientsNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
