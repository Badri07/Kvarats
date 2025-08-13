import { Component, inject } from '@angular/core';
import { ColDef, Column, GridApi, GridReadyEvent } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { AuthService } from '../../service/auth/auth.service';
import { PatientService } from '../../service/patient/patients-service';
import { InvoicePatients, Payment } from '../../models/patients-interface';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { products } from '../../../stripe-config';

@Component({
  selector: 'app-payments',
  standalone: false,
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent {
  rowData: any[] = [];
  searchValue: string = '';
  gridApi!: GridApi;
  gridColumnApi!: Column;
  paginationPageSize = 10;
  paginationPageSizeSelector: number[] = [10, 20, 50, 100];

  selectedTransaction: any = null;
  showTransactionPopup: boolean = false;

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    flex: 1,
    minWidth: 130
  };

  paymentMethod: string = 'CREDIT_CARD';
transactionId: string = '';
showPaymentProcessing: boolean = false;
paymentError: string | null = null;

  // Stripe integration properties
  private supabase: SupabaseClient;
  products = products;
  checkoutLoading = false;

  public patientService = inject(PatientService);
  public authService = inject(AuthService);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  ngOnInit(): void {
    this.getInvoiceByPatients();
    this.getUserDetails();
  }

  loadTransactions(): void {
    // this._adminService.getAllTransaction().subscribe({
    //   next: (data) => (this.rowData = data),
    //   error: (err) => console.error('Failed to load transactions:', err)
    // });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }



columnDefs: ColDef[] = [
  { 
    field: 'invoiceNumber', 
    headerName: 'INVOICE #',
    width: 120,
    cellClass: 'font-medium text-orange-500',
     filter:false,
    filterParams: {
      suppressAndOrCondition: true
    }
  },
  { 
    field: 'appointmentDate', 
    headerName: 'APPOINTMENT DATE', 
    width: 160,
    valueFormatter: this.dateFormatter,
     filter:false,
    filterParams: {
      comparator: (filterLocalDate: Date, cellValue: string) => {
      }
    }
  },
  {
  headerName: 'TOTAL',
  width: 120,
  valueGetter: params => {
    const original = params.data.originalAmount || 0;
    const discount = params.data.discountAmount || 0;
    return original - discount;
  },
  valueFormatter: this.currencyFormatter,
  cellClass: 'font-semibold',
  filter: false
},
  { 
    field: 'amountPaid', 
    headerName: 'PAID', 
    width: 120,
    valueFormatter: this.currencyFormatter,
    cellClass: (params) => params.value > 0 ? 'text-success' : 'text-muted',
     filter:false
  },
  { 
    field: 'balanceDue', 
    headerName: 'BALANCE', 
    width: 120,
    valueFormatter: this.currencyFormatter,
    cellClass: (params) => params.value > 0 ? 'text-danger font-semibold' : 'text-success',
     filter:false
  },
  {
    field: 'invoiceStatus',
    headerName: 'STATUS',
    width: 140,
    cellRenderer: (params: any) => {
  const status = params.value?.toLowerCase() || '';

  // Inline color mapping
  const statusStyles: Record<string, { background: string; color: string }> = {
    paid:    { background: '#dcfce7', color: '#166534' }, 
    pending: { background: '#fef3c7', color: '#92400e' },
    overdue: { background: '#fee2e2', color: '#991b1b' },
    partial: { background: '#dbeafe', color: '#1e40af' } 
  };

  const span = document.createElement('span');
  span.style.padding = '2px 8px';
  span.style.borderRadius = '9999px';
  span.style.fontSize = '12px';
  span.style.backgroundColor = statusStyles[status]?.background || '#f3f4f6'; // default gray
  span.style.color = statusStyles[status]?.color || '#111827';
  
  span.innerText = params.value || '';
  return span;
    },
    filter:false
  },
  { 
    field: 'dueDate', 
    headerName: 'DUE DATE', 
    width: 140,
    valueFormatter: this.dateFormatter,
    cellClass: (params) => {
      const dueDate = new Date(params.value);
      return dueDate < new Date() ? 'text-danger' : '';
    },
     filter:false
  },
  {
  headerName: 'ACTIONS',
  field: 'action',
  width: 100,  // Reduced width
  pinned: 'right',
  cellRenderer: (params: any) => {
    const isPayable = params.data.balanceDue > 0 && 
                     params.data.invoiceStatus !== 'Paid';
    
    return isPayable ? `
      <button class="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
        data-action="pay" data-invoice="${params.data.invoiceNumber}">
        <i class="fas fa-credit-card mr-1"></i> Pay
      </button>
    ` : '<span class="text-gray-400">Paid</span>';
  },
  filter: false
}
];




  dateFormatter(params: any): string {
    return params.value ? new Date(params.value).toLocaleDateString() : '';
  }

  currencyFormatter(params: any): string {
    return `$${params.value?.toFixed(2)}`;
  }

  statusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'written off':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }
isshowPayment:boolean = false;
isshowpaymentConfirmation:boolean = false;
  gridOptions: any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onCellClicked: (event: any) => {
    if (event.colDef.field === 'action') {
      const action = event.event.target?.getAttribute('data-action');
      if (action === 'pay') {
        const invoiceData = event.data;
        this.onPayClick(invoiceData);
      }
    }
  }
};
  
  onPayClick(invoiceData: any) {
  this.invoicePayload = {
    ...this.invoicePayload,
    invoiceNumber: invoiceData.invoiceNumber,
    balanceDue: invoiceData.balanceDue // Use balanceDue consistently
  };
  this.paymentAmount = invoiceData.balanceDue; // Use balanceDue consistently
  this.isshowPayment = true;
}

  onExportClick(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.rowData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'transactions.xlsx');
  }

      image:string ='/images/LogoLatest.png';


  downloadPDF(): void {
  const element = document.getElementById('pdf-content');
  if (!element) {
    console.error('PDF content element not found');
    return;
  }
 
  const opt = {
    margin:       0.5,
    filename:     `Transaction-list-${new Date().toISOString().slice(0, 10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
 
  html2pdf().set(opt).from(element).save();
}

getPatientId!: string;
paymentAmount: number = 0;
invoicePayload!: any;

getInvoiceByPatients() {
  this.getPatientId = this.authService.getPatientId();
  this.patientService.GetInvoicesByPatient(this.getPatientId)
    .subscribe((res: any[]) => {
      if (res && res.length > 0) {
        const invoice = res[0];
        this.invoicePayload = {
          invoiceNumber: invoice.invoiceNumber,
          appointmentDate: invoice.appointmentDate,
          totalAmount: invoice.totalAmount,
          amountPaid: invoice.amountPaid,
          balanceDue: Number(invoice.balanceDue ?? invoice.balancedue ?? 0), // Standardize to balanceDue
          invoiceStatus: invoice.invoiceStatus,
          transactionType: invoice.transactionType,
          transactionStatus: invoice.transactionStatus,
          dueDate: invoice.dueDate,
          notes: invoice.notes
        };

        this.paymentAmount = this.invoicePayload.balanceDue; // Use balanceDue consistently
        this.rowData = res;
      }
    });
}


userName!:string;
email!:string;
paymentNote: string = 'Notes';
editNote: boolean = false;
onNoteBlur() {
  this.editNote = false;
}
getUserDetails(){
  debugger
  this.userName = this.authService.getPatientUsername();
  this.email = this.authService.getPatientEmail();
}


async onNextPayment() {
  this.showPaymentProcessing = true;
  this.paymentError = null;

  const paymentPayload: Payment = {
    patientId: this.getPatientId,
    invoiceNumber: this.invoicePayload.invoiceNumber,
    amount: this.paymentAmount,
    paymentMethod: this.paymentMethod,
    paymentReference: 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    paymentDate: new Date().toISOString(),
    notes: this.paymentNote,
    cardLastFour: this.paymentMethod.includes('CARD') ? '4242' : null,
    billingZip: '600001', // Mock value
    email: this.email
  };

  try {
    const res = await this.patientService.AddPaymentsByPatient(paymentPayload).toPromise();
    this.transactionId = res.transactionId;
    this.isshowpaymentConfirmation = true;
    this.isshowPayment = false;
    
    // Refresh the invoice data
    this.getInvoiceByPatients();
  } catch (error) {
    console.error('Payment failed:', error);
    this.paymentError = 'Payment processing failed. Please try again.';
  } finally {
    this.showPaymentProcessing = false;
  }
}

// Add this new method
closePaymentConfirmation() {
  this.isshowpaymentConfirmation = false;
  this.transactionId = '';
  this.paymentError = null;
}

  // Stripe Payment Methods
  async onStripePayClick(invoiceData: any) {
    this.checkoutLoading = true;
    
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Please log in to make a payment');
      }

      // Find the appointment product from our config
      const appointmentProduct = this.products.find(p => p.name === 'Appointment');
      
      if (!appointmentProduct) {
        throw new Error('Appointment product not found');
      }

      const response = await fetch(`${environment.supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: appointmentProduct.priceId,
          success_url: `${window.location.origin}/patient/payment?success=true&invoice=${invoiceData.invoiceNumber}`,
          cancel_url: `${window.location.origin}/patient/payment?canceled=true`,
          mode: appointmentProduct.mode,
          metadata: {
            invoiceNumber: invoiceData.invoiceNumber,
            patientId: this.getPatientId,
            amount: invoiceData.balanceDue
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      this.paymentError = error.message;
      
      // Show error to user
      setTimeout(() => {
        this.paymentError = null;
      }, 5000);
    } finally {
      this.checkoutLoading = false;
    }
  }

  // Handle success/cancel redirects
  ngAfterViewInit() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const invoiceNumber = urlParams.get('invoice');

    if (success === 'true') {
      this.showSuccessMessage(invoiceNumber);
      // Refresh the invoice data
      this.getInvoiceByPatients();
    } else if (canceled === 'true') {
      this.showCancelMessage();
    }

    // Clean up URL parameters
    if (success || canceled) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  private showSuccessMessage(invoiceNumber: string | null) {
    // You can implement a toast notification or modal here
    console.log(`Payment successful for invoice: ${invoiceNumber}`);
  }

  private showCancelMessage() {
    // You can implement a toast notification here
    console.log('Payment was canceled');
  }

}