import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientPaymentRequestDto } from '../../models/payment.models';

@Component({
  selector: 'app-payment-card',
  standalone: false,
  templateUrl: './payment-card.component.html',
  styleUrls: ['./payment-card.component.scss']
})
export class PaymentCardComponent {
  @Input() paymentRequest!: PatientPaymentRequestDto;
  @Output() cardClick = new EventEmitter<PatientPaymentRequestDto>();
  @Output() makePayment = new EventEmitter<PatientPaymentRequestDto>();

  onCardClick() {
    this.cardClick.emit(this.paymentRequest);
  }

  onMakePayment(event: Event) {
    event.stopPropagation();
    this.makePayment.emit(this.paymentRequest);
  }

  getStatusClass(): string {
    const baseClasses = 'status-badge';
    switch (this.paymentRequest.status.toLowerCase()) {
      case 'paid':
        return `${baseClasses} status-paid`;
      case 'pending':
        return `${baseClasses} status-pending`;
      case 'overdue':
        return `${baseClasses} status-overdue`;
      case 'partial':
        return `${baseClasses} status-partial`;
      default:
        return `${baseClasses} status-pending`;
    }
  }

  getStatusDisplay(): string {
    return this.paymentRequest.status;
  }

  getPaidAmount(): number {
    return this.paymentRequest.transactions
      .filter(t => t.isSuccessful)
      .reduce((sum, t) => sum + t.amountPaid, 0);
  }

  canMakePayment(): boolean {
    return this.paymentRequest.balance > 0;
  }
}