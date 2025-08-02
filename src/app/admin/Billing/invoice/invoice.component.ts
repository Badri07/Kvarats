import { Component, OnInit } from '@angular/core';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AdminService } from '../../../service/admin/admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoice',
  standalone: false,
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss'
})
export class InvoiceComponent implements OnInit {
  gridApi!: GridApi;
  rowData: any[] = [];
  columnDefs: ColDef[] = [];
  loadingPatients = true;
  searchValue: string = '';
  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    flex: 1,
    minWidth: 130
  };

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.setupColumnDefs();
    this.fetchPatientsWithInvoices();
  }

  setupColumnDefs(): void {
    this.columnDefs = [
      {
        field: 'fullName',
        headerName: 'Patient',
        flex: 1,
        minWidth: 200,
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
      {
        field: 'dob',
        headerName: 'DOB',
        width: 130,
        valueFormatter: this.dateFormatter
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 130
      },
      {
        field: 'totalInvoices',
        headerName: 'Invoices',
        width: 100
      },
      {
        field: 'totalDue',
        headerName: 'Total Due',
        width: 120,
        valueFormatter: this.currencyFormatter
      },
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
  }

  fetchPatientsWithInvoices(): void {
    this.adminService.getPatientsWithInvoices().subscribe({
      next: (data: any[]) => {
        console.log('Fetched Patients:', data);
        this.rowData = data;
        this.loadingPatients = false;
      },
      error: (err) => {
        console.error('Failed to fetch invoice list', err);
        this.loadingPatients = false;
      }
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  gridOptions: any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onCellClicked: (event: any) => {
    if (event.colDef.field === 'action' && event.event.target?.getAttribute('data-action') === 'view') {
      this.viewInvoices(event.data.patientId);
    }
  }
};


  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }

  onCellClicked(event: any): void {
    const actionType = event.event?.target?.getAttribute('data-action');
    if (actionType === 'view') {
      this.viewInvoices(event.data);
    }
  }

  viewInvoices(rowData: any): void {
    if (rowData?.patientId) {
      this.router.navigate(['admin/billing/invoice-details/patient', rowData.patientId]);
    } else {
      console.warn('Invalid row data:', rowData);
    }
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
}
