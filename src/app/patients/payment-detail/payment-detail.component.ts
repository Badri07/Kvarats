// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { PatientPaymentRequestDto } from '../../models/payment.models';

// @Component({
//   selector: 'app-payment-detail',
//   standalone: false,
//   templateUrl: './payment-detail.component.html',
//   styleUrls: ['./payment-detail.component.scss']
// })
// export class PaymentDetailComponent {
//   @Input() paymentRequest!: PatientPaymentRequestDto;
//   @Output() back = new EventEmitter<void>();
//   @Output() makePayment = new EventEmitter<PatientPaymentRequestDto>();

//   onBack() {
//     this.back.emit();
//   }

//   onMakePayment() {
//     this.makePayment.emit(this.paymentRequest);
//   }

//   getStatusClass(): string {
//     const baseClasses = 'status-badge text-sm';
//     switch (this.paymentRequest.status.toLowerCase()) {
//       case 'paid':
//         return `${baseClasses} status-paid`;
//       case 'pending':
//         return `${baseClasses} status-pending`;
//       case 'overdue':
//         return `${baseClasses} status-overdue`;
//       case 'partial':
//         return `${baseClasses} status-partial`;
//       default:
//         return `${baseClasses} status-pending`;
//     }
//   }

//   getPaidAmount(): number {
//     return this.paymentRequest.transactions
//       .filter(t => t.isSuccessful)
//       .reduce((sum, t) => sum + t.amountPaid, 0);
//   }

//   canMakePayment(): boolean {
//     return this.paymentRequest.balance > 0;
//   }
// }