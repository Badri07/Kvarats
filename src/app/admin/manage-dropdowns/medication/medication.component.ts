import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DropdownDataService } from '../../../service/dropdown/dropdown-data-service';
import { Medication } from '../../../models/dropdown-data-model';
import { Column, GridApi, PaginationChangedEvent } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-medication',
  templateUrl: './medication.component.html',
  styleUrls: ['./medication.component.scss'],
  standalone: false
})
export class MedicationComponent implements OnInit {
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
      name: ['', [Validators.required, Validators.maxLength(255)]],
      genericname: ['', [Validators.required]],
      drugClass: ['', [Validators.required]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadMedications();
  }

  loadMedications(): void {
    this.dropdownService.getMedications().subscribe((medications:any) => {
      // this.medications = medications.data;
      this.rowData = medications.data
      console.log();
    });
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

  editMedication(medication: Medication): void {
    this.showForm = true;
    this.isEditing = true;
    this.isshowTable = false;
    this.editingId = medication.id!;
    // this.medicationForm.patchValue(medication);
    this.medicationForm.patchValue({
       name: medication.name,
      genericname: medication.genericName,
      drugClass:medication.drugClass,
      active: medication.active
    })
    console.log("medication",medication);
    this.userId = medication.id;
    // console.log("this.userId = medication.id",this.);
    
  }

  onSubmit(): void {
  debugger;
  if (this.medicationForm.valid) {
    const formData = this.medicationForm.value;

    if (this.isEditing && this.editingId) {
      const payload = {
        id: this.editingId,
        ...formData
      };

      this.dropdownService.updateMedication(payload).subscribe(() => {
        this._toastr.success("Updated Successfully");
        this.loadMedications();
        this.cancelForm();
      }, error => {
        console.error('Update error:', error);
        this._toastr.error("Failed to update medication.");
      });

    } else {
      this.dropdownService.createMedication(formData).subscribe(() => {
        this._toastr.success("Added Successfully");
        this.loadMedications();
        this.cancelForm();
      }, error => {
        console.error('Create error:', error);
        this._toastr.error("Failed to add medication.");
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
    this.dropdownService.deleteMedication(this.deleteId).subscribe({
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
    headerName: 'ID',
    field: 'id',
    flex: 0.5,
    cellClass: 'font-medium'
  },
  {
    headerName: 'Medication Name',
    field: 'name',
    flex: 1.5,
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
    headerName: 'Generic Name',
    field: 'genericName',
    flex: 0.5,
    cellClass: 'font-medium'
  },
  {
    headerName: 'Drug Class',
    field: 'drugClass',
    flex: 0.5,
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
    flex: 0.7,
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
    debugger
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
}