import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownValuesComponent } from './dropdown-values.component';

describe('DropdownValuesComponent', () => {
  let component: DropdownValuesComponent;
  let fixture: ComponentFixture<DropdownValuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DropdownValuesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropdownValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
