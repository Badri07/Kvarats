import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonPaginationComponent } from './common-pagination.component';

describe('CommonPaginationComponent', () => {
  let component: CommonPaginationComponent;
  let fixture: ComponentFixture<CommonPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommonPaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
