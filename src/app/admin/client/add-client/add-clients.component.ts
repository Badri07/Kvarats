import { Component, inject } from '@angular/core';
import { AuthService } from '../../../service/auth/auth.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../service/admin/admin.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { ColDef, Column, GridApi, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-add-clients',
  standalone: false,
  templateUrl: './add-clients.component.html',
  styleUrl: './add-clients.component.scss'
})
export class AddClientsComponent {

  public adminService = inject(AdminService);
  public authService = inject(AuthService);
  public toastr = inject(TosterService);
  public fb = inject(FormBuilder);

  public breadcrumbService = inject(BreadcrumbService);

    countries: any[] = [];
  mobilePrefixes: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  zipCodes: any[] = [];

  userList:any[]=[];

    selectedCountry:any = '';
  selectedStateCode:any = '';
  selectedCity:any = '';
get_Country:string='';

searchValue: string = '';

  public selectedTab: 'Addclient' | 'Listclient' ='Addclient';

clientForm!: FormGroup;
countryList: any[] = [];
 isEditMode:boolean = false;
 clientSubmitted:boolean = false;





columnDefs: ColDef[] = [
{
    headerCheckboxSelection: true,
    checkboxSelection: true,
    field: 'checkbox',
    width: 40,
    pinned: 'left',
    cellClass:'no-focus-style'
  },
   {
    headerName: 'Client Name',
    field: 'name',
    flex: 1.2,
    cellRenderer: (params: any) => {
      return `
        <div class="flex items-center gap-2">
          <img src="${params.data.avatar}" class="rounded-full w-8 h-8" />
          <span>${params.value}</span>
        </div>
      `;
    },
  }, {
    headerName: 'Mobile',
    field: 'phoneNumber',
    flex: 1,
    cellRenderer: (params: any) =>
      `<i class="fa fa-phone text-green-600 mr-1"></i> ${params.value}`,
  },
  { field: 'address', headerName: 'Address', sortable: true, filter: true },
  { field: 'state', headerName: 'State', sortable: true, filter: true },
  { field: 'city', headerName: 'City', sortable: true, filter: true },
{
  field: 'isSoloProvider',
  headerName: 'Solo Provider',
  sortable: true,
  filter: true,
 cellRenderer: (params: any) => {
  return params.value
    ? `<i class="fas fa-check text-green-500"></i>`
    : `<i class="fas fa-times text-gray-400"></i>`;
}
}
];


     rowData: any[] = [];
    gridApi!: GridApi;
      gridColumnApi!: Column; paginationPageSize = 10;


ngOnInit(): void {
   this.breadcrumbService.setBreadcrumbs([
    { label: 'Client', url: 'clients/add' },
  ]);
  this.clientForm = this.fb.group({
    name: ['', Validators.required],
    contactPerson: ['',Validators.required],
    email: ['', [Validators.required,Validators.email]],
    phoneNumber: ['',Validators.required],
    address: ['',Validators.required],
    countryDataId: [null, Validators.required],
    isSoloProvider:[false,Validators.required],
    Country:[null,Validators.required],
    state:[null,Validators.required],
    city:[null,Validators.required],
  });

  this.loadCountries();
}

loadCountries() {
  this.authService.getCountries().subscribe({
    next: (res) =>{
      this.countryList = res,
    console.log('Countries fetched:', res);
    },

    error: (err) =>{
    console.error('Error loading countries', err)
    }
  });
}


onCountryChange() {

  const selectedCountryObj: any = this.clientForm.value.Country;

    if (selectedCountryObj) {
      this.get_Country = selectedCountryObj.country;
      var get_CountryCode = selectedCountryObj.mobilePrefixCode

    this.clientForm.get('countrycode')?.setValue(get_CountryCode);

   this.clientForm.value.Country
  this.getMobilePrefixes();
  this.getStates();
  this.cities = [];
  this.zipCodes = [];
  }
}

onStateChange() {
  this.selectedStateCode = this.clientForm.value.state;
  this.getCities();
  this.zipCodes = [];
}

onCityChange() {
  this.selectedCity = this.clientForm.value.city;
  this.getZipCodes();
}
selectedCountryCode:any
getMobilePrefixes() {
//  this.registerForm.get('Country')?.valueChanges.subscribe(selected: => {
//     // this.selectedCountryCode = selected?.mobilePrefixCode || '';


//   });

this.clientForm.get('Country')?.valueChanges.subscribe((res:any)=>{
   console.log("selected",res)
})
}

getStates() {
  if (this.get_Country) {
    this.authService.getStates(this.get_Country).subscribe(res => {
      this.states = res;
    });
  }
}

getCities() {
  console.log("selectedCountry",this.get_Country);

  if (this.get_Country && this.selectedStateCode) {
    this.authService.getCities(this.get_Country, this.selectedStateCode).subscribe(res => {
      this.cities = res;
    });
  }
}

getZipCodes() {
  if (this.get_Country && this.selectedStateCode && this.selectedCity) {
    this.authService.getZipCodes(this.get_Country, this.selectedStateCode, this.selectedCity).subscribe(res => {
      this.zipCodes = res;
    });
  }
}

onSubmit() {

    if (this.clientForm.invalid) {
this.clientSubmitted = true;
    }
  else{
    this.adminService.addClient(this.clientForm.value).subscribe({
      next: () => {
        this.toastr.success('Client added successfully');
        this.clientForm.reset();
      },
      error: (err) => this.toastr.error('Failed to add client')
    });
  }
}


setTab(tab: 'Addclient' | 'Listclient') {
  this.selectedTab = tab;

  const slider = document.querySelector('.slider') as HTMLElement;
  const tabElements = document.querySelectorAll('.tab');

  const tabIndex = { 'Addclient': 0, 'Listclient': 1 }[tab];

  if (slider && tabElements[tabIndex]) {
    const tabEl = tabElements[tabIndex] as HTMLElement;
    slider.style.left = `${tabEl.offsetLeft}px`;
    slider.style.width = `${tabEl.offsetWidth}px`;
  }
  if (tab === 'Listclient') {
    this.loadClientList();
  }
}


 get addUser(): { [key: string]: AbstractControl } {
    return this.clientForm.controls;
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.loadClientList();
  }

  formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}


  loadClientList(): void {
    this.adminService.getClientList().subscribe({
      next: (data) => {
         this.userList = data
         this.rowData = this.userList.map((user: any, index: number) => ({
        ...user,
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));
      },
      error: (err) => {
        console.error('Failed to fetch patient list', err);
      }
    });
  }

 

  onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
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

defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };


   onExportClick() {
      const worksheet = XLSX.utils.json_to_sheet(this.rowData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'clientList.xlsx');
    }
}
