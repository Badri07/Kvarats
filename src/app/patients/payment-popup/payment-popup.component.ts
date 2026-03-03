import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientPaymentRequestDto, PaymentSubmissionDto } from '../../models/payment.models';

@Component({
  selector: 'app-payment-popup',
  standalone: false,
  templateUrl: './payment-popup.component.html',
  styleUrls: ['./payment-popup.component.scss']
})
export class PaymentPopupComponent implements OnInit {
  @Input() paymentRequest!: PatientPaymentRequestDto;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() paymentSubmitted = new EventEmitter<PaymentSubmissionDto>();

  paymentForm: PaymentSubmissionDto = {
    paymentRequestId: '',
    amountPaid: 0,
    paymentMethod: 'Credit Card',
    transactionReference: '',
    notes: ''
  };

  selectedFile: File | null = null;
  isSubmitting = false;

  paymentMethods = [
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'UPI',
    'Cash',
    'Check'
  ];

  ngOnInit() {
    if (this.paymentRequest) {
      this.paymentForm.paymentRequestId = this.paymentRequest.id;
      this.paymentForm.amountPaid = this.paymentRequest.balance;
    }
  }

  onClose() {
    this.close.emit();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (images only)
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
        this.paymentForm.paymentScreenshot = file;
      } else {
        alert('Please select an image file for the payment screenshot.');
        event.target.value = '';
      }
    }
  }

  onSubmit() {
    if (this.validateForm()) {
      this.isSubmitting = true;
      
      // Simulate API call delay
      setTimeout(() => {
        this.paymentSubmitted.emit({ ...this.paymentForm });
        this.isSubmitting = false;
        this.resetForm();
        this.onClose();
      }, 1500);
    }
  }

  private validateForm(): boolean {
    if (!this.paymentForm.amountPaid || this.paymentForm.amountPaid <= 0) {
      alert('Please enter a valid payment amount.');
      return false;
    }

    if (this.paymentForm.amountPaid > this.paymentRequest.balance) {
      alert('Payment amount cannot exceed the balance due.');
      return false;
    }

    if (!this.paymentForm.transactionReference?.trim()) {
      alert('Please enter a transaction reference or ID.');
      return false;
    }

    return true;
  }

  private resetForm() {
    this.paymentForm = {
      paymentRequestId: this.paymentRequest.id,
      amountPaid: this.paymentRequest.balance,
      paymentMethod: 'Credit Card',
      transactionReference: '',
      notes: ''
    };
    this.selectedFile = null;
  }

  getFileName(): string {
    return this.selectedFile ? this.selectedFile.name : '';
  }
}