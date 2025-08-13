import { Component, inject } from '@angular/core';
import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../service/admin/admin.service';
import { InsuranceCarrier } from '../../models/useradmin-model';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';


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

  ngOnInit(){

     this.breadcrumbService.setBreadcrumbs([
      {
        label: 'Patients Insurance',
        url: 'patients/insurances'
      }
    ]);
    this.breadcrumbService.setVisible(true);

      this.patientsInusranceForm = this.fb.group({
 insuranceCarrier: [[], Validators.required],        plicyname: [''],
        relationship: [''],
        copay: [''],
        membernumber: [''],
        groupnumber: [''],
      });

      this.getInsuranceCarrier();
      this.getAllPatients();
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
            <i class="fa fa-user-shield"></i> Add Insurance
            </button>
            `;
          },
        }
      ];

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

  saveForm(){
    debugger
    if(this.patientsInusranceForm.invalid){
      this.patientsInusranceFormSubmitted = true;
      return
    }
    else{
        const payload = {
        rowId: this.rowId,
        ...this.patientsInusranceForm.value
        };
      this._adminService.AddMultipleInsurances(payload).subscribe((res:any)=>{
        console.log("res",res);
      })
    }
  }

  getAllPatients(){
    this._adminService.getPatientsList().subscribe((res)=>{
    this.rowData = res
    console.log("res",res);
    })
  }

  getInsuranceCarrier(){
    this._adminService.getInsuranceCarriers().subscribe((res:InsuranceCarrier[])=>{
      this.insuranceArr = res
      // console.log(res);
    })
  }
  rowId:any;
  showInsurancePopup:boolean = false;
  onCellClicked(event: any) {
  if (event.colDef.field === 'actions' && event.event.target.closest('button[data-action="edit"]')) {
    this.rowId = event.data.id;
    // console.log('Clicked row ID:', rowId);
    this.showInsurancePopup = true;
  }
}

closeInsurancePopup(){
  this.showInsurancePopup = false;  
}
}
