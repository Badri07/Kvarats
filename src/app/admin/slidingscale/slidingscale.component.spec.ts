import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlidingscaleComponent } from './slidingscale.component';

describe('SlidingscaleComponent', () => {
  let component: SlidingscaleComponent;
  let fixture: ComponentFixture<SlidingscaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SlidingscaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlidingscaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
