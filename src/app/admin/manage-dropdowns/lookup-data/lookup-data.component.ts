import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DropdownDataService } from '../../../service/dropdown/dropdown-data-service';
import { LookupData } from '../../../models/dropdown-data-model';
import { ColDef, Column, GridApi, PaginationChangedEvent } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-lookup-data',
  templateUrl: './lookup-data.component.html',
  styleUrls: ['./lookup-data.component.scss'],
  standalone: false
})
export class LookupDataComponent implements OnInit {
  lookupData: LookupData[] = [];
  lookupForm: FormGroup;
  isEditing = false;
  editingId: number | null = null;
  showForm = false;
  showDeleteConfirm = false;
  deleteId: number | null = null;
    public dropdownService = inject(DropdownDataService);
    public _toastr = inject(ToastrService);
    
isshowTable:boolean = true;
  categories = ['Allergy', 'ChronicCondition', 'SmokingStatus', 'BloodType', 'Gender', 'MaritalStatus'];

  constructor(
    private fb: FormBuilder,
  ) {
    this.lookupForm = this.fb.group({
      category: ['', [Validators.required, Validators.maxLength(100)]],
      value: ['', [Validators.required, Validators.maxLength(255)]],
      parentId: [''],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadLookupData();
    this.getParentDropdown()
  }


  
loadLookupData(): void {
  this.dropdownService.getLookupData(this.currentPage, this.paginationPageSize).subscribe((countries: any) => {
    this.rowData = countries.data || [];
    this.totalCount = countries.totalCount || 0;

    this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.paginationPageSize));
    this.pageStart = this.totalCount > 0 ? (this.currentPage * this.paginationPageSize) + 1 : 0;
    this.pageEnd = this.totalCount > 0 ? Math.min((this.currentPage + 1) * this.paginationPageSize, this.totalCount) : 0;

    console.log(`Showing ${this.pageStart} to ${this.pageEnd} of ${this.totalCount}`);
    console.log(`Page ${this.currentPage + 1} of ${this.totalPages}`);
  });
}

  showAddForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingId = null;
    this.isshowTable = false;
    this.lookupForm.reset();
    this.lookupForm.patchValue({ active: true });
  }

  editLookup(lookup: LookupData): void {
    this.showForm = true;
    this.isEditing = true;
    this.isshowTable = false;
    console.log("lookup",lookup);
    
    this.editingId = lookup.id!;
    this.lookupForm.patchValue({
      category: lookup.category,
      value: lookup.value,
      parentId: lookup.parentName,
      active:lookup.active
    });
  }

  onSubmit(): void {
    if (this.lookupForm.valid) {
      const formData = { ...this.lookupForm.value };
      if (formData.parentId === '') {
        formData.parentId = null;
      }
      
      if (this.isEditing && this.editingId) {
         const payload = {
        id: this.editingId,
        ...formData
      };
        this.dropdownService.updateLookup(payload).subscribe(() => {
          this._toastr.success("Updated successfully");
          this.loadLookupData();
          this.cancelForm();
        });
      } else {
        this.dropdownService.createLookup(formData).subscribe(() => {
          this._toastr.success("Added successfully");
          this.loadLookupData();
          this.cancelForm();
        });
      }
    }
  }

  confirmDelete(id: number): void {
    this.deleteId = id;
    this.showDeleteConfirm = true;
  }

  deleteLookup(): void {
    if (this.deleteId) {
      this.dropdownService.deleteLookup(this.deleteId).subscribe(() => {
        this.loadLookupData();
        this.showDeleteConfirm = false;
        this.deleteId = null;
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;
    this.isshowTable = true
    this.lookupForm.reset();
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteId = null;
  }

  getGroupedData(): { [key: string]: LookupData[] } {
    return this.lookupData.reduce((groups, item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
      return groups;
    }, {} as { [key: string]: LookupData[] });
  }

  // getUniqueCategories(): string[] {
  //   return [...new Set(this.lookupData.map(item => item.category))];
  // }

columnDefs: ColDef[] = [
  {
    headerName: 'S. No.',
    valueGetter: 'node.rowIndex + 1',
    width: 90,
    cellClass: 'font-medium text-gray-700'
  },
  {
    headerName: 'Value',
    field: 'value',
    flex: 1
  },
  {
    headerName: 'Parent Name',
    field: 'parentName',
    flex: 1,
    valueGetter: (params) => params.data.parentName || '-'
  },
  {
    headerName: 'Status',
    field: 'active',
    flex: 1,
    cellRenderer: (params: any) => {
      const isActive = params.value;
      return `
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }">
          ${isActive ? 'Active' : 'Inactive'}
        </span>
      `;
    }
  },
  {
    headerName: 'Actions',
    field: 'actions',
    width: 150,
    cellRenderer: (params: any) => {
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
    }
  }
];


 defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
  };
      gridApi!: GridApi;
  gridColumnApi!: Column;
  
  rowData:any[] = [];
  gridOptions:any = {
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    onGridReady: (params: any) => {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
    },
  };


   currentPage = 1;
paginationPageSize = 20;
totalPages = 1;
pageStart = 0;
pageEnd = 0;
totalCount = 0;
paginationPageSizeSelector = [20, 50, 100];
  
onCellClicked(event: any): void {
  if (event.colDef.field !== 'actions') return;

  const clickedEl = event.event?.target as HTMLElement;
  const id = event.data?.id;

  if (!clickedEl || !id) return;

  const classList = clickedEl.classList;

  if (classList.contains('fa-edit')) {
    this.editLookup(event.data);
  } else if (classList.contains('fa-trash')) {
   this.confirmDelete(id)
  }
}


onPageSizeChange() {
  this.currentPage = 1; // Reset to first page on size change
  this.loadLookupData();
}
onPaginationChanged(params: PaginationChangedEvent) {
  const page = params.api.paginationGetCurrentPage(); // 0-based index
  const pageSize = params.api.paginationGetPageSize();

  this.currentPage = page + 1;
  this.paginationPageSize = pageSize;

  this.loadLookupData();
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
    this.loadLookupData();
  }
}

goToNextPage() {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.loadLookupData();
  }
}


paratentlist:any[]=[]
getParentDropdown(){
  this.dropdownService.getParentLookupData().subscribe((res:any)=>{
    console.log("res",res);
    this.paratentlist = res
  })
}
}