import { Component, inject, OnInit } from '@angular/core';
import { PaymentService } from '../../service/patient/payment.service';
import { PatientPaymentRequestDto, PaymentSubmissionDto } from '../../models/payment.models';
import { AuthService } from '../../service/auth/auth.service';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
  standalone:false
})
export class PaymentsComponent implements OnInit {
  public authService = inject(AuthService);

  selectedPatientId!: string;
  paymentRequests: PatientPaymentRequestDto[] = [];
  filteredPaymentRequests: PatientPaymentRequestDto[] = [];
  paginatedPayments: PatientPaymentRequestDto[] = [];
  selectedPayment: PatientPaymentRequestDto | null = null;
  paymentRequestForPayment: PatientPaymentRequestDto | null = null;

  loading = false;
  searchQuery = '';
  statusFilter = '';
  showPaymentPopup = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
  // Get patientId first, then load payments
  this.selectedPatientId = this.authService.getPatientId();
  console.log('Patient ID from auth service:', this.selectedPatientId);
  
  if (this.selectedPatientId) {
    this.loadPaymentRequests();
  } else {
    console.error('Patient ID not found!');
    // Test with mock data
    this.paymentRequests = [
      {
        id: "test-id-123",
        patientId: "test-patient",
        invoiceDate: new Date(),
        totalAmount: 100,
        discountAmount: 10,
        finalAmount: 90,
        status: "pending",
        notes: "test note",
        services: [],
        transactions: [],
        balance: 90
      }
    ];
    this.filteredPaymentRequests = [...this.paymentRequests];
    this.updatePagination();
  }
}

loadPaymentRequests() {
  this.loading = true;
  console.log('Loading payments for patientId:', this.selectedPatientId);

  this.paymentService.getPaymentRequestsByPatientId(this.selectedPatientId)
    .subscribe({
      next: (response) => {
        console.log('Payment requests response:', response);

        // Check if response is an array (direct response) or has data property
        if (Array.isArray(response)) {
          // API returned array directly
          console.log('API returned array directly, length:', response.length);
          this.handleSuccessfulResponse(response);
        } else if (response?.success && Array.isArray(response.data)) {
          // API returned {success: true, data: [...]}
          console.log('API returned success object with data, length:', response.data.length);
          this.handleSuccessfulResponse(response.data);
        } else if (response?.data && Array.isArray(response.data)) {
          // API returned {data: [...]} without success property
          console.log('API returned data array, length:', response.data.length);
          this.handleSuccessfulResponse(response.data);
        } else {
          // No data found or unexpected format
          console.log('No payment data found or unexpected format');
          this.handleNoData();
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.loading = false;
        this.handleNoData();
      }
    });
}

private handleSuccessfulResponse(data: any[]) {
  if (data && data.length > 0) {
    this.paymentRequests = data;
    this.filteredPaymentRequests = [...this.paymentRequests];
    this.currentPage = 1;
    this.updatePagination();
    console.log('Payment data loaded successfully:', this.paymentRequests.length);
  } else {
    console.log('Empty data array received');
    this.handleNoData();
  }
}

private handleNoData() {
  this.paymentRequests = [];
  this.filteredPaymentRequests = [];
  this.paginatedPayments = [];
  this.totalPages = 0;
  console.log('Payment data cleared');
}


  /** Filters */
  onSearchChange() { this.applyFilters(); }
  onFilterChange() { this.applyFilters(); }

  private applyFilters() {
    let filtered = [...this.paymentRequests];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(pr =>
        pr.id.toLowerCase().includes(query) ||
        pr.notes.toLowerCase().includes(query) ||
        pr.services.some(s =>
          s.description?.toLowerCase().includes(query) ||
          s.cptCode?.toLowerCase().includes(query)
        )
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(pr =>
        pr.status.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }

    this.filteredPaymentRequests = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  /** Pagination */
  updatePagination() {
  console.log('Updating pagination with filtered payments:', this.filteredPaymentRequests.length);
  this.totalPages = Math.ceil(this.filteredPaymentRequests.length / this.itemsPerPage);
  console.log('Total pages:', this.totalPages);
  
  this.goToPage(this.currentPage);
}

goToPage(page: number) {
  if (page < 1 || page > this.totalPages) return;
  this.currentPage = page;

  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredPaymentRequests.length);

  this.paginatedPayments = this.filteredPaymentRequests.slice(startIndex, endIndex);
  console.log('Paginated payments:', this.paginatedPayments.length);
  console.log('Current page items:', this.paginatedPayments);
}

getStartIndex(): number {
  return (this.currentPage - 1) * this.itemsPerPage + 1;
}

getEndIndex(): number {
  return Math.min(this.currentPage * this.itemsPerPage, this.filteredPaymentRequests.length);
}




  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  /** Actions */
  onPaymentSelect(payment: PatientPaymentRequestDto) {
    this.selectedPayment = payment;
  }

  onBackToList() {
    this.selectedPayment = null;
  }

  onMakePayment(payment: PatientPaymentRequestDto) {
    this.paymentRequestForPayment = payment;
    this.showPaymentPopup = true;
  }

  onClosePaymentPopup() {
    this.showPaymentPopup = false;
    this.paymentRequestForPayment = null;
  }

  onPaymentSubmitted(paymentData: PaymentSubmissionDto) {
    console.log('Payment submitted:', paymentData);
    alert('Payment submitted successfully!');
    this.loadPaymentRequests();
  }

  /** Calculations for summary cards */
  getTotalOutstanding(): number {
    return this.paymentRequests.reduce((sum, pr) => sum + pr.balance, 0);
  }

  getTotalPaid(): number {
    return this.paymentRequests.reduce((sum, pr) =>
      sum + pr.transactions
        .filter(t => t.isSuccessful)
        .reduce((txnSum, t) => txnSum + t.amountPaid, 0), 0
    );
  }

  getPendingCount(): number {
    return this.paymentRequests.filter(pr =>
      pr.status.toLowerCase() === 'pending' || pr.balance > 0
    ).length;
  }

  trackByPaymentId(index: number, payment: PatientPaymentRequestDto): string {
    return payment.id;
  }
}
