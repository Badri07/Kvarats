import { Component } from '@angular/core';
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams, CellClickedEvent, Column } from 'ag-grid-community';
import { AdminService } from '../../../service/admin/admin.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-list-patient-assessments',
  templateUrl: './list-patient-assessments.component.html',
  styleUrls: ['./list-patient-assessments.component.scss'],
  standalone: false
})
export class ListPatientAssessmentsComponent {

  defaultColDef = {
    sortable: true,
    filter: false,
    resizable: true,
  };

  columnDefs: ColDef[] = [
    { field: 'fullName', headerName: 'Name', sortable: true },
    { field: 'phoneNumber', headerName: 'Phone', sortable: true },
    { field: 'email', headerName: 'Email', sortable: true },
     { field: 'gender', headerName: 'Gender', sortable: true },
    {
      headerName: 'DOB',
      valueGetter: (params) => {
        const dob = this.formatDate(params.data.dateOfBirth);
        return `${dob}`;
      },
      sortable: true
    },
    {
  headerName: 'Assessment Versions',
  cellRenderer: (params: ICellRendererParams) => {
  const id = params.data.id;
  setTimeout(() => {
    const btn = document.getElementById(`view-btn-${id}`);
    if (btn) {
      btn.addEventListener('click', () => {
        console.log('Clicked assessment for:', id);
      });
    }
  });
  return `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
      <button id="view-btn-${id}"
              class="assessment-versions-btn"
              style="border: 2px solid #3863A7;
                     padding: 4px;
                     border-radius: 50%;
                     background: transparent;
                     cursor: pointer;
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     width: 32px;
                     height: 32px;"
              title="View Assessment Versions">
        <i class="fas fa-notes-medical text-[#3863A7]"></i>
      </button>
    </div>
  `;
}
,
  cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  sortable: false
}

  ];

  rowData: any[] = [];
  searchValue: string = '';
 
  paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];
  gridApi!: GridApi;
  gridColumnApi!: Column; paginationPageSize = 10;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
    private router: Router,     private breadcrumbService: BreadcrumbService
    
  ) { }
  ngOnInit(){
      this.breadcrumbService.setBreadcrumbs([
    { label: 'List-Patients Assesment', url: 'patients/patient-assessments' },
  ]);
   
    this.loadPatients();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    setTimeout(() => {
      const allColumns = this.gridApi.getColumns();
      if (allColumns) {
        const allColumnIds = allColumns.map((col: Column) => col.getColId());
        this.gridApi.autoSizeColumns(allColumnIds, false);
      }
    }, 100);
  }

  onCellClicked(event: any): void {
  const target = event.event?.target as HTMLElement;
  if (!target) return;
  const versionsBtn = target.closest('.assessment-versions-btn');
  if (versionsBtn) {
    const patientId = event.data.id
    // console.log('Assessment Versions button clicked for Patient ID:', assessmentId);
  this.router.navigate([
      '/admin/patients/patient-assessments/assessment-versions',
      patientId
    ]);
    // console.log("routerlink",k);
  }
}




gridOptions:any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onGridReady: (params: any) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  },
};


  loadPatients(): void {
    this.adminService.getPatientsWithCompletedAssessment().subscribe({
      next: (data) => {
        this.rowData = data.data;
        console.log(this.rowData);
        //this.toastr.success(data.message);   
      },
      error: (err) => {
      const errorMessage = err.error?.message;
      this.toastr.error(errorMessage);   
      }
    });
  }
  
  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  onExportClick() {
      const worksheet = XLSX.utils.json_to_sheet(this.rowData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'AssesmentList.xlsx');
    }

}
