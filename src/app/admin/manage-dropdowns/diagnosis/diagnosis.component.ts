import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DropdownDataService } from '../../../service/dropdown/dropdown-data-service';
import { Medication } from '../../../models/dropdown-data-model';
import { Column, GridApi, PaginationChangedEvent } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { PopupService } from '../../../service/popup/popup-service';
import { SuperAdminService } from '../../../service/admin/superAdmin.service';

@Component({
  selector: 'app-diagnosis',
  standalone: false,
  templateUrl: './diagnosis.component.html',
  styleUrl: './diagnosis.component.scss'
})
export class DiagnosisComponent {
 medications: Medication[] = [];
  medicationForm: FormGroup;
  isEditing = false;
  editingId: number | null = null;
  showForm = false;
  showDeleteConfirm = false;
  deleteId: number | null = null;
  public dropdownService = inject(DropdownDataService);
    public _toastr = inject(ToastrService);
  

  constructor(
    private fb: FormBuilder,
  ) {
    this.medicationForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required]],
     
      // active: [true]
    });
  }

  ngOnInit(): void {
    this.loadMedications();
  }

loadMedications(): void {
    this.dropdownService.getdiagnosis(this.currentPage, this.paginationPageSize, this.searchText).subscribe((response: any) => {
      // Assuming your API response structure is similar to countries
      this.rowData = response.data.data || response.data || [];
      this.filteredData = [...this.rowData];
      
      // Set pagination metadata
      this.totalCount = response.data.totalRecords || response.data.length || 0;
      this.totalPages = response.data.totalPages || Math.ceil(this.totalCount / this.paginationPageSize) || 1;

      // Calculate page start and end
      this.pageStart = this.totalCount > 0 ? ((this.currentPage - 1) * this.paginationPageSize) + 1 : 0;
      this.pageEnd = this.totalCount > 0 ? Math.min(this.currentPage * this.paginationPageSize, this.totalCount) : 0;
    });
  }

      searchText: string = '';
      rowData: any[] = [];          
      filteredData: any[] = [];    

onSearch(): void {
  const searchTerm = this.searchText.trim().toLowerCase();
  console.log('Search term:', JSON.stringify(searchTerm));

  if (!searchTerm) {
    console.log('Search term is empty - resetting filtered data');
    this.filteredData = [...this.rowData];
  } else {
    this.filteredData = this.rowData.filter(item =>
      (item.name && item.name.toLowerCase().includes(searchTerm)) ||
      (item.genericname && item.genericname.toLowerCase().includes(searchTerm)) ||
      (item.drugClass && item.drugClass.toLowerCase().includes(searchTerm))
    );
  }
}

  showAddForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.isshowTable = false;
    this.medicationForm.reset();
    this.medicationForm.patchValue({ active: true });
  }

  isshowTable:boolean = true;
  userId!:any;

  editMedication(medication: any): void {
    this.showForm = true;
    this.isEditing = true;
    this.isshowTable = false;
    this.editingId = medication.id!;
    // this.medicationForm.patchValue(medication);
    this.medicationForm.patchValue({
      code: medication.code,
      description: medication.description,
      // active: medication.active
    })
    console.log("medication",medication);
    this.userId = medication.id;
    // console.log("this.userId = medication.id",this.);
    
  }

onSubmit(): void {
  if (this.medicationForm.valid) {
    const formData = this.medicationForm.value;

    if (this.isEditing && this.editingId) {
      const payload = {
        id: this.editingId,
        ...formData
      };

      this.dropdownService.updateDiagnosis(payload).subscribe({
        next: (res: any) => {
          if (res) {
            this._toastr.success(res.message || "Updated Successfully");
            this.loadMedications();
            this.cancelForm();
          } else {
            this._toastr.error(res.message || "Failed to update medication.");
          }
        },
        error: (error) => {
          console.error('Update error:', error);
          this._toastr.error(error?.error?.message || "Failed to update medication.");
        }
      });

    } else {
      this.dropdownService.createDiagnosis(formData).subscribe({
        next: (res: any) => {
          if (res) {
            this._toastr.success(res.message || "Added Successfully");
            this.loadMedications();
            this.cancelForm();
          } else {
            this._toastr.error(res.message || "Failed to add medication.");
          }
        },
        error: (error) => {
          console.error('Create error:', error);
          this._toastr.error(error?.error?.message || "Failed to add medication.");
        }
      });
    }
  }
}


  confirmDelete(id: number): void {
    this.deleteId = id;
    this.showDeleteConfirm = true;
  }

deleteMedication(): void {
  if (this.deleteId) {
    this.dropdownService.deleteDiagnosis(this.deleteId).subscribe({
      next: () => {
        this.loadMedications();
        this._toastr.success("Deleted Successfully");
        this.showDeleteConfirm = false;
        this.deleteId = null;
      },
      error: (error) => {
        console.error('Error deleting medication:', error);
        this._toastr.error("Failed to delete medication. Please try again.");
        this.showDeleteConfirm = false;
        this.deleteId = null;
      }
    });
  }
}


  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.isshowTable = true;
    this.medicationForm.reset();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteId = null;
  }


  //ag-grid

 gridColumnApi!: Column;
 gridApi!: GridApi;
    // gridColumnApi!: Column; paginationPageSize = 10;
    // paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];
    searchValue: string = '';

  columnDefs:any = [
  {
   headerName: 'S. No.',
    valueGetter: 'node.rowIndex + 1',
    width: 90,
    pinned: 'left',
    cellClass: 'font-medium text-gray-700',
    headerClass: 'font-bold text-gray-800',
  },
  {
    headerName: 'Code',
    field: 'code',
    flex: 1,
    cellRenderer: (params: any) => {
      const medicationName = params.value;

      // Sample image logic (replace with your actual image or CDN)
      const imageSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(medicationName)}&background=random&rounded=true`;

      return `
        <div class="flex items-center gap-2">
          <img src="${imageSrc}" alt="${medicationName}" class="w-8 h-8 rounded-full border" />
          <span>${medicationName}</span>
        </div>
      `;
    }
  },
  {
    headerName: 'Description',
    field: 'description',
    flex: 1.5,
    cellClass: 'font-medium'
  },
  
  {
    headerName: 'Status',
    field: 'active',
     flex: 1,
    cellRenderer: (params: any) => {
      const isActive = params.value;
      const classes = isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';

      return `
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes}">
          ${isActive ? 'Active' : 'Inactive'}
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
          <button class="text-primary-600 hover:text-primary-900 text-sm" data-action="edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-red-600 hover:text-red-900 text-sm" data-action="delete">
            <i class="fas fa-trash"></i>
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
    const id = event.data.id;
    const clickedEl = event.eventPath?.[0] || event.target;
    if (!id || !clickedEl) return;
    const classList = clickedEl.classList;
    if (classList.contains('fa-edit')) {
      this.editMedication(event.data);
    } else if (classList.contains('fa-trash')) {
      this.confirmDelete(id);
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




     currentPage = 1;
    paginationPageSize = 20; // Can be changed dynamically from dropdown
    totalPages = 1;
    pageStart = 0;
    pageEnd = 0;
    totalCount = 0;
    paginationPageSizeSelector = [20, 50, 100];
    
    onPageSizeChange() {
      this.currentPage = 1; // Reset to first page on size change
      this.loadMedications();
    }
    onPaginationChanged(params: PaginationChangedEvent) {
      const page = params.api.paginationGetCurrentPage(); // 0-based index
      const pageSize = params.api.paginationGetPageSize();
    
      this.currentPage = page + 1;
      this.paginationPageSize = pageSize;
    
      this.loadMedications();
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
    goToPreviousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadMedications();
      }
    }
    
    goToNextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadMedications();
      }
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
            this._superadminService.UploadFileDiagnoses(file).subscribe({
              next: (res) => {
                this.loadMedications();
                this.isUploading = false;
                this._loader.hide();
                this._toastr.success('File uploaded successfully!');
                this.closeFileUploadPopup();        
                // this.loadMedications();
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
        
          public _loader = inject(PopupService);
          private sampleFile: string = 'https://careslot-dev.s3.amazonaws.com/Diagnosis/diagnosis_sample1.csv?AWSAccessKeyId=AKIAXJSU3GUHIVYCBLG7&Expires=2079705820&Signature=SYa0atS4j%2FdzoE8t6LA1zeXfeG0%3D';
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
