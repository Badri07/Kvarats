import { Component, inject } from '@angular/core';
import { ColDef, GridApi, GridOptions, PopupService } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../service/admin/admin.service';
import { InsuranceCarrier } from '../../../models/useradmin-model';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { PatientService } from '../../../service/patient/patients-service';


type MatFormFieldAppearance = 'legacy' | 'fill' | 'outline';


@Component({
  selector: 'app-patient-insurances',
  standalone: false,
  templateUrl: './patient-insurances.component.html',
  styleUrl: './patient-insurances.component.scss'
})
export class PatientInsurancesComponent {
selectedTab: 'list-patients' = 'list-patients';


  gridApi!: GridApi;
  searchValue: string = '';
  patientsInusranceForm!:FormGroup;
  patientsInusranceFormSubmitted: boolean = false;
  insuranceArr:InsuranceCarrier[]=[]


  public fb = inject(FormBuilder);
  public _adminService = inject(AdminService);
  public breadcrumbService = inject(BreadcrumbService);
  public toastr = inject(TosterService);
  public _patientService = inject(PatientService);

  ngOnInit(){

     this.breadcrumbService.setBreadcrumbs([
      {
        label: 'Patients Insurance',
        url: 'patients/insurances'
      }
    ]);
    this.breadcrumbService.setVisible(true);

      this.patientsInusranceForm = this.fb.group({
  insuranceCarrier: [null, Validators.required],  // Single value (not array)
  plicyname: ['', Validators.required],          // PolicyHolderName
  relationship: ['', Validators.required],
  copay: ['', [Validators.required, Validators.min(0)]], // Number validation
  membernumber: ['', Validators.required],       // MemberId
  groupnumber: ['', Validators.required],        // GroupNumber
  // Optional fields (no Validators.required):
  policyHolderDob: [null],                       // Date or null
  effectiveDate: [null],                         // Date or null
  expiryDate: [null]                             // Date or null
});

      this.getInsuranceCarrier();
      // this.getAllPatients();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.setTab(this.selectedTab));
  }

setTab(tab: any) {
  this.selectedTab = tab;

  const slider = document.querySelector('.slider') as HTMLElement;
  const tabElements = document.querySelectorAll('.tab');
  const tabIndex: Record<any, number> = {
    'list-patients': 0
  };

  if (slider && tabElements[tabIndex[tab]]) {
    const tabEl = tabElements[tabIndex[tab]] as HTMLElement;
    slider.style.left = `${tabEl.offsetLeft}px`;
    slider.style.width = `${tabEl.offsetWidth}px`;
  }
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
      
   

       columnDefs: ColDef[] = [
          {
            headerName: 'S.No',valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,width: 80},
          { headerName: 'First Name', field: 'firstName', sortable: true, filter: true },
          { headerName: 'Last Name', field: 'lastName', sortable: true, filter: true },
          { headerName: 'Email', field: 'email', sortable: true, filter: true },
          { headerName: 'Country', field: 'country', sortable: true, filter: true },
          { headerName: 'Phone', field: 'phoneNumber', sortable: true, filter: true },
          { headerName: 'Date of Birth', field: 'dateOfBirth', sortable: true, filter: true },
          {
          headerName: 'Actions',
          field: 'actions',
          flex: 0.8,
          pinned: 'right',
         cellRenderer: () => {
  return `
    <button class="actionBtn" data-action="edit">
      <i class="fa fa-user-shield"></i>
    </button>
    <button class="actionBtn" data-action="view">
      <i class="fa fa-eye"></i>
    </button>
  `;
},
        }
      ];

editPatient(patientData: any) {
  console.log('Edit clicked:', patientData);
  // Your edit logic here
}

selectedInsurance:any=[];
showInsurancePopupView:boolean = false;

viewInsurance(patientId: string) {
  this._patientService.GetInsuranceByPatientId(patientId).subscribe({
    next: (res: any) => {
      this.selectedInsurance = res.data;
      console.log("this.selectedInsurance",this.selectedInsurance);
      
    },
    error: (err) => {
      console.error('Error fetching insurance data:', err);
      this.toastr.error('Failed to load insurance details.');
    }
  });
}


  defaultColDef: ColDef = {
    resizable: true,
    filter: true,
    sortable: true
  };

  rowData = [];

  gridOptions: GridOptions = {
    rowSelection: 'single',
    animateRows: true
  };

  paginationPageSize = 10;

  
  get InusranceForm(): { [key: string]: AbstractControl } {
    return this.patientsInusranceForm.controls;
  }

  saveForm() {
  if (this.patientsInusranceForm.invalid) {
    this.patientsInusranceFormSubmitted = true;
    return;
  }

  const formValue = this.patientsInusranceForm.value;

  // Create payload matching the backend DTO structure
  const payload: any[] = [
    {
      PatientId: this.rowId,  // Using the rowId from the clicked row
      PolicyHolderName: formValue.plicyname,
      Relationship: formValue.relationship,
      MemberId: formValue.membernumber,
      GroupNumber: formValue.groupnumber,
      InsuranceCarrierId: formValue.insuranceCarrier,
      CoPay: formValue.copay,
      // These should be added to your form if required
      // Handle dates - convert to ISO string or keep null
    policyHolderDob: formValue.policyHolderDob ? 
      new Date(formValue.policyHolderDob).toISOString() : null,
    effectiveDate: formValue.effectiveDate ? 
      new Date(formValue.effectiveDate).toISOString() : null,
    expiryDate: formValue.expiryDate ? 
      new Date(formValue.expiryDate).toISOString() : null
    }
  ];

  this._adminService.AddMultipleInsurances(payload).subscribe({
    next: (res: any) => {
      if (res.success) {
        this.toastr.success(res.message);
        this.showInsurancePopup = false;
        // Optionally refresh the grid data
        // this.getAllPatients();
      } else {
        this.showInsurancePopup = false;
        this.toastr.error(res.errors);
      }
    },
    error: (err) => {
      this.showInsurancePopup = false;
      const backendError = err?.error; 
      const errorMsg = Array.isArray(backendError?.errors) 
        ? backendError.errors.join(', ') 
        : backendError?.message || 'Something went wrong';
      this.toastr.error(errorMsg);
    }
  });
}


  // getAllPatients(){
  //   this._adminService.getPatientsList().subscribe((res)=>{
  //   this.rowData = res
  //   console.log("res",res);
  //   })
  // }

  getInsuranceCarrier(){
    this._adminService.getInsuranceCarriers().subscribe((res:InsuranceCarrier[])=>{
      this.insuranceArr = res
      // console.log(res);
    })
  }
  rowId:any;
  showInsurancePopup:boolean = false;
onCellClicked(event: any): void {
  if (event.colDef.field !== 'actions') return;

  const id = event.data.id;
  const clickedEl = event.eventPath?.[0] || event.target;
  if (!id || !clickedEl) return;

  const action = clickedEl.closest('button')?.dataset?.action;

  // Close both popups first (prevents overlapping)
  this.showInsurancePopup = false;
  this.showInsurancePopupView = false;

  if (action === 'edit') {
    this.rowId = id;
    this.showInsurancePopup = true;
    this.showInsurancePopupView = false;   // Only open view popup
           // Only open edit popup
  } 
  else if (action === 'view') {
    this.rowId = id;
    this.showInsurancePopupView = true;
    this.viewInsurance(id);
    this.showInsurancePopup = false;
  }
}



closeInsurancePopup(){
  this.showInsurancePopup = false;  
}
}
