import { Component, OnInit } from '@angular/core';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AdminService } from '../../../../service/admin/admin.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-invoice-details',
  standalone: false,
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss'
})
export class InvoiceDetailsComponent implements OnInit {
  gridApi!: GridApi;
  invoiceData: any[] = [];
  columnDefs: ColDef[] = [];
  searchValue: string = '';
  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    flex: 1,
    minWidth: 120
  };
  gridOptions: any;
  selectedInvoice: any = null;
  showInvoicePopup = false;
  patientId!: string;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('patientId');
      console.log("PatientId",id);
      if (id) {
        this.patientId = id;
        this.setupColumnDefs();
        this.fetchInvoiceList();
      }
    });
  }

  setupColumnDefs(): void {
    this.columnDefs = [
      { field: 'invoiceNumber', headerName: 'Invoice #' },
      {
        field: 'date',
        headerName: 'Date',
        valueFormatter: this.dateFormatter
      },
      { field: 'status', headerName: 'Status' },
      {
        field: 'totalAmount',
        headerName: 'Total Amount',
        valueFormatter: this.currencyFormatter
      },
      {
        field: 'paidAmount',
        headerName: 'Paid',
        valueFormatter: this.currencyFormatter
      },
      {
        field: 'balanceAmount',
        headerName: 'Balance',
        valueFormatter: this.currencyFormatter
      },
      {
        headerName: 'Action',
        field: 'action',
        width: 100,
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

    this.gridOptions = {
      rowSelection: 'multiple',
      suppressRowClickSelection: true,
      onCellClicked: (event: any) => {
        const action = event.event?.target?.getAttribute('data-action');
        if (action === 'view') {
          this.viewInvoice(event.data);
        }
      }
    };
  }

  fetchInvoiceList(): void {
    this.adminService.getInvoicesByPatientId(this.patientId).subscribe({
      next: (data) => {
        console.log("Data",data);
        this.invoiceData = data || [];
      },
      error: (err) => {
        console.error('Error fetching invoice details:', err);
      }
    });
  }

  getInvoiceById(){
    
  }
  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  invoiceList:any=[]

 viewInvoice(rowData: any): void {
  const invoiceId = rowData.id;

  this.adminService.getInvoiceById(invoiceId).subscribe((res) => {
    // Convert `payments` to array if it's an object
    const payments = Array.isArray(res.payments)
      ? res.payments
      : Object.values(res.payments || {});

    this.selectedInvoice = {
      ...res,
      payments: payments,
    };

    this.showInvoicePopup = true;
  }, (err) => {
    console.error('Error fetching invoice:', err);
  });
}

  closeInvoiceModal(): void {
    this.showInvoicePopup = false;
    this.selectedInvoice = null;
  }

  currencyFormatter(params: any): string {
    const value = parseFloat(params.value);
    return isNaN(value) ? '-' : `₹${value.toFixed(2)}`;
  }

  dateFormatter(params: any): string {
    if (!params.value) return '-';
    const date = new Date(params.value);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getFullYear()}`;
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
    filename:     `Patient-Assessment-${new Date().toISOString().slice(0, 10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
 
  html2pdf().set(opt).from(element).save();
}
}
