import { Component, OnInit } from '@angular/core';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AdminService } from '../../service/admin/admin.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { TosterService } from '../../../app/service/toaster/tostr.service';

interface Transaction {
  id: string;
  date: string;
  patientName: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionType?: string;
  updatedAt?: string;
  canEdit: boolean;
  canDelete: boolean;
  transactionDate?: string;
  appointmentDate?: string;
  paymentReference?: string;
  notes?: string;
}

interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  standalone:false
})
export class TransactionsComponent implements OnInit {
  rowData: Transaction[] = [];
  searchValue: string = '';
  gridApi!: GridApi;
  paginationPageSize = 10;
  paginationPageSizeSelector: number[] = [10, 20, 50, 100];
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  isLoading = false;
  searchTerm = '';
  dateRange?: { start: Date | null; end: Date | null };
  selectedPatientId?: string;
  selectedStatusId?: number;

  selectedTransaction: Transaction | null = null;
  showTransactionPopup = false;
  image: string = '/images/LogoLatest.png';

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    flex: 1,
    minWidth: 130
  };

  constructor(
    private _adminService: AdminService,
    private breadcrumbService: BreadcrumbService,
    private toastr: TosterService
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Transactions', url: 'transactions' },
    ]);
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    
    // Fix for dateRange type error
    const startDate = this.dateRange?.start ? new Date(this.dateRange.start) : undefined;
    const endDate = this.dateRange?.end ? new Date(this.dateRange.end) : undefined;

    this._adminService.getPatientsTransactions(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      startDate,
      endDate,
      this.selectedPatientId,
      this.selectedStatusId
    ).subscribe({
      next: (response: PagedResponse<Transaction>) => {
        this.rowData = response.items.map(item => ({
          ...item,
          transactionDate: item.date,
          appointmentDate: item.date
        }));
        this.totalItems = response.totalCount;
        this.isLoading = false;
        
        // if (response.items.length > 0) {
        //   this.toastr.success(`Loaded ${response.items.length} transactions`);
        // } else {
        //   this.toastr.info('No transactions found matching your criteria');
        // }

        if (this.gridApi) {
          // Fix for setRowData type error
          this.gridApi.setGridOption('rowData', this.rowData);
        }
      },
      error: (err) => {
        console.error('Failed to load transactions:', err);
        this.isLoading = false;
        this.toastr.error('Failed to load transactions. Please try again later');
        this.rowData = [];
        this.totalItems = 0;
        
        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', []);
        }
      }
    });
  }

  // viewTransaction(id: string): void {
  //   this._adminService.getTransactionById(id).subscribe({
  //     next: (data: Transaction) => {  
  //       this.selectedTransaction = data;
  //       this.showTransactionPopup = true;
  //     },
  //     error: (err) => {
  //       console.error('Failed to load transaction details', err);
  //       this.toastr.error('Failed to load transaction details');
  //     }
  //   });
  // }

  // ... rest of your component methods remain unchanged ...
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }

  currencyFormatter(params: any): string {
    return `₹${params.value?.toFixed(2)}`;
  }

  dateFormatter(params: any): string {
  if (!params.value) return '';

  const date = new Date(params.value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${month}/${day}/${year}`;
}


  statusBadgeClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'written off': return 'bg-gray-200 text-gray-600';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  columnDefs: ColDef[] = [
    // {
    //   headerCheckboxSelection: true,
    //   checkboxSelection: true,
    //   filter: false,
    //   width: 50,
    //   pinned: 'left',
    //   cellClass: 'no-focus-style'
    // },
    {
      field: 'patientName',
      headerName: 'Patient',
      filter: false,
      cellRenderer: (params: any) => {
        const name = params.value || '';
        const initials = name.split(' ').map((p: string) => p[0]).join('').toUpperCase();
        return `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="w-8 h-8 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
              ${initials}
            </div>
            <span>${name}</span>
          </div>`;
      }
    },
    { 
      field: 'transactionDate', 
      headerName: 'Date', 
      valueFormatter: this.dateFormatter,
      filter: false 
    },
    { 
      field: 'appointmentDate', 
      headerName: 'Appt Date', 
      valueFormatter: this.dateFormatter, 
      filter: false 
    },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      valueFormatter: this.currencyFormatter,
      filter: false 
    },
    {
      field: 'status',
      headerName: 'Status',
      filter: false,
      cellRenderer: (params: any) => {
        const status = params.value || '';
        return `<span class="px-2 py-1 rounded text-xs ${this.statusBadgeClass(status)}">${status}</span>`;
      }
    },
    { 
      field: 'invoiceNumber', 
      headerName: 'Invoice #',
      filter: false 
    },
    { 
      field: 'paymentReference', 
      headerName: 'Reference',
      filter: false 
    },
    { 
      field: 'notes', 
      headerName: 'Notes',
      filter: false 
    },
    {
      headerName: 'Action',
      field: 'action',
      filter: false,
      width: 120,
      pinned: 'right',
      cellRenderer: (params: any) => {
        return `
          <button 
            class="px-2 py-1 bg-primary-border-color text-white text-xs rounded"
            data-action="view"
            data-transaction-id="${params.data.id}"
          >
            View
          </button>`;
      }
    }
  ];


gridOptions: any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onCellClicked: (event: any) => {
    if (event.colDef.field === 'action' && 
        event.event.target?.getAttribute('data-action') === 'view') {
      const transactionId = event.event.target.getAttribute('data-transaction-id');
      if (transactionId) {
      //  this.viewTransaction(transactionId);
      }
    }
  }
};

  closeTransactionModal(): void {
    this.showTransactionPopup = false;
    this.selectedTransaction = null;
  }

  onExportClick(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.rowData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'transactions.xlsx');
  }

  downloadPDF(): void {
    const element = document.getElementById('pdf-content');
    if (!element) {
      console.error('PDF content element not found');
      return;
    }
   
    const opt = {
      margin: 0.5,
      filename: `Transaction-list-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
   
    // Using your original PDF implementation
    const pdfExport = (window as any).html2pdf();
    pdfExport.set(opt).from(element).save();
  }
}