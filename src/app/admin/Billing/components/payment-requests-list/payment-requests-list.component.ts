import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentRequestService } from '../../services/payment-request.service';
import { PatientPaymentRequestDto } from '../../models/payment-request.model';
import { BreadcrumbService } from '../../../../shared/breadcrumb/breadcrumb.service';
import { ColDef, GridApi, GridReadyEvent, GridOptions, CellClickedEvent } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { AgGridAngular } from 'ag-grid-angular';
import { TosterService } from '../../../../service/toaster/tostr.service';
import { DateFormatService } from '../../../../service/global-date/date-format-service';
import { AuthService } from '../../../../service/auth/auth.service';
import { OnDestroy } from '@angular/core';

@Component({
  selector: 'app-payment-requests-list',
  standalone: false,
  providers: [DatePipe],
  templateUrl: './payment-requests-list.component.html',
  styleUrls: ['./payment-requests-list.component.scss']
})
export class PaymentRequestsListComponent implements OnInit, OnDestroy {


   // 🔹 Global event handler references
  private markCompletedHandler!: (event: any) => void;
  private dateFormatChangedHandler!: () => void;

  // 🔹 Prevent duplicate action listeners
  private actionHandlersInitialized = false;

  private syncingIds = new Set<string>();

  // AG Grid properties
  gridApi!: GridApi;
  rowData: any[] = [];
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef;
  gridOptions: GridOptions;
  paginationPageSize = 10;
  paginationPageSizeSelector = [10, 20, 50, 100];
  
  // Filter properties
  filterStatus = '';
  filterPatientName = '';
  filterDateFrom = '';
  filterDateTo = '';
  
  // Data properties
  paymentRequests: any[] = [];
  loading = false;
  error = '';
  
  // Delete modal properties
  showDeleteModal = signal(false);
  paymentToDelete = signal<any>(null);
  isDeleting = signal(false);
  deleteError = signal<string | null>(null);
  
  // Page properties
  totalPages = 1;
  currentPage = 1;
  pageSize = 10;

  constructor(
    private paymentRequestService: PaymentRequestService,
    private router: Router,
    private datePipe: DatePipe,
  ) {
    this.defaultColDef = {
      sortable: true,
      resizable: true,
      filter: true,
      flex: 1,
      minWidth: 130
    };

    this.gridOptions = {
      rowSelection: 'multiple',
      suppressRowClickSelection: true,
      suppressCellFocus: true,
      onCellClicked: (event: CellClickedEvent) => {
        if (event.column.getColId() === 'actions') {
          return;
        }
      },
      onFirstDataRendered: (params: any) => {
        this.setupActionListeners();
      }
    };
  }

  public breadcrumbService = inject(BreadcrumbService);
  public _toastr = inject(TosterService);
  public dateFormatService = inject(DateFormatService);
  public authService = inject(AuthService);
   
ngOnInit(): void {
  this.breadcrumbService.setBreadcrumbs([
    { label: 'Billing Payments', url: 'billing/payments' },
    { label: 'Payment Requests', url: '' },
  ]);

  const userId = this.authService.getUserId();
  this.initializeColumnDefs();
  this.loadPaymentRequests();
  this.dateFormatService.initializeDateFormat(userId);

  // ✅ date format handler
  this.dateFormatChangedHandler = () => {
    this.refreshDateFormats();
  };
  window.addEventListener('dateFormatChanged', this.dateFormatChangedHandler);

  // ✅ sales receipt sync handler
  this.markCompletedHandler = (event: any) => {
    const requestId = event.detail;
    this.markPaymentRequestCompleted(requestId);
  };
  window.addEventListener('markCompleted', this.markCompletedHandler);
}
  

ngOnDestroy(): void {
    if (this.markCompletedHandler) {
      window.removeEventListener('markCompleted', this.markCompletedHandler);
    }

    if (this.dateFormatChangedHandler) {
      window.removeEventListener('dateFormatChanged', this.dateFormatChangedHandler);
    }

    this.actionHandlersInitialized = false;
  }

  initializeColumnDefs(): void {
    this.columnDefs = [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        filter: false,
        sortable: false,
        width: 40,
        maxWidth: 40,
        pinned: 'left',
        cellClass: ['ag-center-cell', 'no-focus-style'],
        headerClass: 'ag-center-header'
      },
      {
  headerName: 'Billing Date',
  field: 'invoiceDate',
  filter: false,
  cellRenderer: (params: any) => {
    const date = params.value
      ? this.formatDateForGrid(params.value)
      : '';

    const invoiceNum = params.data?.invoiceNumber
      ? `#${params.data.invoiceNumber}`
      : '';

    return `
      <div class="h-full flex items-center">
        <div class="leading-tight">
          <div class="text-sm font-medium text-gray-900">
            ${date}
          </div>
          ${invoiceNum ? `
            <div class="text-xs text-gray-500">
              ${invoiceNum}
            </div>` : ''}
        </div>
      </div>
    `;
  },
  cellClass: 'ag-cell-flex',
  width: 160
},
      {
        headerName: 'Patient',
        field: 'patientName',
        filter: false,
        cellRenderer: (params: any) => {
          const name = params.value || '';
          const initials = this.getInitials(name);
          return `
            <div class="flex items-center">
              <div class="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span class="text-blue-600 text-xs font-semibold">${initials}</span>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-900">${name}</div>
              </div>
            </div>
          `;
        },
        width: 180
      },
      {
        headerName: 'Total',
        field: 'finalAmount',
        filter: false,
        valueFormatter: this.currencyFormatter.bind(this),
        cellClass: 'font-medium text-gray-900',
        width: 120,
        maxWidth: 120,
        comparator: (valueA: number, valueB: number) => valueA - valueB
      },
      {
        headerName: 'Paid',
        field: 'amountPaid',
        filter: false,
        valueGetter: (params: any) => this.getTotalPaid(params.data),
        valueFormatter: this.currencyFormatter.bind(this),
        cellClass: 'font-medium text-green-600',
        width: 110,
        maxWidth: 110,
        comparator: (valueA: number, valueB: number) => valueA - valueB
      },
      {
  headerName: 'Due',
  field: 'amountDue',
  filter: false,
  valueGetter: (params: any) => this.getAmountDue(params.data),
  comparator: (valueA: number, valueB: number) => valueA - valueB,
  width: 100,
  maxWidth: 100,
  cellRenderer: (params: any) => {
    const due = this.getAmountDue(params.data);
    const dueClass =
      due === 0 ? 'text-green-600' :
      due > 0 ? 'text-red-600' :
      'text-gray-600';

    return `
      <div class="h-full flex items-center justify-end text-sm font-medium ${dueClass}">
        ${this.formatCurrency(due)}
      </div>
    `;
  }
},
      {
  headerName: 'Status',
  field: 'status',
  width: 140,
  maxWidth: 140,
  filter: false,
  cellRenderer: (params: any) => {
    const statusRaw = params.value || '';
    const status = statusRaw.toLowerCase();
    const statusText = this.capitalizeFirstLetter(statusRaw);

    let icon = '';
    let statusClass = '';

    switch (status) {
      case 'paid':
        statusClass = 'bg-green-100 text-green-700';
        icon = `
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd" />
          </svg>`;
        break;

      case 'partially paid':
        statusClass = 'bg-yellow-100 text-yellow-700';
        icon = `
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v5a1 1 0 00.293.707l2 2a1 1 0 101.414-1.414L11 11.586V7z"
              clip-rule="evenodd" />
          </svg>`;
        break;

      case 'pending':
        statusClass = 'bg-blue-100 text-blue-700';
        icon = `
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clip-rule="evenodd" />
          </svg>`;
        break;

      default:
        statusClass = 'bg-gray-100 text-gray-600';
        icon = `
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clip-rule="evenodd" />
          </svg>`;
    }

    return `
      <div class="flex items-center justify-center h-full">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
          ${icon}
          ${statusText}
        </span>
      </div>
    `;
  }
},
{
  headerName: 'Sync QBO Sales Receipt',
  field: 'salesReceipt',
  width: 200,
  maxWidth: 200,
  filter: false,
  sortable: false,
  cellRenderer: (params: any) => {
    const due = this.getAmountDue(params.data);
    const requestId = params.data.id;

    const transaction = params.data.transactions?.[0];
    const isQuickBooksSynced = transaction?.quickBooksSynced === true;

    // Case 1: Amount still due → dash
    if (due !== 0) {
      return `
        <div class="h-full flex items-center justify-center text-gray-400 text-xs">
          —
        </div>
      `;
    }

    // Case 2: Fully paid & already synced → green tick
    if (isQuickBooksSynced) {
      return `
        <div class="h-full flex items-center justify-center text-green-600">
          <i class="fas fa-check-circle text-sm" title="Sales Receipt synced"></i>
        </div>
      `;
    }

    // Case 3: Fully paid & not synced → sync button
    const isSyncing = this.isSyncing(requestId);

    return `
      <div class="flex items-center justify-center h-full">
        <button
          class="p-2 rounded-md transition-colors
            ${isSyncing
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}"
          title="${isSyncing ? 'Syncing...' : 'Create Sales Receipt'}"
          ${isSyncing ? 'disabled' : ''}
          onclick="event.stopPropagation(); window.dispatchEvent(
            new CustomEvent('markCompleted', { detail: '${requestId}' })
          )">
          <i class="fas fa-sync text-sm ${isSyncing ? 'animate-spin' : ''}"></i>
        </button>
      </div>
    `;
  },
  cellClass: 'ag-center-cell',
  headerClass: 'ag-center-header'
},
{
  headerName: 'QBO Receipt ID',
  field: 'quickBooksSalesReceiptId',
  width: 160,
  maxWidth: 160,
  filter: false,
  sortable: false,
  cellRenderer: (params: any) => {
    const transaction = params.data.transactions?.[0];
    const receiptId = transaction?.quickBooksSalesReceiptId;
    const isSynced = transaction?.quickBooksSynced === true;

    // Not synced / not available → dash
    if (!isSynced || !receiptId) {
      return `
        <div class="h-full flex items-center justify-center text-gray-400 text-xs">
          —
        </div>
      `;
    }

    // Synced → show receipt id
    return `
      <div class="h-full flex items-center justify-center text-green-700 font-medium text-sm">
        ${receiptId}
      </div>
    `;
  },
  cellClass: 'ag-center-cell',
  headerClass: 'ag-center-header'
},
      {
  headerName: 'Actions',
  field: 'actions',
  cellRenderer: (params: any) => {
    const due = this.getAmountDue(params.data);
    const requestId = params.data.id;

    const editButton = due > 0
      ? `
        <!-- Edit Button -->
        <button
          type="button"
          class="p-1.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-md transition-colors flex items-center justify-center"
          title="Edit"
          onclick="event.preventDefault(); event.stopPropagation();
                   window.dispatchEvent(new CustomEvent('editPayment', { detail: '${requestId}' }))">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
      `
      : '';

    return `
      <div class="flex items-center justify-center gap-1 h-full">
        ${editButton}

        <!-- View Button -->
<button
  type="button"
  class="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors flex items-center justify-center"
  title="View"
  onclick="event.preventDefault(); event.stopPropagation();
           window.dispatchEvent(new CustomEvent('viewPayment', { detail: '${requestId}' }))">
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M2.458 12C3.732 7.943 7.523 5 12 5
         c4.478 0 8.268 2.943 9.542 7
         -1.274 4.057-5.064 7-9.542 7
         -4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
</button>


        <!-- Delete Button -->
        <button
          type="button"
          class="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center"
          title="Delete"
          onclick="event.preventDefault(); event.stopPropagation();
                   window.dispatchEvent(new CustomEvent('deletePayment', { detail: '${requestId}' }))">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    `;
  },
  width: 200,
  maxWidth: 220,
  sortable: false,
  filter: false,
  pinned: 'right',
  cellClass: 'ag-center-cell',
  headerClass: 'ag-center-header'
}


    ];
  }

  setupActionListeners(): void {
  if (this.actionHandlersInitialized) return; // ✅ prevent duplicates
  this.actionHandlersInitialized = true;

  window.addEventListener('recordPayment', (event: any) => {
    this.recordPayment(event.detail);
  });

  window.addEventListener('viewPayment', (event: any) => {
    this.viewPayment(event.detail);
  });

  window.addEventListener('editPayment', (event: any) => {
    this.editPayment(event.detail);
  });

  window.addEventListener('downloadPayment', (event: any) => {
    this.downloadPayment(event.detail);
  });

  window.addEventListener('deletePayment', (event: any) => {
    this.openDeleteModal(event.detail);
  });
}


  openDeleteModal(requestId: string): void {
    const payment = this.paymentRequests.find(p => p.id === requestId);
    if (payment) {
      this.paymentToDelete.set(payment);
      this.showDeleteModal.set(true);
      this.deleteError.set(null);
    } else {
      console.error('Payment request not found:', requestId);
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.paymentToDelete.set(null);
    this.deleteError.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
  const payment = this.paymentToDelete();

  if (!payment || !payment.id) {
    this.deleteError.set('Invalid payment request');
    return;
  }

  this.isDeleting.set(true);
  this.deleteError.set(null);

  this.paymentRequestService.deletePaymentRequest(payment.id).subscribe({
    next: () => {
      // Remove from local list
      this.paymentRequests = this.paymentRequests.filter(
        p => p.id !== payment.id
      );

      this.applyFilters();
      this.closeDeleteModal();

      this._toastr.success(
        `Payment request ${payment.invoiceNumber ? `#${payment.invoiceNumber}` : ''} deleted successfully`
      );
    },

    error: (err) => {
      if (err.status === 409) {
        this._toastr.warning(err.error?.message || 'Delete not allowed');
        this.closeDeleteModal(); // optional UX choice
        return;
      }

      console.error('Error deleting payment request:', err);
      this.deleteError.set(
        err.error?.message || 'Failed to delete payment request. Please try again.'
      );
      this.isDeleting.set(false);
    }
  });
}


  formatDeleteDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDeleteCurrency(amount: number): string {
    return this.formatCurrency(amount);
  }

  recordPayment(requestId: string): void {
    this.router.navigate(['/billing/payment-requests', requestId, 'edit']);
  }

  viewPayment(requestId: string): void {
  this.router.navigate(['/billing/payment-requests', requestId, 'view']);
}


  editPayment(requestId: string): void {
    this.paymentRequestService.getPaymentRequestById(requestId).subscribe((response:any) => {
      if (response) {
        const paymentData = response;
        console.log("paymentDatapaymentDatapaymentData",paymentData);
        
        this.router.navigate(['/billing/payment-requests', requestId, 'edit'], {
          state: { paymentData: paymentData }
        });
      }
    });
  }

  downloadPayment(requestId: string): void {
  }

  loadPaymentRequests(): void {
    this.loading = true;
    this.error = '';

    this.paymentRequestService.getAllPaymentRequests().subscribe({
      next: (requests) => {
        this.paymentRequests = requests;
        this.rowData = [...requests];
        this.applyFilters();
        this.loading = false;
        
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', this.rowData);
        }
      },
      error: (err) => {
        this.error = 'Failed to load payment requests';
        this.loading = false;
        console.error('Error loading payment requests:', err);
      }
    });
  }

  markPaymentRequestCompleted(requestId: string): void {
  if (!requestId) return;

  // ✅ prevent double execution
  if (this.syncingIds.has(requestId)) {
    return;
  }

  this.syncingIds.add(requestId);
  this.loading = true;

  this.paymentRequestService.markPaymentRequestCompleted(requestId).subscribe({
    next: () => {
      this._toastr.success('Sales receipt created successfully');
      this.syncingIds.delete(requestId);
      this.loadPaymentRequests(); // refresh grid
    },
    error: (err) => {
      console.error('Mark completed failed', err);
      this.syncingIds.delete(requestId);
      this.loading = false;
      this._toastr.error('Failed to create sales receipt');
    }
  });
}



  applyFilters(): void {
    let filtered = [...this.paymentRequests];

    if (this.filterStatus) {
      filtered = filtered.filter(r => r.status === this.filterStatus);
    }

    if (this.filterPatientName) {
      const searchTerm = this.filterPatientName.toLowerCase();
      filtered = filtered.filter(r =>
        r.patientName?.toLowerCase().includes(searchTerm)
      );
    }

    if (this.filterDateFrom) {
      const fromDate = new Date(this.filterDateFrom);
      filtered = filtered.filter(r => new Date(r.invoiceDate) >= fromDate);
    }

    if (this.filterDateTo) {
      const toDate = new Date(this.filterDateTo);
      filtered = filtered.filter(r => new Date(r.invoiceDate) <= toDate);
    }

    this.rowData = filtered;
    
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.rowData);
      this.gridApi.refreshHeader();
    }
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterPatientName = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.rowData = [...this.paymentRequests];
    
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.rowData);
      this.gridApi.setFilterModel(null);
      this.gridApi.refreshHeader();
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();

    setTimeout(() => {
    params.api.refreshHeader();
    params.api.refreshCells({ force: true });
  }, 100);
  }

  onGridFilterChanged(): void {
    this.applyFilters();
  }

  onModelUpdated(): void {
  }

  onActionClick(data: any): void {
  }

  formatCurrency(amount: number): string {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getTotalPaid(request: PatientPaymentRequestDto): number {
    if (!request?.transactions) return 0;
    return request.transactions
      .filter(t => t.isSuccessful)
      .reduce((sum, t) => sum + t.amountPaid, 0);
  }

  getAmountDue(request: PatientPaymentRequestDto): number {
    if (!request?.finalAmount) return 0;
    return request.finalAmount - this.getTotalPaid(request);
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getPaymentPercentage(request: any): number {
    if (!request || !request.finalAmount || request.finalAmount === 0) return 0;
    const totalPaid = this.getTotalPaid(request);
    return Math.round((totalPaid / request.finalAmount) * 100);
  }

  getStatusClass(status: string): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    const statusMap: any = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'draft': 'bg-gray-100 text-gray-800',
      'partial': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'partially_paid': 'bg-blue-100 text-blue-800'
    };
    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }

  isOverdue(dueDate: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  getDaysUntilDue(dueDate: string): string {
    if (!dueDate) return '';
    const diffTime = new Date(dueDate).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `in ${diffDays} days`;
  }

  capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  currencyFormatter(params: any): string {
    if (!params.value) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(params.value);
  }

  dateFormatter(params: any): string {
    if (!params.value) return '';
    return new Date(params.value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  refreshDateFormats(): void {
    if (this.gridApi) {
      this.gridApi.refreshCells();
    }
  }

  private formatDateForGrid(dateString: string): string {
    return this.dateFormatService.formatDate(dateString);
  }

  onExportClick(): void {
    if (!this.rowData.length) {
      this._toastr.warning('No data to export');
      return;
    }


    const worksheet = XLSX.utils.json_to_sheet(this.rowData.map(item => ({
      'Invoice Date': this.formatDate(item.invoiceDate),
      'Invoice Number': item.invoiceNumber || '',
      'Patient Name': item.patientName || '',
      'Total Amount': item.finalAmount || 0,
      'Amount Paid': this.getTotalPaid(item),
      'Amount Due': this.getAmountDue(item),
      'Status': this.capitalizeFirstLetter(item.status || ''),
      'Due Date': item.dueDate ? this.formatDate(item.dueDate) : ''
    })));

    const workbook = { Sheets: { 'Payment Requests': worksheet }, SheetNames: ['Payment Requests'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, `payment-requests-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  createNewRequest(): void {
    this.router.navigate(['/billing/payment-requests/new']);
  }

  isSyncing(requestId: string): boolean {
  return this.syncingIds.has(requestId);
}

  
}