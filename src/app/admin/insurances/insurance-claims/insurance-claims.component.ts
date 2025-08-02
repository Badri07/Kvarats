import { Component } from '@angular/core';
import { AuthService } from '../../../service/auth/auth.service';
import { ColDef, Column, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AdminService } from '../../../service/admin/admin.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-insurance-claims',
  standalone: false,
  templateUrl: './insurance-claims.component.html',
  styleUrl: './insurance-claims.component.scss'
})
export class InsuranceClaimsComponent {
rowData: any[] = [];
  columnDefs: ColDef[] = [];
  searchValue: string = '';
  gridApi!: GridApi;
    gridColumnApi!: Column; paginationPageSize = 10;
    paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];

  constructor(private _adminservice: AdminService
    ,private breadcrumbService: BreadcrumbService
  ) {}
  ngOnInit() {
      this.breadcrumbService.setBreadcrumbs([
    { label: 'Insurance Claims', url: 'insurance/claims' },
  ]);
    this.columnDefs = [
      { field: 'claimNumber', headerName: 'Claim Number', sortable: true, filter: true },
      { field: 'patientName', headerName: 'Patient Name', sortable: true, filter: true },
      { field: 'insuranceName', headerName: 'Insurance', sortable: true, filter: true },
      { field: 'amountBilled', headerName: 'Amount Billed', sortable: true, filter: true },
      { field: 'claimDate', headerName: 'Claim Date', sortable: true, filter: true },
      { field: 'claimStatus', headerName: 'Status', sortable: true, filter: true },
      {
        headerName: 'Actions',
        cellRenderer: (params: any) => {
          const path = params.data.cms1500FormPath;
          return path
            ? `<a href="${path}" target="_blank" class="text-blue-600 underline">Download CMS-1500</a>`
            : `<span class="text-gray-400 italic">Not generated</span>`;
        }
      }
    ];

    this.loadClaims();
  }

  loadClaims(){
    this._adminservice.getAllClaims().subscribe(res=>{

    })
  }
  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
};

  onGridReady(params: GridReadyEvent) {
    params.api.sizeColumnsToFit();
  }

  gridOptions:any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onGridReady: (params: any) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  },
};

    onExportClick() {
      const worksheet = XLSX.utils.json_to_sheet(this.rowData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'userList.xlsx');
    }
  
}
