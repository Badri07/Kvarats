import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import {
  PatientPaymentRequest,
  CreatePaymentTransactionDto
} from '../../models/payment.models';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-payment-detail',
  standalone: false,
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss']
})
export class PaymentDetailComponent implements OnInit {
  paymentRequest: PatientPaymentRequest | null = null;
  loading = true;
  error: string | null = null;
  showPaymentForm = false;
  processingPayment = false;
  paymentSuccess = false;
  paymentError: string | null = null;
  fileError: string | null = null;
  logo: string = '/images/LogoLatest.png';

  @ViewChild('fileInput') fileInput!: ElementRef;

  paymentForm = {
    amount: 0,
    paymentMethod: 'card',
    notes: '',
    file: null as File | null
  };

  paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'online', label: 'Online' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');

  if (!id) {
    this.error = 'Payment request ID not found';
    this.loading = false;
    return;
  }

  this.loadPaymentRequest(id);

  // 👇 NEW: listen for intent
  this.route.queryParams.subscribe(params => {
    if (params['payNow'] === 'true') {
      this.openPaymentForm();
    }
  });
}


  loadPaymentRequest(id: string): void {
    this.loading = true;
    this.error = null;

    this.paymentService.getPaymentRequestById(id).subscribe({
      next: (request) => {
        this.paymentRequest = request;
        this.paymentForm.amount = this.getRemainingBalance();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load payment request. Please try again later.';
        this.loading = false;
        console.error('Error loading payment request:', err);
      }
    });
  }

  getTotalPaid(): number {
    if (!this.paymentRequest) return 0;
    return this.paymentRequest.transactions
      .filter(t => t.isSuccessful)
      .reduce((sum, t) => sum + t.amountPaid, 0);
  }

  getRemainingBalance(): number {
    if (!this.paymentRequest) return 0;
    return this.paymentRequest.finalAmount - this.getTotalPaid();
  }

  canMakePayment(): boolean {
    if (!this.paymentRequest) return false;
    return this.paymentRequest.status !== 'paid' &&
           this.paymentRequest.status !== 'cancelled' &&
           this.getRemainingBalance() > 0;
  }

  openPaymentForm(): void {
    this.showPaymentForm = true;
    this.paymentSuccess = false;
    this.paymentError = null;
    this.fileError = null;
  }

  closePaymentForm(): void {
    this.showPaymentForm = false;
    this.resetPaymentForm();
  }

  resetPaymentForm(): void {
    this.paymentForm = {
      amount: this.getRemainingBalance(),
      paymentMethod: 'card',
      notes: '',
      file: null
    };
    this.paymentError = null;
    this.fileError = null;
  }

  // File upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'File size must be less than 5MB';
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 
        'image/png', 
        'image/jpg', 
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        this.fileError = 'Only images (JPG, PNG) and documents (PDF, DOC) are allowed';
        return;
      }
      
      this.paymentForm.file = file;
      this.fileError = null;
    }
  }

  removeFile(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.paymentForm.file = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.fileError = null;
  }

  // Generate transaction reference
  private generateTransactionReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  validatePayment(): boolean {
    const remainingBalance = this.getRemainingBalance();

    if (this.paymentForm.amount <= 0) {
      this.paymentError = 'Payment amount must be greater than zero';
      return false;
    }

    if (this.paymentForm.amount > remainingBalance) {
      this.paymentError = `Payment amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`;
      return false;
    }

    if (!this.paymentForm.paymentMethod) {
      this.paymentError = 'Please select a payment method';
      return false;
    }

    return true;
  }

  submitPayment(): void {
    if (!this.paymentRequest || !this.validatePayment()) {
      return;
    }

    this.processingPayment = true;
    this.paymentError = null;

    // Prepare transaction data
    const transaction: any = {
      paymentRequestId: this.paymentRequest.id,
      amountPaid: this.paymentForm.amount,
      paymentMethod: this.paymentForm.paymentMethod,
      notes: this.paymentForm.notes || undefined,
      transactionReference: this.generateTransactionReference()
    };

    // If file is attached, upload it first
    if (this.paymentForm.file) {
      this.uploadReceiptFile().then((fileInfo) => {
        // Add file info to transaction
        if (fileInfo) {
          transaction.receiptUrl = fileInfo.url;
          transaction.receiptContentType = fileInfo.contentType;
        }
        this.processPayment(transaction);
      }).catch((error) => {
        this.processingPayment = false;
        this.paymentError = 'Failed to upload file. Please try again.';
        console.error('File upload error:', error);
      });
    } else {
      this.processPayment(transaction);
    }
  }

  // Helper method for uploading file
  private async uploadReceiptFile(): Promise<{url: string, contentType: string} | null> {
    if (!this.paymentForm.file) return null;
    
    try {
      // Here you would implement actual file upload to your server
      // For example:
      // const formData = new FormData();
      // formData.append('file', this.paymentForm.file);
      // const response = await this.paymentService.uploadReceipt(formData).toPromise();
      // return { url: response.fileUrl, contentType: this.paymentForm.file.type };
      
      // For now, simulate successful upload and return file info
      // Replace this with your actual upload logic
      const fileName = `receipt_${Date.now()}_${this.paymentForm.file.name}`;
      const fileType = this.paymentForm.file.type;
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // This is where you would return the actual uploaded file URL
      // For demo purposes, we're returning a placeholder
      return { 
        url: `/uploads/receipts/${fileName}`, 
        contentType: fileType 
      };
      
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  private processPayment(transaction: CreatePaymentTransactionDto): void {
    this.paymentService.createPaymentTransaction(transaction).subscribe({
      next: (result) => {
        this.processingPayment = false;
        this.paymentSuccess = true;

        setTimeout(() => {
          this.closePaymentForm();
          this.loadPaymentRequest(this.paymentRequest!.id);
        }, 2000);
      },
      error: (err) => {
        this.processingPayment = false;
        this.paymentError = 'Payment failed. Please try again or contact support.';
        console.error('Payment error:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['patient/payment']);
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

// Update these methods in your component
getPrimaryService(): any {
  if (!this.paymentRequest || 
      !this.paymentRequest.services || 
      this.paymentRequest.services.length === 0) {
    return null;
  }
  return this.paymentRequest.services[0];
}

getServiceDescription(): string {
  const service = this.getPrimaryService();
  // Based on your API, the description is in the 'description' field directly
  return service?.description || service?.serviceName || '—';
}

getMeetingType(): string {
  const service = this.getPrimaryService();
  // Based on your API, meeting type is in 'meetingTypeName'
  return service?.meetingTypeName || '—';
}

getServiceDate(): Date | null {
  const service = this.getPrimaryService();
  return service?.serviceDate ? new Date(service.serviceDate) : null;
}

downloadPdf(): void {
  const element = document.getElementById('invoice-content');

  if (!element || !this.paymentRequest) {
    return;
  }

  const options = {
    margin: 10,
    filename: `Invoice-${this.paymentRequest.id.substring(0, 8).toUpperCase()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  html2pdf().from(element).set(options).save();
}

}