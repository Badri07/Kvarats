import { Component, OnInit } from '@angular/core';
import { ColDef, GridApi, Column, GridReadyEvent } from 'ag-grid-community';
import { AdminService } from '../../service/admin/admin.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-transactions',
  standalone: false,
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
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
    filter: true,
    flex: 1,
    minWidth: 130
  };

  constructor(private _adminService: AdminService,private breadcrumbService: BreadcrumbService) {}

  ngOnInit(): void {
     this.breadcrumbService.setBreadcrumbs([
    { label: 'Transactions', url: 'transactions' },
  ]);
    this.loadTransactions();
  }

  loadTransactions(): void {
    this._adminService.getAllTransaction().subscribe({
      next: (data) => (this.rowData = data),
      error: (err) => console.error('Failed to load transactions:', err)
    });
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

  currencyFormatter(params: any): string {
    return `₹${params.value?.toFixed(2)}`;
  }

  dateFormatter(params: any): string {
    return params.value ? new Date(params.value).toLocaleDateString() : '';
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

  columnDefs: ColDef[] = [
    {
      headerCheckboxSelection: true,
    checkboxSelection: true,
    width: 10,
    pinned: 'left',
    cellClass: 'no-focus-style'
    },
    {
      field: 'patientName',
      headerName: 'Patient',
      cellRenderer: (params: any) => {
        const initials = params.value?.split(' ').map((p: string) => p[0]).join('').toUpperCase();
        return `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="w-8 h-8 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
              ${initials}
            </div>
            <span>${params.value}</span>
          </div>
        `;
      }
    },
    { field: 'transactionDate', headerName: 'Date', valueFormatter: this.dateFormatter },
    { field: 'appointmentDate', headerName: 'Appt Date', valueFormatter: this.dateFormatter },
    { field: 'amount', headerName: 'Amount', valueFormatter: this.currencyFormatter },
    {
      field: 'status',
      headerName: 'Status',
      cellRenderer: (params: any) => {
        return `<span class="px-2 py-1 rounded text-xs ${this.statusBadgeClass(params.value)}">${params.value}</span>`;
      }
    },
    { field: 'invoiceNumber', headerName: 'Invoice #' },
    { field: 'paymentReference', headerName: 'Reference' },
    { field: 'notes', headerName: 'Notes' },
    {
  headerName: 'Action',
  field: 'action',
  width: 120,
  pinned: 'right',
  cellRenderer: () => {
    return `
      <button 
        class="px-2 py-1 bg-primary-border-color text-white text-xs rounded"
        data-action="view"
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
    if (event.colDef.field === 'action' && event.event.target?.getAttribute('data-action') === 'view') {
      this.viewTransaction(event.data.id);
    }
  }
};

  viewTransaction(id: string): void {
    
    this._adminService.getTransactionById(id).subscribe({
      next: (data) => {
        this.selectedTransaction = { ...data };
        this.showTransactionPopup = true;
      },
      error: (err) => console.error('Failed to load transaction details', err)
    });

  }

  
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

}
