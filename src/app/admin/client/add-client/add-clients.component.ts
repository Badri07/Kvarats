import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../service/admin/admin.service';
import { AuthService } from '../../../service/auth/auth.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SuperAdminService } from '../../../service/admin/superAdmin.service';
import { PopupService } from '../../../service/popup/popup-service';

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
    public _superadminService = inject(SuperAdminService);


  // Form related properties
  clientForm!: FormGroup;
  clientSubmitted: boolean = false;
  isEditMode: boolean = false;
  isSubmitting: boolean = false;

  // Dropdown data - Initialize as empty arrays
  countryList: any[] = [];
  states: any[] = [];
  cities: any[] = [];
  zipCodes: any[] = [];
  get_Country: string = '';
  selectedStateCode: string = '';
  selectedCity: string = '';

  // Client list and filtering
  rowData: any[] = [];
  filteredClients: any[] = [];
  userList: any[] = [];
  
  searchValue: string = '';
  selectedFilter: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;
  totalPages: number = 1;
  showEllipsis: boolean = false;

  // View state
  showClientDetails: boolean = false;
  showEditForm: boolean = false;
  selectedClient: any = null;
  isshowcardList:boolean = true
JSON: any;

public _loader = inject(PopupService);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Client', url: 'clients' },
    ]);
    this.initializeForm();
    this.loadClientList();
    this.loadCountries();
  }

  initializeForm(): void {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required],
      countryDataId: [null],
      isSoloProvider: [false, Validators.required],
      Country: [null],
      state: [null],
      city: [null],
    });
  }

  loadCountries() {
    this._loader.show();
    this.authService.getCountries().subscribe({
      next: (res) => {
        this._loader.hide();
        this.countryList = res.data;
        if (this.countryList.length > 0) {
        }
      },
      error: (err) => {
        this._loader.hide();
        this.countryList = [];
      }
    });
  }

  onCountryChange() {
    const selectedCountryObj: any = this.clientForm.value.Country;
    if (selectedCountryObj) {
      this.get_Country = selectedCountryObj.country;
      this.getStates();
      this.states = [];
      this.cities = [];
      this.zipCodes = [];
      this.clientForm.patchValue({
        state: null,
        city: null,
        countryDataId: null
      });
    } else {
      this.get_Country = '';
      this.states = [];
      this.cities = [];
      this.zipCodes = [];
    }
  }

  onStateChange() {
    this.selectedStateCode = this.clientForm.value.state;
    if (this.selectedStateCode) {
      this.getCities();
      // Reset dependent dropdowns
      this.cities = [];
      this.zipCodes = [];
      this.clientForm.patchValue({
        city: null,
        countryDataId: null
      });
    } else {
      this.cities = [];
      this.zipCodes = [];
    }
  }

  onCityChange() {
    this.selectedCity = this.clientForm.value.city;
    if (this.selectedCity) {
      this.getZipCodes();
    } else {
      this.zipCodes = [];
    }
  }

getStates() {
  if (this.get_Country) {
    this.authService.getStates(this.get_Country).subscribe({
      next: (res) => {
        this.states = res.data;
      },
      error: (err) => {
        this.states = [];
      }
    });
  } else {
    this.states = [];
  }
}


getCities() {
  if (this.get_Country && this.selectedStateCode) {
    this.authService.getCities(this.get_Country, this.selectedStateCode).subscribe({
      next: (res) => {
        this.cities = res.data;
      },
      error: (err) => {
        this.cities = [];
      }
    });
  } else {
    this.cities = [];
  }
}


getZipCodes() {
  if (this.get_Country && this.selectedStateCode && this.selectedCity) {
    this.authService.getZipCodes(this.get_Country, this.selectedStateCode, this.selectedCity).subscribe({
      next: (res) => {
        this.zipCodes = res.data;
      },
      error: (err) => {
        this.zipCodes = [];
      }
    });
  } else {
    this.zipCodes = [];
  }
}

loadClientList(): void {
  this._loader.show();
    this.adminService.getClientList().subscribe({
      next: (data) => {
        this._loader.hide();
        this.userList = Array.isArray(data) ? data : [];
        this.rowData = this.userList.map((user: any) => ({
          ...user,
          initials: this.getInitials(user.name, user.contactPerson)
        }));
        this.applyFilters();
      },
      error: (err) => {
      this._loader.hide();
        console.error('Failed to fetch client list', err);
        this.toastr.error('Failed to load clients');
        this.userList = [];
        this.rowData = [];
        this.filteredClients = [];
      }
    });
  }

  getAvatarColor(initials: string): string {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#d35400', '#c0392b', '#16a085'
    ];
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getInitials(name: string, contactPerson: string): string {
    const fullName = name || contactPerson || '';
    if (!fullName.trim()) return '??';
    const names = fullName.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  // View Client Details
  viewClient(client: any): void {
    console.log("client",client);
    this.selectedClient = client;
    this.showClientDetails = true;
    this.isshowcardList = false;
    this.showEditForm = false;
  }

  editClient(client: any): void {

    this.selectedClient = client;
    this.isEditMode = true;
    this.showEditForm = true;
    this.showClientDetails = false;

    this.states = [];
    this.cities = [];
    this.zipCodes = [];
    this.get_Country = '';
    this.selectedStateCode = '';
    this.selectedCity = '';
    
    this.clientForm.patchValue({
      name: client.name || '',
      contactPerson: client.contactPerson || '',
      email: client.email || '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
      isSoloProvider: client.isSoloProvider || false,
      Country: null,
      state: null,
      city: null,
      countryDataId: client.countryDataId || null
    });
    this.loadAllDataForEdit(client);
  }

  private loadAllDataForEdit(client: any): void {
    const countries$ = this.countryList.length > 0 
      ? forkJoin([of(this.countryList)]) 
      : this.authService.getCountries().pipe(
          switchMap(res => {
            this.countryList = res.data;
            return of(this.countryList);
          })
        );

    countries$.pipe(
      switchMap(() => {        
        const countryObj = this.findMatchingCountry(client.countryName);
        if (!countryObj) {
          this.clientSubmitted = false;
          return of(null);
        }
        this.clientForm.patchValue({ Country: countryObj });
        this.get_Country = countryObj.country;
        return this.authService.getStates(this.get_Country).pipe(
          switchMap((statesRes: any) => {
            this.states = statesRes?.data;
            // Find matching state
            const stateObj = this.findMatchingState(client.stateName);
            if (stateObj) {
              this.clientForm.patchValue({ state: stateObj.stateCode });
              this.selectedStateCode = stateObj.stateCode;
              // Load cities for the selected state
              return this.authService.getCities(this.get_Country, this.selectedStateCode).pipe(
                switchMap((citiesRes: any) => {
                  this.cities = citiesRes?.data;
                  // Find matching city
                  const cityObj = this.findMatchingCity(client.cityName);
                  if (cityObj) {
                    this.clientForm.patchValue({ city: cityObj.cityName });
                    this.selectedCity = cityObj.cityName;
                    // Load zip codes for the selected city
                    return this.authService.getZipCodes(this.get_Country, this.selectedStateCode, this.selectedCity).pipe(
                      switchMap((zipRes: any) => {
                        this.zipCodes = zipRes?.data;
                        // Find matching zip code
                       // After zipCodes are loaded
const zipObj = this.zipCodes.find(z => z.id === client.countryDataId);
if (zipObj) {
  this.clientForm.patchValue({ countryDataId: zipObj.id });
}
                        return of(true);
                      })
                    );
                  }
                  return of(true);
                })
              );
            }
            return of(true);
          })
        );
      })
    ).subscribe({
      next: (result) => {
        this.clientSubmitted = false;
      },
      error: (err) => {
        this.clientSubmitted = false;
      }
    });
  }

private findMatchingCountry(countryName: string): any {
  if (!countryName) return null;

  const searchName = countryName.toLowerCase().trim();
  console.log('Searching for country:', searchName);

  const exactMatch = this.countryList.find(
    c => c.country?.toLowerCase().trim() === searchName
  );
  if (exactMatch) return exactMatch;

  const partialMatch = this.countryList.find(
    c => c.country?.toLowerCase().includes(searchName)
  );
  if (partialMatch) return partialMatch;

  if (this.selectedClient?.mobilePrefixCode) {
    return this.countryList.find(
      c => c.mobilePrefixCode === this.selectedClient.mobilePrefixCode
    );
  }

  return null;
}


private findMatchingState(stateName: string): any {
  if (!stateName ) {
    return null;
  }

  const searchName = stateName.toLowerCase().trim();

  let stateObj = this.states.find(s => {
    const stateName = s.stateName?.toLowerCase().trim();
    return stateName === searchName;
  });

  if (stateObj) {
    return stateObj;
  }

  stateObj = this.states.find(s => {
    const stateName = s.stateName?.toLowerCase();
    return stateName?.includes(searchName) || searchName.includes(stateName || '');
  });

  if (stateObj) {
    return stateObj;
  }
  return null;
}

 private loadCitiesForEdit(client: any): void {  
  this.authService.getCities(this.get_Country, this.selectedStateCode).subscribe({
    next: (citiesRes) => {
      this.cities = Array.isArray(citiesRes) ? citiesRes : [];
      const cityObj = this.findMatchingCity(client.cityName);
      if (cityObj) {
        this.clientForm.patchValue({ city: cityObj.cityName });
        this.selectedCity = cityObj.cityName;
        this.loadZipCodesForEdit(client);
      } else {
        this.clientSubmitted = false;
      }
    },
    error: (err) => {
      this.clientSubmitted = false;
    }
  });
}

private loadZipCodesForEdit(client: any): void {  
  this.authService.getZipCodes(this.get_Country, this.selectedStateCode, this.selectedCity).subscribe({
    next: (zipRes) => {
      this.zipCodes = Array.isArray(zipRes) ? zipRes : [];
      const zipObj = this.zipCodes.find(z => z.id === client.countryDataId);
      if (zipObj) {
        this.clientForm.patchValue({ countryDataId: zipObj.id });
      } else {
      }

      this.clientSubmitted = false;
    },
    error: (err) => {
      this.clientSubmitted = false;
    }
  });
}

private findMatchingCity(cityName: string): any {
  if (!cityName ) {
    return null;
  }

  const searchName = cityName.toLowerCase().trim();
  let cityObj = this.cities.find(c => {
    const cityName = c.cityName?.toLowerCase().trim();
    return cityName === searchName;
  });

  if (cityObj) {
    return cityObj;
  }
  cityObj = this.cities.find(c => {
    const cityName = c.cityName?.toLowerCase();
    return cityName?.includes(searchName) || searchName.includes(cityName || '');
  });

  if (cityObj) {
    return cityObj;
  }
  return null;
}

  // Edit from details view
  editSelectedClient(): void {
    this.showClientDetails = true;

    if (this.selectedClient) {
      this.editClient(this.selectedClient);
    }
  }

  // Close edit form
  closeEditForm(): void {
    this.showEditForm = false;
    this.clientSubmitted = false;
    //  this.isshowcardList = false;
    this.clientForm.reset();
    // Reset dropdowns
    this.states = [];
    this.cities = [];
    this.zipCodes = [];
    this.get_Country = '';
    this.selectedStateCode = '';
    this.selectedCity = '';
    
    if (this.selectedClient && !this.showClientDetails) {
      this.selectedClient = null;
    }
  }

// Properties
showDeleteModal: boolean = false;
selectedClientForDelete: any = null;
// loading: boolean = false;

// Open modal from client list
openDeleteModal(client: any) {
  this.selectedClientForDelete = client;
  this.showDeleteModal = true;
}

// Close modal
closeDeleteModal() {
  this.selectedClientForDelete = null;
  this.showDeleteModal = false;
   this._loader.hide();
}

confirmDelete() {
 
  if (!this.selectedClientForDelete)  return;
 this._loader.show();
  this._superadminService.deleteClient(this.selectedClientForDelete.id).subscribe({
    next: () => {
      this.toastr.success('Client deleted successfully');
      this._loader.hide();
      this.loadClientList();
      if (this.selectedClient && this.selectedClient.id === this.selectedClientForDelete.id) {
        this.backToList();
      }
      this.closeDeleteModal();
    },
    error: (err) => {
      this._loader.hide();
      const backendMessage = err?.message || 'Something went wrong';
      this.toastr.error(backendMessage);
    }
  });
}


  // Back to list view
  backToList(): void {
    this.showClientDetails = false;
    this.showEditForm = false;
    this.selectedClient = null;
    this.isEditMode = false;
    this.clientForm.reset();
    this.clientSubmitted = false;
    // Reset dropdowns
    this.states = [];
    this.cities = [];
    this.zipCodes = [];
    this.get_Country = '';
    this.selectedStateCode = '';
    this.selectedCity = '';
     this.isshowcardList = true;
  }

  // Form submission
  onSubmit() {
    this.clientSubmitted = true;

    if (this.clientForm.invalid) {
      console.log('Form is invalid', this.clientForm.errors);
      return;
    }

    this.isSubmitting = true;
    const formData = this.clientForm.value;

    // Prepare the data for API
    const submitData = {
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      isSoloProvider: formData.isSoloProvider,
      countryDataId: formData.countryDataId
    };

    console.log('Submitting data:', submitData);

    if (this.isEditMode && this.selectedClient) {
      // Update existing client
      this._superadminService.updateClient(this.selectedClient.id, submitData).subscribe({
        next: (updatedClient) => {
          this.toastr.success('Client updated successfully');
          this.isSubmitting = false;
          this.clientSubmitted = false;
          this.loadClientList(); // Reload the list
          this.closeEditForm();
          if (this.showClientDetails) {
            this.selectedClient = { ...this.selectedClient, ...updatedClient };
          }
        },
        error: (err) => {
          console.error('Failed to update client', err);
          this.toastr.error('Failed to update client');
          this.isSubmitting = false;
        }
      });
    } else {
      // Add new client
      this._superadminService.addClient(submitData).subscribe({
        next: (newClient) => {
          this.toastr.success('Client added successfully');
          this.isSubmitting = false;
          this.clientSubmitted = false;
          this.loadClientList(); // Reload the list
          this.closeEditForm();
        },
        error: (err) => {
          console.error('Failed to add client', err);
          this.toastr.error('Failed to add client');
          this.isSubmitting = false;
        }
      });
    }
  }

  // Helper method to get state name from state code
  private getStateName(stateCode: string): string {
    const stateObj = this.states.find(s => s.stateCode === stateCode);
    return stateObj ? stateObj.stateName : stateCode;
  }

  // Filtering and Pagination methods
  filterClients(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchValue = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.rowData;

    if (this.searchValue) {
      const searchTerm = this.searchValue.toLowerCase();
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm) ||
        client.phoneNumber?.includes(searchTerm) ||
        client.contactPerson?.toLowerCase().includes(searchTerm)
      );
    }

    if (this.selectedFilter === 'solo') {
      filtered = filtered.filter(client => client.isSoloProvider);
    } else if (this.selectedFilter === 'multi') {
      filtered = filtered.filter(client => !client.isSoloProvider);
    }

    this.filteredClients = filtered;
    this.totalPages = Math.ceil(this.filteredClients.length / this.pageSize);
  }

  // Pagination methods
  getPaginatedClients(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredClients.slice(startIndex, endIndex);
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredClients.length);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    this.showEllipsis = endPage < this.totalPages;
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get soloProvidersCount(): number {
    return this.rowData.filter(client => client.isSoloProvider).length;
  }

  onExportClick(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.rowData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'clientList.xlsx');
  }

  get addUser(): { [key: string]: AbstractControl } {
    return this.clientForm.controls;
  }
}

