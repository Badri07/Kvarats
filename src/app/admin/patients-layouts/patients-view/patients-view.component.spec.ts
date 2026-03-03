import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientsViewComponent } from './patients-view.component';

describe('PatientsViewComponent', () => {
  let component: PatientsViewComponent;
  let fixture: ComponentFixture<PatientsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientsViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
