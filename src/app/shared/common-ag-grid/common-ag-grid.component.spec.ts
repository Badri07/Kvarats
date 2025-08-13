import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonAgGridComponent } from './common-ag-grid.component';

describe('CommonAgGridComponent', () => {
  let component: CommonAgGridComponent;
  let fixture: ComponentFixture<CommonAgGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommonAgGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonAgGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
