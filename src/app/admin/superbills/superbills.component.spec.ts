import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperbillsComponent } from './superbills.component';

describe('SuperbillsComponent', () => {
  let component: SuperbillsComponent;
  let fixture: ComponentFixture<SuperbillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SuperbillsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuperbillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
