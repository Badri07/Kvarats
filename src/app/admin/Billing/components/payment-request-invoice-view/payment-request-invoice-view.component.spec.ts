import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentRequestInvoiceViewComponent } from './payment-request-invoice-view.component';

describe('PaymentRequestInvoiceViewComponent', () => {
  let component: PaymentRequestInvoiceViewComponent;
  let fixture: ComponentFixture<PaymentRequestInvoiceViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentRequestInvoiceViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentRequestInvoiceViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
