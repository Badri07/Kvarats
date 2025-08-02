import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsuranceEraeobComponent } from './insurance-eraeob.component';

describe('InsuranceEraeobComponent', () => {
  let component: InsuranceEraeobComponent;
  let fixture: ComponentFixture<InsuranceEraeobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InsuranceEraeobComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InsuranceEraeobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
