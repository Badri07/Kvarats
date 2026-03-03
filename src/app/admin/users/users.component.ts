import { ChangeDetectorRef, Component, HostListener, signal, ViewChild } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AdminService } from '../../service/admin/admin.service';
import { TosterService } from '../../service/toaster/tostr.service';
import { MatSelectChange } from '@angular/material/select';
import { MatTableDataSource } from '@angular/material/table';
import { User } from '../../models/user-model';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PopupService } from '../../service/popup/popup-service';
import { GridApi, Column, CellClickedEvent, ColDef, GridReadyEvent } from 'ag-grid-community';
import { ActivatedRoute } from '@angular/router';

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
     viewMode: 'detail' | 'list' = 'detail';
      selectedUser: any = null;


  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  showModal = false;
  isLoader = false;
  isshowtherapist:boolean = false;

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

  // showDeleteConfirm:boolean = false;
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
    private _loader:PopupService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if(params['tab']){
        this.selectedTab = params['tab'];
      }
    })

      this.breadcrumbService.setBreadcrumbs([
    { label: 'Users', url: 'users' },
    
  ]);

    this.addUserForm = this.fb.group({
      Username: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email,emailWithComValidator]],
      roleIds: ['', Validators.required],
      contactNumber: [
  '',
  [
    Validators.required,
    Validators.pattern(/^\D*(\d\D*){10}$/)
  ]
],

      specialization: [''],
      department: [''],
      qualification: [''],
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
  debugger
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
      this.countries = res.data;
    });
  }

  getStates() {
    if (this.selectedCountry) {
      this.authservice.getStates(this.selectedCountry).subscribe(res => {
        this.states = res.data;
      });
    }
  }

  getCities() {
    if (this.selectedCountry && this.selectedStateCode) {
      this.authservice.getCities(this.selectedCountry, this.selectedStateCode).subscribe(res => {
        this.cities = res.data;
      });
    }
  }

  getZipCodes() {
    if (this.selectedCountry && this.selectedStateCode && this.selectedCity) {
      this.authservice.getZipCodes(this.selectedCountry, this.selectedStateCode, this.selectedCity).subscribe(res => {
        this.zipCodes = res.data;
      });
    }
  }

  zipCodeSelected:any;

 onAddressZipChange() {
  debugger;
  const selectedCountryDataId = this.addUserForm.get('countryDataId')?.value;
  this.zipCodeSelected = selectedCountryDataId;
  console.log("Selected Zip:", selectedCountryDataId);
}


  onSubmit() {
    console.log("userForm",this.addUserForm.value);  
  if (this.addUserForm.invalid) {
    this.UserSubmitted = true;
    return;
  }
  this._loader.show();
  const formValue = this.addUserForm.value;
  const getRoleName = formValue.roleIds;
  const getRoleId = getRoleName.roleName;
  // console.log("getRoleId",getRoleId);
  // const userData = JSON.parse(localStorage.getItem('user') || '{}');
  // const createdBy = userData?.id;  
  const payload: any = {
    clientId: this.authservice.getClientId(),
    username: formValue.Username,
    firstName: formValue.firstName,
    lastName: formValue.lastName,
    email: formValue.email,
    role: getRoleId,
    phoneNumber: String(formValue.contactNumber),
    address: formValue.address,
    department: formValue.department?.description || '',
    specialization: formValue.specialization?.description,
    qualifications: formValue.qualification,
    active: true,
    countryDataId: this.addUserForm.get('countryDataId')?.value //this.zipCodeSelected
  };

  if (this.isEditMode) {
    this.adminservice.updateUser(this.editUserId, payload).subscribe({
      next: () => {
         this._loader.hide();
        this.toastr.success('User updated successfully');
        this.addUserForm.reset();
        this.UserSubmitted = false;
        this.getUserList();
        this.isEditMode = false;
        this.isShowUserDetails =  false;
        this.isshowuserList =  true;
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
        this.UserSubmitted = false;
        this.setTab('ListUser');
        this.getUserList();
         this.isshowtherapist = false
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
  this.isEditMode = true;
  this.isShowUserDetails = false;
  this.editUserId = id;
  this.isshowuserForm = true;
  this.setTab('AddUser');

  forkJoin([
    this.authservice.getRoleList(),
    this.adminservice.getUserById(id),
    this.authservice.getCountries(),
    this.adminservice.getDepartment()
  ]).subscribe({
    next: ([roleRes, userRes, countries, departments]) => {
      try {
        if (!userRes || !userRes.id) {
          throw new Error('User data not found');
        }

        const userData = userRes;
        this.userRole = roleRes;
        this.countries = countries.data;
        this.userDepartment = departments;

        const userRoleName = userData.roles?.[0];
        const selectedRole = this.userRole.find((r: any) =>
          r.name === userRoleName || r.roleName === userRoleName
        );

        const selectedCountry = this.countries.find(c =>
          c.country === userData.country
        );

        const selectedDepartment = this.userDepartment.find(d =>
          d.description === userData.department
        );

        this.addUserForm.patchValue({
          Username: userData.userName || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          roleIds: selectedRole || null,
          contactNumber: userData.phoneNumber || '',
          qualification: userData.qualifications || '',
          address: userData.address || '',
          country: selectedCountry || null,
          phoneCode: userData.mobilePrefixCode || '',
          department: selectedDepartment || null
        });

        const isTherapist = selectedRole?.roleName === 'Therapist';
        this.isshowtherapist = isTherapist;
        this.updateTherapistControls(isTherapist);
        

        if (isTherapist && selectedDepartment?.id) {
          this.loadSpecializationsForEdit(
            selectedDepartment.id,
            userData.specialization
          );
        }

        this.selectedCountry = userData.country;
        this.selectedCountryCode = userData.mobilePrefixCode;

        this.cdr.detectChanges();
        this.loadLocationData(userData, selectedRole);

      } catch {
        this.toastr.error('Failed to load user data');
      }
    },
    error: () => {
      this.toastr.error('Failed to load initial data');
    }
  });
}


loadSpecializationsForEdit(departmentId: any, userSpecializationName: string) {

 this.adminservice.getSpecializations(departmentId).subscribe({
    next: (res: any) => {
      this.userSpecializations = res || [];
      if (userSpecializationName && this.userSpecializations.length > 0) {
        const selectedSpecialization = this.userSpecializations.find(s => 
          s.description === userSpecializationName
        );
        if (selectedSpecialization) {
          this.addUserForm.get('specialization')?.setValue(selectedSpecialization);
        }
      }
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.userSpecializations = [];
    }
  });
}
loadLocationData(userData: any, selectedRole: any) {  
  debugger
  if (!userData.country) {
    return;
  }
  // Load states
  this.authservice.getStates(userData.country).subscribe({
    next: (states) => {
      this.states = states.data || [];      
      const selectedState = userData.stateName ? 
        this.states.find((s: any) => {
          const stateMatch = s?.stateName?.toLowerCase() === userData.stateName?.toLowerCase() ||
                           s?.name?.toLowerCase() === userData.stateName?.toLowerCase();
          return stateMatch;
        }) : null;      
      this.addUserForm.get('state')?.setValue(selectedState || null);
      this.selectedStateCode = selectedState?.stateCode || selectedState?.code || userData.stateCode;
      if (this.selectedStateCode || userData.stateCode) {
        this.loadCities(userData, selectedRole);
      } else {
        this.cdr.detectChanges();
      }
    },
    error: (err) => {
      this.cdr.detectChanges();
    }
  });
}

loadCities(userData: any, selectedRole: any) {
  const stateCodeToUse = this.selectedStateCode || userData.stateCode;
  if (!stateCodeToUse) {
    return;
  }
  this.authservice.getCities(userData.country, stateCodeToUse).subscribe({
    next: (cities) => {
      this.cities = cities.data || [];      
      const selectedCity = userData.cityName ? 
        this.cities.find((c: any) => {
          const cityMatch = c?.cityName?.toLowerCase() === userData.cityName?.toLowerCase() ||
                          c?.name?.toLowerCase() === userData.cityName?.toLowerCase();
          return cityMatch;
        }) : null;      
      this.addUserForm.get('city')?.setValue(selectedCity || null);
      this.selectedCity = selectedCity?.cityName || selectedCity?.name || userData.cityName;
      if (this.selectedCity || userData.cityName) {
        this.loadZipCodes(userData, selectedRole);
      } else {
        this.cdr.detectChanges();
      }
    },
    error: (err) => {
      this.cdr.detectChanges();
    }
  });
}

loadZipCodes(userData: any, selectedRole: any) {
  const stateCodeToUse = this.selectedStateCode || userData.stateCode;
  const cityToUse = this.selectedCity || userData.cityName;
  if (!stateCodeToUse || !cityToUse) {
    return;
  }

  this.authservice.getZipCodes(userData.country, stateCodeToUse, cityToUse).subscribe({
    next: (zipCodes) => {
      this.zipCodes = zipCodes?.data || zipCodes || [];
      
      const selectedZip = this.zipCodes.find((z: any) => {
        // Try multiple matching strategies
        const matchesById = z?.id === userData.countryDataId;
        const matchesByZipCode = z?.zipCode === userData.zipCode;
        const matchesByPostalCode = z?.postalCode === userData.zipCode;
        const matchesByCode = z?.code === userData.zipCode;
        
        return matchesById || matchesByZipCode || matchesByPostalCode || matchesByCode;
      });      
      // Set form values with fallbacks
      const finalCountryDataId = selectedZip?.id || userData.countryDataId || null;
      const finalZipCode = selectedZip?.zipCode || selectedZip?.postalCode || selectedZip?.code || userData.zipCode || '';
      
      this.addUserForm.get('countryDataId')?.setValue(finalCountryDataId);
      this.addUserForm.get('zipCode')?.setValue(finalZipCode);

      this.cdr.detectChanges();
    },
    error: (err) => {
      this.addUserForm.get('countryDataId')?.setValue(userData.countryDataId || null);
      this.addUserForm.get('zipCode')?.setValue(userData.zipCode || '');
      
      this.cdr.detectChanges();
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


  onRoleChange(event: Event): void {
  const selectedRole = this.addUserForm.get('roleIds')?.value;

  if (!selectedRole) return;

  const isTherapist = selectedRole.roleName === 'Therapist';

  this.isshowtherapist = isTherapist;

  this.updateTherapistControls(isTherapist);
}


private updateTherapistControls(isTherapist: boolean): void {
  const departmentCtrl = this.addUserForm.get('department');
  const specializationCtrl = this.addUserForm.get('specialization');
  const qualificationCtrl = this.addUserForm.get('qualification');

  if (isTherapist) {
    // ✅ Therapist → make required
    departmentCtrl?.setValidators([Validators.required]);
    specializationCtrl?.setValidators([Validators.required]);
    qualificationCtrl?.setValidators([Validators.required]);
  } else {
    
    departmentCtrl?.reset();
    specializationCtrl?.reset();
    qualificationCtrl?.reset();

    departmentCtrl?.clearValidators();
    specializationCtrl?.clearValidators();
    qualificationCtrl?.clearValidators();

    // Optional: clear dropdown data too
    this.userSpecializations = [];
  }

  departmentCtrl?.updateValueAndValidity();
  specializationCtrl?.updateValueAndValidity();
  qualificationCtrl?.updateValueAndValidity();
}





// Update your getUserList method to ensure users have avatars
getUserList() {
  const userRole = this.authservice.getUserRole();
  const clientId = this.authservice.getClientId();

  if (userRole === 'SuperAdmin') {
    this.authservice.getUserList().subscribe((users: any[]) => {
      this.userList = users;

      this.users = this.userList.map((user: any, index: number) => ({
        ...user,
        age: this.calculateAge(user.dateOfBirth),
        avatar:
          user.avatar ||
          `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));
      this.filteredUsers = [...this.users];
    });

  } else if (clientId) {
    this.authservice.getUserList(clientId).subscribe((users: any[]) => {
      this.userList = users;

      this.users = this.userList.map((user: any, index: number) => ({
        ...user,
        age: this.calculateAge(user.dateOfBirth),
        avatar:
          user.avatar ||
          `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
      }));
      this.filteredUsers = [...this.users];
    });
  }
}


calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

  getRoleList() {
    this.authservice.getRoleList().subscribe((res: any) => {
      this.userRole = res;
    });
  }

  getDepartmentList() {
    this.adminservice.getDepartment().subscribe((res: any) => {
      this.userDepartment = res;
      console.log(" res",res);
    });
  }

  getSpecializations(departmentId: any) {
    this.adminservice.getSpecializations(departmentId).subscribe((res: any) => {
      this.userSpecializations = res;
    });
  }

  getUserDepartmentId() {
debugger
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

// Add this property to your component class
showDeleteConfirm = false;
deleteUserId: string | null = null;

// // Updated onDelete method
// onDelete(id: string) {
//   this.deleteUserId = id;
//   this.showDeleteConfirm = true;
// }

// Add these methods to handle the dialog actions
// deleteUser() {
//   if (!this.deleteUserId) return;

//   this.adminservice.deleteUser(this.deleteUserId).subscribe(
//     (res: any) => {
//       this.toastr.success('User deleted successfully.');
//       this.getUserList();
//       this.resetDeleteState();
//     },
//     (err) => {
//       this.toastr.error(
//         err.status === 401 ? 'Unauthorized' : 'Error deleting user'
//       );
//       this.resetDeleteState();
//     }
//   );
// }

cancelDelete() {
  this.resetDeleteState();
}

resetDeleteState() {
  this.showDeleteConfirm = false;
  this.deleteUserId = null;
}
  gridApi!: GridApi;
  
  searchValue: string = '';

  onGridReady(params: GridReadyEvent): void {
  this.gridApi = params.api;
  this.gridApi.setGridOption('paginationPageSize', this.paginationPageSize);
}


// onGridReady(params: any) {
//   
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
 this.addUserForm.reset();
 this.selectedTabMenu = 'user-info'
}
    if (slider && tabElements[tabIndex]) {
      const tabEl = tabElements[tabIndex] as HTMLElement;
      slider.style.left = `${tabEl.offsetLeft}px`;
      slider.style.width = `${tabEl.offsetWidth}px`;
    }
  }, 0);
}



columnDefs: ColDef[] = [  
  {
  headerName: 'Name',
  flex: 1.5,
  valueGetter: (params) => {
    const first = params.data?.firstName || '';
    const last = params.data?.lastName || '';
    return `${first} ${last}`.trim();
  },
  cellRenderer: (params: any) => `
    <div class="flex items-center gap-2">
      <img 
        src="${params.data.avatar}" 
        class="rounded-full w-8 h-8"
        onerror="this.src='assets/avatar.png'"
      />
      <span>${params.value}</span>
    </div>
  `
},
  {
    headerName: 'Email',
    field: 'email',
    flex: 1
  },
  {
    headerName: 'Mobile',
    field: 'phoneNumber',
    flex: 1,
    cellRenderer: (params: any) =>
      `<i class="fa fa-phone text-green-600 mr-1"></i> ${params.value || 'N/A'}`
  },
  {
    headerName: 'Country',
    field: 'country',
    flex: 1
  },
  {
    headerName: 'City',
    field: 'cityName',
    flex: 1
  },
  {
    headerName: 'Roles',
    field: 'roles',
    flex: 1,
    valueGetter: params =>
      Array.isArray(params.data.roles)
        ? params.data.roles.join(', ')
        : params.data.roles || 'N/A'
  },
  {
  headerName: 'Actions',
  pinned: 'right',
  width: 130,
  sortable: false,
  filter: false,

  cellStyle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  cellRenderer: () => `
    <div class="flex gap-3">
      <i class="fa fa-edit text-blue-500 cursor-pointer action-edit"></i>
      <i class="fa fa-trash text-red-500 cursor-pointer action-delete"></i>
    </div>
  `
}

];

defaultColDef = {
    sortable: true,
    filter: false,
    resizable: true,
};

users:any[] = [];
filteredUsers: any[] = [];
getUserId!:string;

onCellClicked(event: CellClickedEvent): void {
  if (event.colDef.headerName !== 'Actions') return;

  const target = event.event?.target as HTMLElement;
  if (!target) return;

  const userId = event.data?.id;
  if (!userId) return;

  if (target.classList.contains('action-edit')) {
    this.setTab('AddUser');
    this.editUser(userId);
  }

  if (target.classList.contains('action-delete')) {
    this.onDelete(userId);
  }
}


onQuickFilterChanged(): void {
  const value = this.searchValue?.toLowerCase() || '';

  if (this.viewMode === 'list' && this.gridApi) {
    this.gridApi.setGridOption('quickFilterText', value);
    this.gridApi.paginationGoToFirstPage();
  }

  if (this.viewMode === 'detail') {
    this.filteredUsers = this.users.filter(user =>
      [
        user.firstName,
        user.lastName,
        user.userName,
        user.email,
        user.phoneNumber,
        user.cityName,
        user.country,
        Array.isArray(user.roles) ? user.roles.join(' ') : user.roles
      ]
        .join(' ')
        .toLowerCase()
        .includes(value)
    );
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

selectedTabMenu: 'user-info' | 'professional-info' = 'user-info';
tabs = ['user-info', 'professional-info'];
onNext(): void {
    this.UserSubmitted = true;

    // If on first tab, validate first-tab controls only
    if (this.selectedTabMenu === 'user-info') {
      if (this.validateUserInfoTab()) {
        this.selectedTabMenu = 'professional-info';
        this.UserSubmitted = false;
      }
    }
    // If on second tab, validation handled on submit
  }
validateUserInfoTab(): boolean {
  this.UserSubmitted = true;

  const userInfoControls = {
    firstName: this.addUserForm.get('firstName'),
    lastName: this.addUserForm.get('lastName'),
    dob: this.addUserForm.get('dob'),
    gender: this.addUserForm.get('gender'),
    email: this.addUserForm.get('email'),
    Username: this.addUserForm.get('Username'),
    address: this.addUserForm.get('address'),
    country: this.addUserForm.get('country'),
    state: this.addUserForm.get('state'),
    city: this.addUserForm.get('city'),
    countryDataId: this.addUserForm.get('countryDataId'),
    phoneCode: this.addUserForm.get('phoneCode'),
    contactNumber: this.addUserForm.get('contactNumber')
  };

  // Check if any control is invalid
  const isInvalid = Object.values(userInfoControls).some(control => control?.invalid);

  if (isInvalid) {
    // Scroll to the first invalid control
    const invalidControl = document.querySelector('.is-invalid');
    if (invalidControl) {
      invalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return false;
  }

  return true;
}
  onBack(): void {
    const index = this.tabs.indexOf(this.selectedTabMenu);
    if (index > 0) {
      this.selectedTabMenu = this.tabs[index - 1] as 'user-info' | 'professional-info';
    }
  }
   setTabMenu(tab: any): void {
    if (this.tabs.includes(tab)) {
      this.selectedTabMenu = tab;
    }
  }

    formatUSPhone(event: Event) {
  const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 17) {
    value = value.slice(0, 17);
  }
    if (value.length > 6) {
    value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
  } else if (value.length > 3) {
    value = value.replace(/(\d{3})(\d+)/, '$1-$2');
  }

  input.value = value;
}
formatPhone(phone: string): string {
  // Format phone number if needed
  if (!phone) return 'N/A';
  
  // Simple formatting - you can enhance this based on your needs
  if (phone.length === 10) {
    return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
  }
  
  return phone;
}


currentPage = 1;
paginationPageSize = 10;
totalPages = 1;
pageStart = 0;
pageEnd = 0;
totalCount = 0;
paginationPageSizeSelector = [10, 20, 50, 100];

isshowUserDetails:boolean = false;
// selectedUser: any = null;

getUserInitials(user: any): string {
 
    if (user.firstName && user.lastName) {
    return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
  }
    if (user.userName) {
    const nameParts = user.userName.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return user.userName.substring(0, 2).toUpperCase();
  }
  
  return 'U';
}

goBackToList(): void {
  this.isshowuserList = true;
  this.isshowUserDetails = false;
  this.selectedUser = null;
}

isLoading = false;

showFilters = false;
showFilterOption = true; // Set to false if you don't want filters

toggleFilters(): void {
  this.showFilters = !this.showFilters;
}

clearSearch(): void {
  this.searchValue = '';

  // Reset AG Grid search
  if (this.gridApi) {
    this.gridApi.setGridOption('quickFilterText', '');
  }

  // Reset card/grid view
  this.filteredUsers = [...this.users];
}



isshowuserList:boolean =true;
isShowUserDetails:boolean = false;
viewUserList:any[]=[]
viewUserDetails(user: any): void {
  this.isLoading = true;
  this.isShowUserDetails = false;
  this.selectedUser = null;
  this.isshowuserList = false;

  this.adminservice.getUserById(user).subscribe({
    next: (response: any) => {
      console.log('API Response:', response);
      this.viewUserList = [response];
      this.selectedUser = response;
      this.isShowUserDetails = true;
      this.isLoading = false;
    },
    error: (error: any) => {
      console.error('Error fetching user details:', error);
      this.isShowUserDetails = true;
      this.isLoading = false;
    }
  });
}




  isshowPagination:boolean = true;
  onPageSizeChange(newSize: number): void {
    this.paginationPageSize = newSize;
    this.currentPage = 1; // Reset to first page on size change
    this.getUserList();
  }

  // Go to specific page
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.getUserList();
    }
  }

  // Go to previous page
  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.getUserList();
    }
  }

  // Go to next page
  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.getUserList();
    }
  }

  
  openMenuId: number | null = null;
closeMenu() {
    this.openMenuId = null;
  }
 onMenuButtonClick(event: Event, userId: number) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === userId ? null : userId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showFilters = false;
      this.openMenuId = null;
    }
  }


  getAvatarColor(initials: string): string { const colors = [ '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#d35400', '#c0392b', '#16a085' ]; let hash = 0; for (let i = 0; i < initials.length; i++) { hash = initials.charCodeAt(i) + ((hash << 5) - hash); } return colors[Math.abs(hash) % colors.length]; } getInitials(name: string, contactPerson: string): string { const fullName = name || contactPerson || ''; if (!fullName.trim()) return '??'; const names = fullName.split(' '); if (names.length === 1) { return names[0].charAt(0).toUpperCase(); } return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase(); }


  showDeleteModal = signal(false);
  userToDelete = signal<any>(null);
  isDeleting = signal(false);
confirmDelete(user: any): void {
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  deleteUser(): void {
    const user = this.userToDelete();
    if (!user || !user.id) {
      this.toastr.error('Invalid user data');
      return;
    }

    this.isDeleting.set(true);
    this.adminservice.deleteUser(user.id).subscribe({
      next: (res: any) => {
        this.toastr.success('User deleted successfully');
        this.getUserList();
        this.closeDeleteModal();
        this.isDeleting.set(false);
        
        // Reset view states if needed
        if (this.isShowUserDetails && this.selectedUser?.id === user.id) {
          this.goBackToList();
        }
      },
      error: (err: any) => {
        this.toastr.error(
          err.status === 401 ? 'Unauthorized' : 'Error deleting user'
        );
        console.error('Error deleting user:', err);
        this.isDeleting.set(false);
      },
      complete: () => {
        this.isDeleting.set(false);
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  // Update the existing onDelete method to use the modal
  onDelete(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.confirmDelete(user);
    }
  }

  // Update the delete method in the action menu
  onMenuDelete(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.confirmDelete(user);
      this.closeMenu();
    }
  }
}

