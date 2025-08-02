import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuicksbooksConnectionComponent } from './quicksbooks-connection.component';

describe('QuicksbooksConnectionComponent', () => {
  let component: QuicksbooksConnectionComponent;
  let fixture: ComponentFixture<QuicksbooksConnectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuicksbooksConnectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuicksbooksConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
