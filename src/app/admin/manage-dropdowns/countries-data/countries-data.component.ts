import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DropdownDataService } from '../../../service/dropdown/dropdown-data-service';
import { CountriesData } from '../../../models/dropdown-data-model';
import { Column, GridApi, GridReadyEvent, PaginationChangedEvent } from 'ag-grid-community';
// import { DropdownDataService } from '../../../../services/dropdown-data.service';
// import { CountriesData } from '../../../../models/dropdown-data.models';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { SuperAdminService } from '../../../service/admin/superAdmin.service';
import { PopupService } from '../../../service/popup/popup-service';

@Component({
  selector: 'app-countries-data',
  templateUrl: './countries-data.component.html',
  styleUrls: ['./countries-data.component.scss'],
  standalone: false
})
export class CountriesDataComponent implements OnInit {
  countries: CountriesData[] = [];
  countryForm: FormGroup;
  isEditing = false;
  editingId: number | null = null;
  showForm = false;
  showDeleteConfirm = false;
  deleteId: number | null = null;


  public _toastr = inject(ToastrService);
  public _loader = inject(PopupService);

  constructor(
    private fb: FormBuilder,
    // private dropdownService: DropdownDataService
  ) {
    this.countryForm = this.fb.group({
      country: ['', [Validators.required, Validators.maxLength(255)]],
      mobilePrefixCode: ['', [Validators.required, Validators.maxLength(10)]],
      stateName: ['', [Validators.required, Validators.maxLength(255)]],
      stateCode: ['', [Validators.required, Validators.maxLength(10)]],
      cityName: ['', [Validators.required, Validators.maxLength(255)]],
      zipCode: ['', [
      Validators.required,
      Validators.pattern(/^[0-9]+$/)
    ]],
    });
  }


  // Ag-grid
    gridApi!: GridApi;
    // gridColumnApi!: Column; paginationPageSize = 10;
    

searchValue: string = '';
gridColumnApi!: Column;
// paginationPageSize: number = 20;
// paginationPageSizeSelector: number[] = [20, 50, 100, 1000];


isshowTable:boolean = true


  public dropdownService = inject(DropdownDataService);
  ngOnInit(): void {
    this.loadCountries();
  }

 
 currentPage = 1;
paginationPageSize = 20; // Can be changed dynamically from dropdown
totalPages = 1;
pageStart = 0;
pageEnd = 0;
totalCount = 0;
paginationPageSizeSelector = [20, 50, 100];

onPageSizeChange() {
  this.currentPage = 1; // Reset to first page on size change
  this.loadCountries();
}
onPaginationChanged(params: PaginationChangedEvent) {
  const page = params.api.paginationGetCurrentPage(); // 0-based index
  const pageSize = params.api.paginationGetPageSize();

  this.currentPage = page + 1;
  this.paginationPageSize = pageSize;

  this.loadCountries();
}

// onGridReady(params: GridReadyEvent) {
//   this.gridApi = params.api;
//   this.loadCountries();

//   this.gridApi.addEventListener('paginationChanged', () => {
//     const currentPage = this.gridApi.paginationGetCurrentPage(); // 0-based
//     const pageSize = this.gridApi.paginationGetPageSize();

//     // this.currentPage = currentPage;
//     // this.paginationPageSize = pageSize;

//     this.loadCountries();
//   });
// }
goToNextPage(): void {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.loadCountries();
  }
}

goToPreviousPage(): void {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.loadCountries();
  }
}



public cdr = inject (ChangeDetectorRef)
loadCountries(): void {
  this._loader.show();
  this.dropdownService.getCountries(this.currentPage, this.paginationPageSize, this.searchTerm)
    .subscribe({
      next: (countries: any) => {
        this.rowData = countries.data.data || [];
        this.totalCount = countries.data.totalRecords || 0;
        this.totalPages = countries.data.totalPages || 1;
        this.pageStart = this.totalCount > 0 ? ((this.currentPage - 1) * this.paginationPageSize) + 1 : 0;
        this.pageEnd = this.totalCount > 0 ? Math.min(this.currentPage * this.paginationPageSize, this.totalCount) : 0;
        this.cdr.detectChanges();
        setTimeout(() => {
          this._loader.hide();
        }, 100);
      },
      error: (err) => {
        console.error(err);
        this._loader.hide();
      }
    });
}


searchTerm: string = '';
onSearch(): void {
  this.currentPage = 1;
  this.loadCountries();
}

  showAddForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.countryForm.reset();
    this.isshowTable = false;
    this.countryForm.patchValue({ active: true });
  }

  editCountry(country: CountriesData): void {
    this.showForm = true;
    this.isEditing = true;
    this.editingId = country.id!;
    this.countryForm.patchValue(country);
    this.isshowTable = false;
  }

onSubmit(): void {
  this._loader.show();

  console.log("zipCodezipCodezipCode",this.countryForm.get('zipCode')?.value);
  
  if (this.countryForm.valid) {
    const formData = this.countryForm.value;
    const payload: CountriesData = {
      id: this.editingId ?? undefined,
      country: String(formData.country),
      mobilePrefixCode: String(formData.mobilePrefixCode),
      stateName: String(formData.stateName),
      stateCode: String(formData.stateCode),
      cityName: String(formData.cityName),
      zipCode: String(formData.zipCode),
    };

    if (this.isEditing && this.editingId) {
      this.dropdownService.updateCountry(payload, this.editingId).subscribe({
        next: (res: any) => {
          this._loader.hide();
          if (res) {
            this._toastr.success(res.message || 'Updated successfully');
            this.loadCountries();
            this.cancelForm();
          } else {
            this._toastr.error(res.message || 'Failed to update country.');
          }
        },
        error: (err) => {
          console.error('Update error:', err);
          this._loader.hide();
          this._toastr.error(err?.error?.message || 'Failed to update country. Please try again.');
        }
      });
    } else {
      this.dropdownService.createCountry(payload).subscribe({
        next: (res: any) => {
          this._loader.hide();
          if (res) {
            this._toastr.success(res.message || 'Added successfully');
            this.loadCountries();
            this.cancelForm();
          } else {
            this._toastr.error(res.message || 'Failed to add country.');
          }
        },
        error: (err) => {
          console.error('Create error:', err);
          this._loader.hide();
          this._toastr.error(err?.error?.message || 'Failed to add country. Please try again.');
        }
      });
    }
  } else {
    this._loader.hide();
  }
}

allowNumbersOnly(event: KeyboardEvent): boolean {
  const charCode = event.which ? event.which : event.keyCode;

  if (
    charCode === 8 ||  
    charCode === 9 || 
    charCode === 37 || 
    charCode === 39 ||  
    charCode === 46    
  ) {
    return true;
  }

  if (charCode < 48 || charCode > 57) {
    event.preventDefault();
    return false;
  }

  return true;
}

  confirmDelete(id: number): void {
    this.deleteId = id;
    this.showDeleteConfirm = true;
  }

deleteCountry(): void {
  if (this.deleteId) {
    this._loader.show();
    this.dropdownService.deleteCountry(this.deleteId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this._toastr.success("Deleted successfully");
          this.loadCountries();
          this.showDeleteConfirm = false;
          this.deleteId = null;
        } else {
          this._toastr.error(response.message || "Unable to delete country");
          this.showDeleteConfirm = false;
        }
        this._loader.hide();
      },
      error: (err: any) => {
        this._toastr.error(err?.error?.message || "Something went wrong");
        this.showDeleteConfirm = false;
        this._loader.hide();
      }
    });
  }
}


  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.isshowTable = true;
    this.countryForm.reset();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteId = null;
  }  
columnDefs: any = [
  {
    headerName: 'S. No.',
    valueGetter: 'node.rowIndex + 1',
    width: 90,
    pinned: 'left',
    cellClass: 'font-medium text-gray-700',
    headerClass: 'font-bold text-gray-800',
  },
  {
    headerName: 'Country',
    field: 'country',
    flex: 1,
    cellRenderer: (params: any) => {
      const prefixToCodeMap: { [key: string]: string } = {
        '1': 'us',
        '44': 'gb',
        '91': 'in',
        '81': 'jp',
        '49': 'de',
        '33': 'fr',
        '61': 'au',
        '1-CA': 'ca'
      };

      const prefix = params.data?.mobilePrefixCode?.replace('+', '').trim();
      const code = prefixToCodeMap[prefix] || 'un';
      const flagSrc = `https://flagcdn.com/w40/${code}.png`;

      return `
        <div class="flex items-center gap-2 font-medium">
          <img src="${flagSrc}" alt="Flag" class="w-5 h-5 rounded-full border" onerror="this.src='https://flagcdn.com/w40/un.png';"/>
          ${params.value}
        </div>
      `;
    }
  },
  {
    headerName: 'Mobile Prefix',
    field: 'mobilePrefixCode',
    flex: 1,
  },
  {
    headerName: 'State',
    field: 'stateName',
    flex: 1,
    valueGetter: (params: any) =>
      `${params.data.stateName} (${params.data.stateCode})`
  },
  {
    headerName: 'City',
    field: 'cityName',
    flex: 1,
  },
  {
    headerName: 'Zip Code',
    field: 'zipCode',
    flex: 1,
  },
  {
    headerName: 'Status',
    field: 'active',
    flex: 1,
    cellRenderer: (params: any) => {
      const active = params.value;
      return `
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }">
          ${active ? 'Active' : 'Inactive'}
        </span>
      `;
    }
  },
  {
    headerName: 'Actions',
    field: 'actions',
    flex: 1,
    cellRenderer: () => {
      return `
        <div class="flex space-x-2">
          <button class="text-primary-600 hover:text-primary-900 text-sm font-medium" data-action="edit">
            <i class="fa fa-edit"></i>
          </button>
          <button class="text-red-600 hover:text-red-900 text-sm font-medium" data-action="delete">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
    },
    pinned: 'right'
  }
];




  
  defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
  };
  
  rowData:any[] = [];
  gridOptions:any = {
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    onGridReady: (params: any) => {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
    },
  };
  
onCellClicked(event: any): void {
  if (event.colDef.field !== 'actions') return;

  const clickedEl = event.event?.target as HTMLElement;
  const id = event.data?.id;

  if (!clickedEl || !id) return;

  const classList = clickedEl.classList;

  if (classList.contains('fa-edit')) {
    this.editCountry(event.data);
  } else if (classList.contains('fa-trash')) {
   this.confirmDelete(id)
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
      FileSaver.saveAs(blob, 'userList.xlsx');
    }


    

    showUploadPopup = false;
  isDragOver = false;
  selectedFile: File | null = null;

  showFileUploadPopup(): void {
    this.showUploadPopup = true;
  }

  closeFileUploadPopup(): void {
    this.showUploadPopup = false;
    this.selectedFile = null;
    this.isDragOver = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    this.validateAndSetFile(file);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  validateAndSetFile(file: File): void {
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a valid CSV file.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 5MB.');
      return;
    }

    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
  }



  public _superadminService = inject(SuperAdminService);
    isUploading = false;


uploadFile(): void {
  this._loader.show();
    if (!this.selectedFile) {
      this._toastr.warning('Please select a file to upload');
      this._loader.hide();
      return;
    }
    this.isUploading = true; 
    // console.log('Uploading file:', this.selectedFile);
    this.uploadToBackend(this.selectedFile);
  }

  private uploadToBackend(file: File): void {
    this._loader.show();
    this._superadminService.UploadFile(file).subscribe({
      next: (res) => {
        this.isUploading = false;
        this._loader.hide();
        this._toastr.success('File uploaded successfully!');
        this.closeFileUploadPopup();        
        this.loadCountries();
        // console.log('Upload successful:', res);
      },
      error: (error) => {
        this._loader.hide();
        this.isUploading = false;
        console.error('Upload failed:', error);
        if (error.status === 400) {
          this._toastr.error('Invalid file format or data structure');
        } else if (error.status === 413) {
          this._toastr.error('File size too large');
        } else if (error.status === 500) {
          this._toastr.error('Server error occurred during upload');
        } else {
          this._toastr.error('Failed to upload file. Please try again.');
        }
      },
      complete: () => {
        this._loader.hide();
        this.isUploading = false;
      }
    });
  }


  private sampleFile: string = 'https://careslot-dev.s3.amazonaws.com/CountryData/Sample-County-Data.csv?AWSAccessKeyId=AKIAXJSU3GUHIVYCBLG7&Expires=2079705578&Signature=lP4qjZYWQ%2FXmrVkuxtYftOWdBzw%3D';
  isDownloading: boolean = false;

downloadSampleFile(): void {
  if (this.isDownloading) return;
  
  this.isDownloading = true;
   this._loader.show();

  const link = document.createElement('a');
  link.href = this.sampleFile;
  link.download = 'Sample-County-Data.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => {
    this._loader.hide();
    this.isDownloading = false;
    this._toastr.success('Sample file downloaded successfully!');
  }, 1000);
}


clearSearch() {
  this.searchTerm = '';
  this.onSearch();
}

formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i <= 1) {
    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
  }
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
}