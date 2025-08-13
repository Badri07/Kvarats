import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AdminService } from '../../service/admin/admin.service';
import { TosterService } from '../../service/toaster/tostr.service';
import { MatSelectChange } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { User } from '../../models/user-model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { GridApi, Column} from 'ag-grid-community';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PopupService } from '../../service/popup/popup-service';

declare var bootstrap: any;


export function emailWithComValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!email) return null;

  return emailRegex.test(email) ? null : { invalidComEmail: true };
}



@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  displayedColumns: string[] = ['position', 'username', 'email', 'roleName', 'actions'];
  dataSource!: MatTableDataSource<User>;

    public selectedTab: 'ListUser' | 'AddUser' ='ListUser';


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  showModal = false;
  isLoader = false;
  isshowtherapist = false;

  isshowuserForm:boolean = false;
  get_id!: string;
  get_value!: string;

  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  zipCodes: any[] = [];

  selectedCountry: string = '';
  selectedCountryCode: string = '';
  selectedStateCode!: string | null | undefined;
  selectedCity!: string | null | undefined;

  userList: any[] = [];
  userRole: any[] = [];
  userDepartment: any[] = [];
  userSpecializations: any[] = [];

  showDeleteConfirm:boolean = false;
  UserSubmitted = false;
  isEditMode = false;
  editUserId!: string;

  addUserForm!: FormGroup;
   get_CountryCode: string = '';

   
  constructor(
    private cdr: ChangeDetectorRef,
    private authservice: AuthService,
    private fb: FormBuilder,
    private adminservice: AdminService,
    private toastr: TosterService,
    private breadcrumbService: BreadcrumbService,
    private _loader:PopupService
  ) {}

  ngOnInit() {
      this.breadcrumbService.setBreadcrumbs([
    { label: 'Users', url: 'users' },
    
  ]);

    this.addUserForm = this.fb.group({
      Username: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email,emailWithComValidator]],
      roleIds: ['', Validators.required],
      contactNumber: ['',Validators.required],
      specialization: ['',Validators.required],
      department: ['',Validators.required],
      qualification: ['',Validators.required],
      address: ['',Validators.required],
      countryDataId: [null,Validators.required],
      country: [null,Validators.required],
      state: [null,Validators.required],
      city: [null,Validators.required],
      phoneCode: [null,Validators.required],
    });

    this.getUserList();
    this.getRoleList();
    this.getDepartmentList();
    this.getCountries();
  }

  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  //   this.dataSource.sort = this.sort;
  // }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openModal() {
    this.showModal = true;
    this.isEditMode = false;
    this.addUserForm.reset();
    this.isshowtherapist = false;
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
  }
closeModal(){
  this.isshowuserForm = false
}
openAddUserModal(){
  this.isshowuserForm = true;
}

 onAddressCountryChange() {
    const selectedCountryObj: any = this.addUserForm.value.country;
    this.addUserForm.get('phoneCode')?.setValue('');
    if (selectedCountryObj) {
      this.selectedCountry = selectedCountryObj.country;
      this.selectedCountryCode = selectedCountryObj.mobilePrefixCode;
      this.get_CountryCode = selectedCountryObj.mobilePrefixCode;
      this.addUserForm.get('phoneCode')?.setValue(this.get_CountryCode);
      this.getStates();
      this.cities = [];
      this.zipCodes = [];
    }
  }


  onStateChange() {
    this.selectedStateCode = this.addUserForm.value.billingState;
    this.getCities();
    this.zipCodes = [];
  }

  onCityChange() {
    this.selectedCity = this.addUserForm.value.billingCity;
    this.getZipCodes();
  }

  onAddressStateChange() {
  const selectedState = this.addUserForm.value.state;
  this.selectedStateCode = selectedState?.stateCode || null;
  this.getCities();
  this.zipCodes = [];
}


  onAddressCityChange() {
  const selectedCity = this.addUserForm.get('city')?.value;
  this.selectedCity = selectedCity?.cityName || null;
  this.getZipCodes();
}


  getCountries() {
    this.authservice.getCountries().subscribe(res => {
      this.countries = res;
    });
  }

  getStates() {
    if (this.selectedCountry) {
      this.authservice.getStates(this.selectedCountry).subscribe(res => {
        this.states = res;
      });
    }
  }

  getCities() {
    if (this.selectedCountry && this.selectedStateCode) {
      this.authservice.getCities(this.selectedCountry, this.selectedStateCode).subscribe(res => {
        this.cities = res;
      });
    }
  }

  getZipCodes() {
    if (this.selectedCountry && this.selectedStateCode && this.selectedCity) {
      this.authservice.getZipCodes(this.selectedCountry, this.selectedStateCode, this.selectedCity).subscribe(res => {
        this.zipCodes = res;
      });
    }
  }
  onSubmit() {
  
  if (this.addUserForm.invalid) {
    this.UserSubmitted = true;
    return;
  }
  this._loader.show();
  const formValue = this.addUserForm.value;
  const getRoleName = formValue.roleIds;
  const getRoleId = getRoleName?.id;

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const createdBy = userData?.id;

  const payload: any = {
    username: formValue.Username,
    firstName: formValue.firstName,
    lastName: formValue.lastName,
    email: formValue.email,
    roleIds: [getRoleId],
    PhoneNumber: String(formValue.contactNumber),
    address: formValue.address,
    department: formValue.department?.value || '',
    specialization: '',
    qualification: formValue.qualification,
    experience: '',
    createdBy: createdBy,
    active: true,
    countryDataId: Number(formValue.countryDataId)
  };

  const selectedSpec = this.userSpecializations.find(s => s.id == formValue.specialization);
  payload.specialization = selectedSpec ? selectedSpec.value : '';

  if (this.isEditMode) {
    this.adminservice.updateUser(this.editUserId, payload).subscribe({
      next: () => {
         this._loader.hide();
        this.toastr.success('User updated successfully');
        this.addUserForm.reset();
       
        this.getUserList();
        this.isEditMode = false;
       this.setTab('ListUser');
      },
      error: () => {
         this._loader.hide();
        this.toastr.error('Something went wrong during update');
      }
    });
  } else {
    this.adminservice.saveAdduser(payload).subscribe({
      next: (res) => {
        this._loader.hide();
        this.toastr.success(res.message || 'User added successfully');
        this.addUserForm.reset();
        this.setTab('ListUser');
        this.getUserList();
         
      },
      error: (err) => {
        this._loader.hide();
        const errorMessage = err.error?.message || 'Something went wrong while adding user';
        this.toastr.error(errorMessage);
      }
    });
  }
}



  onUpdate() {
  if (this.addUserForm.invalid) {
    this.UserSubmitted = true;
    return;
  }

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const createdBy = userData?.id;
  const formValue = this.addUserForm.value;

  const payload: any = {
    username: formValue.Username,
    firstName: formValue.firstName,
    lastName: formValue.lastName,
    email: formValue.email,
    roleIds: Number(formValue.roleIds),
    contactNumber: String(formValue.contactNumber),
    address: formValue.address,
    department: formValue.department?.value || '',
    specialization: '',
    qualifications: formValue.qualification,
    experience: '',
    createdBy: createdBy,
    active: true
  };

  const selectedSpec = this.userSpecializations.find(s => s.id == formValue.specialization);
  payload.specialization = selectedSpec ? selectedSpec.value : '';

  this.adminservice.updateUser(this.editUserId, payload).subscribe({
    next: () => {
      this.toastr.success('User updated successfully');
      this.addUserForm.reset();
      this.getUserList();
    },
    error: () => {
      this.toastr.error('Something went wrong');
    }
  });
}

compareRoles(r1: any, r2: any): boolean {
  return r1 && r2 ? r1.id === r2.id : r1 === r2;
}



editUser(id: string) {
  debugger
  this.isEditMode = true;
  this.editUserId = id;
  this.isshowuserForm = true;

  forkJoin([
    this.authservice.getRoleList(),
    this.adminservice.getUserById(id),
    this.authservice.getCountries()
  ]).pipe(
    switchMap(([roleRes, userRes, countries]) => {
      if (!userRes) {
        throw new Error('User not found');
      }

      this.userRole = roleRes;
      this.countries = countries;
      
      const userRoleId = userRes.roles?.[0]?.roleId;
      const selectedRole = this.userRole.find((r: any) => r.id === userRoleId);
      const selectedCountry = this.countries.find(c => 
        c.country === userRes.country && 
        c.mobilePrefixCode === userRes.mobilePrefixCode
      );

      // Set initial form values
      this.addUserForm.patchValue({
        Username: userRes.userName,
        firstName: userRes.firstName,
        lastName: userRes.lastName,
        email: userRes.email,
        roleIds: selectedRole || null,
        contactNumber: userRes.phoneNumber,
        qualification: userRes.qualification,
        address: userRes.address,
        country: selectedCountry || null,
        phoneCode:userRes.mobilePrefixCode
      });

      this.selectedCountry = userRes.country;
      this.selectedCountryCode = userRes.mobilePrefixCode;

      // Load states for the selected country
      return this.authservice.getStates(this.selectedCountry).pipe(
        switchMap((states: any[]) => {
          this.states = states;
          // Match state by name
          const selectedState = states.find(s => 
            s.stateName?.toLowerCase() === userRes.stateName?.toLowerCase()
          );

          // IMPORTANT: Set both form control and UI selection
          this.addUserForm.get('state')?.setValue(selectedState || null);
          this.selectedStateCode = selectedState?.stateCode;

          // Load cities for the selected state
          return this.authservice.getCities(this.selectedCountry, this.selectedStateCode || '').pipe(
            switchMap((cities: any[]) => {
              this.cities = cities;
              // Match city by name
              const selectedCity = cities.find(c => 
                c.cityName?.toLowerCase() === userRes.cityName?.toLowerCase()
              );

              // IMPORTANT: Set both form control and UI selection
              this.addUserForm.get('city')?.setValue(selectedCity || null);
              this.selectedCity = selectedCity?.cityName;

              // Load zip codes for the selected city
              return this.authservice.getZipCodes(
                this.selectedCountry, 
                this.selectedStateCode || '', 
                this.selectedCity || ''
              ).pipe(
                switchMap((zipCodes: any[]) => {
                  this.zipCodes = zipCodes;
                  const selectedZip = zipCodes.find(z => 
                    z.id === userRes.countryDataId
                  );

                  this.addUserForm.get('countryDataId')?.setValue(selectedZip?.id || null);

                  // Force UI update
                  this.cdr.detectChanges();
                  
                  return this.handleTherapistFields(userRes, selectedRole);
                })
              );
            })
          );
        })
      );
    })
  ).subscribe({
    error: (err) => {
      this.toastr.error('Failed to edit user data');
      console.error('Error in editUser:', err);
    }
  });
}

private handleTherapistFields(userRes: any, selectedRole: any): Observable<any> {
  if (selectedRole?.roleName === 'Therapist') {
    this.isshowtherapist = true;
    return this.adminservice.getDepartment().pipe(
      switchMap((deptRes: any) => {
        this.userDepartment = deptRes.departments;
        
        console.log('Department matching:', {
          userDepartment: userRes.department,
          availableDepartments: this.userDepartment
        });

        const selectedDept = this.userDepartment.find(d => 
          d.value?.toLowerCase() === userRes.department?.toLowerCase()?.trim()
        );
        
        if (selectedDept) {
          this.addUserForm.get('department')?.setValue(selectedDept);
          
          return this.adminservice.getSpecializations(selectedDept.id).pipe(
            switchMap((specRes: any) => {
              this.userSpecializations = specRes.specializations;
              
              console.log('Specialization matching:', {
                userSpecialization: userRes.specialization,
                availableSpecializations: this.userSpecializations
              });

              const selectedSpec = this.userSpecializations.find(
                (s: any) => s.value?.toLowerCase() === userRes.specialization?.toLowerCase()?.trim()
              );
              
              if (selectedSpec) {
                this.addUserForm.get('specialization')?.setValue(selectedSpec.id);
              }
              return of(null);
            })
          );
        }
        return of(null);
      })
    );
  }
  this.isshowtherapist = false;
  return of(null);
}


  onRoleChange(data: Event) {
  
  const selectedValue = this.addUserForm.get('roleIds')?.value
  console.log(selectedValue.roleName);

  if(selectedValue.roleName === 'Therapist'){
      this.isshowtherapist = true
  }
  else{
    this.isshowtherapist = false;
  }
}

getUserList() {
  const getUserRole = this.authservice.getUserRole();
  const getClientId = this.authservice.getClientId();

  if (getUserRole === 'SuperAdmin') {
    this.authservice.getUserList().subscribe(users => {
      this.userList = users;
      this.users = this.userList.map((user: any, index: number) => ({
        ...user,
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));
    });
  } else if (getClientId) {
    this.authservice.getUserList(getClientId).subscribe(users => {
      this.userList = users;

      this.users = this.userList.map((user: any, index: number) => ({
        ...user,
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));
    });
  }
}

  getRoleList() {
    this.authservice.getRoleList().subscribe((res: any) => {
      this.userRole = res;
    });
  }

  getDepartmentList() {
    this.adminservice.getDepartment().subscribe((res: any) => {
      this.userDepartment = res.departments;
    });
  }

  getSpecializations(departmentId: any) {
    this.adminservice.getSpecializations(departmentId).subscribe((res: any) => {
      this.userSpecializations = res.specializations;
    });
  }

  getUserDepartmentId() {

    const selectedObject = this.addUserForm.get('department')?.value;
    if (selectedObject) {
      this.get_id = selectedObject.id;
      this.get_value = selectedObject.value;
      this.getSpecializations(this.get_id);
    }
  }

  get User(): { [key: string]: AbstractControl } {
    return this.addUserForm.controls;
  }

onDelete(id: string){
const confirmed = confirm('Are you sure you want to delete this user?');
  if (!confirmed) return;

  this.adminservice.deleteUser(id).subscribe(
    (res: any) => {
      this.toastr.success('User deleted successfully.');
      this.getUserList();
    },
    (err) => {
      this.toastr.error(
        err.status === 401 ? 'Unauthorized' : 'Error deleting user'
      );
    }
  );
}
  gridApi!: GridApi;
  gridColumnApi!: Column; paginationPageSize = 10;
  paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];
  searchValue: string = '';

// onGridReady(params: any) {
//   debugger
//   this.gridColumnApi = params.columnApi;

//   params.api.addEventListener('cellClicked', (event: any) => {
//     const actionType = event.event.target.getAttribute('data-action');
//     const id = event.event.target.getAttribute('data-id');

//     if (actionType === 'edit') {
//       this.editUser(id);
//       this.setTab('AddUser');
//     } else if (actionType === 'delete') {
//       this.onDelete(id);
//     }
//   });
// }

setTab(tab: 'ListUser' | 'AddUser') {
  this.selectedTab = tab;
 
  setTimeout(() => {
    const slider = document.querySelector('.slider') as HTMLElement;
    const tabElements = document.querySelectorAll('.tab');

    const tabIndex = { 'ListUser': 0, 'AddUser': 1 }[tab];
if(tab === 'ListUser'){
 this.isEditMode = false;
}
    if (slider && tabElements[tabIndex]) {
      const tabEl = tabElements[tabIndex] as HTMLElement;
      slider.style.left = `${tabEl.offsetLeft}px`;
      slider.style.width = `${tabEl.offsetWidth}px`;
    }
  }, 0);
}



columnDefs: any = [
  {
    headerCheckboxSelection: true,
    filter: false,
    checkboxSelection: true,
    field: 'checkbox',
    width: 40,
    pinned: 'left',
    cellClass:'no-focus-style'
  },
  {
    headerName: 'Name',
    filter: false,
    field: 'username',
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
  { headerName: 'Email', field: 'email', flex: 1 ,filter: false},
  {
    headerName: 'Mobile',
    filter: false,
    field: 'phoneNumber',
    flex: 1,
    cellRenderer: (params: any) =>
      `<i class="fa fa-phone text-green-600 mr-1"></i> ${params.value}`,
  },
  { headerName: 'Country', field: 'country', flex: 1 ,filter: false},
  { headerName: 'City', field: 'city', filter: false, flex: 1 },
  { headerName: 'Roles', field: 'roles',filter: false, flex: 1 },


  {
    headerName: 'Actions',
    field: 'actions',
    flex: 1,
    filter: false,
    pinned: 'right',
    cellRenderer: (params: any) => {
      return `
        <div class="flex gap-2">
          <button class="text-primary-border-color  hover:underline" data-action="edit">
            <i class="fa fa-edit"></i>
          </button>
          <button class="text-primary-border-color hover:underline" data-action="delete">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
    },
  },
];

defaultColDef = {
    sortable: true,
    filter: false,
    resizable: true,
};

users:any[] = [];

gridOptions:any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  onGridReady: (params: any) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  },
};

getUserId!:string;

onCellClicked(event: any): void {
  debugger
  if (event.colDef.field !== 'actions') return;
  const id = event.data.id;
  const clickedEl = event.eventPath?.[0] || event.target;
  if (!id || !clickedEl) return;
  const classList = clickedEl.classList;
  if (classList.contains('fa-edit')) {
    this.setTab('AddUser');
    this.editUser(id);
  } else if (classList.contains('fa-trash')) {
    this.onDelete(id);
    this.getUserId = id;
  }
}

onQuickFilterChanged(): void {
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', this.searchValue);
    }
}

onExportClick() {
    const worksheet = XLSX.utils.json_to_sheet(this.users);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'userList.xlsx');
}

onPageSizeChanged(size: number) {
  this.paginationPageSize = +size;

  const gridElement = document.querySelector('.ag-theme-custom') as HTMLElement;

  if (this.paginationPageSize > 20) {
    gridElement.style.height = '500px';
  } else {
    gridElement.style.height = 'auto';
  }
}

preventAbove(event: KeyboardEvent): void {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];
  if (allowedKeys.includes(event.key)) return;

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
    return;
  }

  const nextValue = value + event.key;
  if (nextValue.length > 17) {
    event.preventDefault();
  }
}
}
