import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentRequestService } from '../../services/payment-request.service';
import { BreadcrumbService } from '../../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-payment-request-invoice-view',
  standalone: false,
  templateUrl: './payment-request-invoice-view.component.html',
  styleUrl: './payment-request-invoice-view.component.scss'
})
export class PaymentRequestInvoiceViewComponent implements OnInit {

  payment: any;
  loading = true;
  error = '';
  logo: string = '/images/LogoLatest.png';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentRequestService: PaymentRequestService
  ) {}

  public breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
    { label: 'Billing Payments', url: 'billing/payments' },
    { label: 'View Payments', url: '' },
  ]);
    const requestId = this.route.snapshot.paramMap.get('id');
    if (!requestId) {
      this.error = 'Invalid payment request';
      this.loading = false;
      return;
    }

    this.paymentRequestService.getPaymentRequestById(requestId).subscribe({
      next: (res: any) => {
        // your API returns { success, data }
        this.payment = res.data ?? res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load invoice';
        this.loading = false;
      }
    });
  }

  back(): void {
    this.router.navigate(['/billing/payments']);
  }
}
