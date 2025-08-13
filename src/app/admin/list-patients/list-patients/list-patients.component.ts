import { Output,Component, EventEmitter, inject } from '@angular/core';
import { ColDef, Column, GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { AdminService } from '../../../service/admin/admin.service';
import { NavigationEnd, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { filter, Subscription } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PopupService } from '../../../service/popup/popup-service';
import { TosterService } from '../../../service/toaster/tostr.service';



@Component({
  selector: 'app-list-patients',
  templateUrl: './list-patients.component.html',
  styleUrl: './list-patients.component.scss',
  standalone: false
  
})

export class ListPatientsComponent {
  
  @Output() editPatientClicked = new EventEmitter<any>();
  private subscriptions = new Subscription();


 columnDefs: ColDef[] = [
  {
    headerCheckboxSelection: true,
    checkboxSelection: true,
    field: 'checkbox',
    width: 40,
    pinned: 'left',
    cellClass: 'no-focus-style'
  },
  {
    headerName: 'First Name',
    field: 'firstName',
    flex: 1.2,
    cellRenderer: (params: any) => {
      return `
        <div class="flex items-center gap-2">
          <img src="${params.data.avatar}" class="rounded-full w-8 h-8" />
          <span>${params.value}</span>
        </div>
      `;
    },
  },
  { field: 'lastName', headerName: 'Last Name', sortable: true, flex: 1 },
{
    headerName: 'Mobile',
    field: 'phoneNumber',
    flex: 1,
    cellRenderer: (params: any) =>
      `<i class="fa fa-phone text-green-600 mr-1"></i> ${params.value}`,
},
{ field: 'email', headerName: 'Email', sortable: true, flex: 1 },
{ field: 'socialSecurityNumber', headerName: 'SSN', sortable: true, flex: 1 },
{
    field: 'dateOfBirth',
    headerName: 'DOB',
    sortable: true,
    flex: 1,
    valueFormatter: params => this.formatDate(params.value)
},
{ field: 'gender', headerName: 'Gender', sortable: true, flex: 1 },
{
    headerName: 'Assessment',
    flex: 0.8,
    cellRenderer: (params: ICellRendererParams) => {
      console.log("params",params.data.assessmentId);
      const hasAssessment = params.data.hasAssessment;
      const assessmentId = params.data.assessmentId;
      const borderColor = hasAssessment ? 'green' : 'red';

      return `
        <button class="assessment-btn"
                data-id="${assessmentId}"
                style="border: 2px solid ${borderColor};
                       padding: 4px;
                       border-radius: 50%;
                       background: transparent;
                       cursor: pointer;
                       display: flex;
                       align-items: center;
                       justify-content: center;
                       width: 32px;
                       height: 32px;
                       margin-top: 5px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </button>
      `;
    },
    sortable: false
},
{
  field: 'quickBookSync',
  headerName: 'QuickBook Sync',
  sortable: true,
  flex: 1,
  cellRenderer: (params: any) => {
    if (!params.value) {
      return `
        <button class="sync-btn text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-sm">
          Sync Now
        </button>
      `;
    }
    return '';
  }
}

,
{
    headerName: 'Actions',
    field: 'actions',
    flex: 1,
    pinned: 'right',
    cellRenderer: (params: ICellRendererParams) => {
      return `
        <div class="flex gap-2">
          <button class="text-primary-border-color hover:underline" data-action="edit" title="Edit">
            <i class="fa fa-edit text-lg"></i>
          </button>
          <button class="text-primary-border-color hover:underline" data-action="delete" title="Delete">
            <i class="fa fa-trash text-lg"></i>
          </button>
        </div>
      `;
    },
    sortable: false
}
];
  uploadForm!: FormGroup;



  gridApi!: GridApi;
  searchValue: string = '';
  // Add pagination propertiespaginationPageSize = 10;
    gridColumnApi!: Column; paginationPageSize = 10;
  
  paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];

  public _loader = inject(PopupService);
  public _toastr = inject(TosterService);
  constructor(private adminService: AdminService,
    private router:Router,private breadcrumbService: BreadcrumbService,private fb: FormBuilder
    
  ) { }


  ngOnInit(): void {
     this.loadPatientsList();

     this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      this.loadPatientsList();
    });

    this.breadcrumbService.setBreadcrumbs([
    { label: 'List-Patients', url: 'patients/list-patients' },
  ]);
   
    this.uploadForm = this.fb.group({
      files: [null]
    });
  }

  defaultColDef = {
    sortable: true,
    filter: false,
    resizable: true,
  };

ngDestroy(){
  this.subscriptions.unsubscribe();
}

gridOptions:any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onGridReady: (params: any) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.setupAssessmentClickHandler();
  },
};


  // onGridReady(params: GridReadyEvent): void {
  //   this.gridApi = params.api;
  //   this.loadPatientsList();
  //   this.setupAssessmentClickHandler();
  // }
  selectedassessmentId: string = '';
  selectedPatientId: string = '';

  setupAssessmentClickHandler(): void {
  if (!this.gridApi) return;

  this.gridApi.addEventListener('cellClicked', (event) => {
    const nativeEvent = event.event;
    if (!nativeEvent) return;

    const target = nativeEvent.target as HTMLElement;
    if (!target) return;

    const btn = target.closest('.assessment-btn');
    if (btn) {
      const assessmentId = btn.getAttribute('data-id');
      if (assessmentId) {
        this.selectedassessmentId = assessmentId;
        this.selectedPatientId = event.data.id; // Store patientId from row data
        this.showInitialPopup = true;       
      }
    }
  });
}


  // goToAssessment(assessmentId: string): void {
    
  //   this.router.navigate(['admin/patients/assessment/', assessmentId]);
  // }


  formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

rowData:any[] = [
 
];
getPatientsId!:string
loadPatientsList(){
  const loadPatients = this.adminService.getPatientsList().subscribe({
    next: (data) => {
     data.forEach((patient: any) => {
      this.getPatientsId = patient.id;
  // console.log("patient.id",patient.id);
});
      this.rowData = data.map((patient: any, index: number) => ({
        ...patient,
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));
    },
    error: (err) => {
      console.error('Failed to fetch patient list', err);
    }
  });
 this.subscriptions.add(loadPatients);
}


  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
  }

   onExportClick() {
      const worksheet = XLSX.utils.json_to_sheet(this.rowData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'PatientList.xlsx');
    }


    
  showInitialPopup = false;
  // isshowupload = false;
  isshowupload:boolean =false;
  userChoice!: string;

  closeAll() {
    this.showInitialPopup = false;
    this.isshowupload = false;
  }

 openAssessmentForm() {
  this.userChoice = 'assessmentForm';
  this.showInitialPopup = false;
  this.isshowupload = true;

  if (this.selectedassessmentId) {
    // Get the patientId from the row data
    const selectedRow = this.rowData.find(row => row.assessmentId === this.selectedassessmentId);
    if (selectedRow) {
      this.router.navigate(['admin/patients/assessment', this.selectedPatientId, this.selectedassessmentId]);
    }
  }
}


selectedFiles: { name: string; status: string }[] = [];
fileListToUpload!: FileList;
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files.length > 0) {
    const files = Array.from(input.files);
    this.selectedFiles = files.map(file => ({
      name: file.name,
      status: 'Pending'
    }));

    this.uploadForm.patchValue({ files: input.files });  // For validation purposes only
    this.uploadForm.get('files')?.updateValueAndValidity();

    // Store files in a separate property for FormData
    this.fileListToUpload = input.files;
  }
}


openPdfUpload() {
  this.userChoice = 'uploadPdf';
  this.showInitialPopup = false;
  // this.showPdfUploadPopup = true;
  this.isshowupload = true
}

// patientassessment:string='patientassessment'
uploadedUrl!:string
upload(): void {
  if (!this.fileListToUpload || this.fileListToUpload.length === 0) {
    alert("At least one file must be uploaded.");
    return;
  }
          this._loader.show();

  const formData = new FormData();
  Array.from(this.fileListToUpload).forEach(file => {
    formData.append('files', file);
  });

  const folder = 'patientassessment';

  this.adminService.fileUpload(formData, folder).subscribe({
    next: (res) => {
      console.log('Success:', res);
      console.log('Success:', res.urls);
      this.uploadedUrl = res?.urls;
      this._loader.hide();
      this.selectedFiles = this.selectedFiles.map(f => ({
        ...f,
        status: 'Success'
      }));

      const patientData: any = {
        assessmentId:this.selectedassessmentId,
        isFileUpload: true,
        fileUrl: this.uploadedUrl,
      };
      this.adminService.savePatientAssessment(patientData).subscribe({
        next: (res) => {
          console.log('Assessment saved successfully', res);
          this._toastr.success(res.message);
          this.isshowupload = false;
          this.showInitialPopup = false;
        },
        error: (err) => {
          this._loader.hide();
          const errorMessage = err.error?.message;
          this._toastr.error(errorMessage);        }
      });
    },
    error: (err) => {
      console.error('Upload failed:', err);
      this.selectedFiles = this.selectedFiles.map(f => ({
        ...f,
        status: 'Failed'
      }));
    }
  });
}


onCellClicked(event: any): void {
  const field = event.colDef?.field;
  const target = event.event?.target as HTMLElement;
 
  console.log('Clicked field:', field);
  console.log('Target classes:', target?.classList);
 
  if (field === 'quickBookSync' && target?.classList.contains('sync-btn')) {
    this.adminService.addPatientToQuickBooks(this.getPatientsId).subscribe({
      next: (res) => {
        console.log("addPatientToQuickBooks response:", res);
        this._toastr.success(res.message);
        this.loadPatientsList();
      },
      error: (err) => {
          const errorMessage = err.error?.message;
          this._toastr.error(errorMessage);      }
    });
  }
 
  if (field === 'actions' && target.closest('[data-action="edit"]')) {
    this.onEditAction(event.data);
  }
 
  if (field === 'actions' && target.closest('[data-action="delete"]')) {
    this.onDeleteAction(event.data);
  }
}
 
 
onEditAction(rowData: any): void {
  console.log("rowdata",rowData);
   this.router.navigate(['admin/patients/add-patients', rowData.id]);
}

onDeleteAction(rowData: any) {
  const getPatientId = rowData.id;
  const confirmed = confirm('Are you sure you want to delete this user?');
  if (!confirmed) return;

  this.adminService.deletePatient(getPatientId).subscribe({
    next: (res: any) => {
      this._toastr.success(res.message);
      this.rowData = this.rowData.filter((row: any) => row.id !== getPatientId);
    },
    error: (err) => {
      const errorMessage = err.error?.message;
      this._toastr.error(errorMessage);
    }
  });
}



}
