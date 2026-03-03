import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { PatientPaymentRequest } from '../../models/payment.models';
import { AuthService } from '../../../service/auth/auth.service';

@Component({
  selector: 'app-payment-requests-list',
  standalone: false,
  templateUrl: './payment-requests-list.component.html',
  styleUrls: ['./payment-requests-list.component.scss']
})
export class PaymentRequestsListComponent implements OnInit {
  paymentRequests: PatientPaymentRequest[] = [];
  loading = true;
  error: string | null = null;
  patientId: string = '';

  constructor(
    private paymentService: PaymentService,
    private router: Router
  ) {}

  public _authService = inject(AuthService);

  ngOnInit(): void {

    this.patientId = this._authService.getPatientId();
    if (this.patientId) {
      this.loadPaymentRequests();
    } else {
      this.error = 'Patient ID not found';
      this.loading = false;
    }
  }

  loadPaymentRequests(): void {
    this.loading = true;
    this.error = null;

    this.paymentService.getPaymentRequestsByPatientId(this.patientId).subscribe({
      next: (requests) => {
        this.paymentRequests = requests;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load payment requests. Please try again later.';
        this.loading = false;
        console.error('Error loading payment requests:', err);
      }
    });
  }

  viewPaymentRequest(id: string, payNow = false): void {
  this.router.navigate(
    ['patient/payment-request', id],
    payNow ? { queryParams: { payNow: true } } : {}
  );
}


  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'partially_paid':
        return 'status-partially-paid';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partially_paid':
        return 'Partially Paid';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getTotalPaid(request: PatientPaymentRequest): number {
    return request.transactions
      .filter(t => t.isSuccessful)
      .reduce((sum, t) => sum + t.amountPaid, 0);
  }

  getRemainingBalance(request: PatientPaymentRequest): number {
    return request.finalAmount - this.getTotalPaid(request);
  }

  canMakePayment(request: PatientPaymentRequest): boolean {
    return request.status !== 'paid' && request.status !== 'cancelled';
  }
   getTotalBalanceDue(): number {
    if (!this.paymentRequests || this.paymentRequests.length === 0) return 0;
    return this.paymentRequests.reduce((sum, request) => {
      const paid = request.transactions
        .filter(t => t.isSuccessful)
        .reduce((transactionSum, t) => transactionSum + t.amountPaid, 0);
      return sum + (request.finalAmount - paid);
    }, 0);
  }getTotalAmount(): number {
    if (!this.paymentRequests || this.paymentRequests.length === 0) return 0;
    return this.paymentRequests.reduce((sum, request) => sum + request.finalAmount, 0);
  }

  getTotalPaidAmount(): number {
    if (!this.paymentRequests || this.paymentRequests.length === 0) return 0;
    return this.paymentRequests.reduce((sum, request) => {
      const paid = request.transactions
        .filter(t => t.isSuccessful)
        .reduce((transactionSum, t) => transactionSum + t.amountPaid, 0);
      return sum + paid;
    }, 0);
  }
}
