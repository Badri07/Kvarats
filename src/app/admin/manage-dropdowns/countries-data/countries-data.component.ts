import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DropdownDataService } from '../../../service/dropdown/dropdown-data-service';
import { CountriesData } from '../../../models/dropdown-data-model';
import { Column, GridApi, GridReadyEvent, PaginationChangedEvent } from 'ag-grid-community';
// import { DropdownDataService } from '../../../../services/dropdown-data.service';
// import { CountriesData } from '../../../../models/dropdown-data.models';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { ToastrService } from 'ngx-toastr';

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


  public _toastr = inject(ToastrService)

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
      zipCode: ['', [Validators.required, Validators.maxLength(20)]],
      active: [true]
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
goToPreviousPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.loadCountries();
  }
}

goToNextPage() {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.loadCountries();
  }
}



loadCountries(): void {
  this.dropdownService.getCountries(this.currentPage, this.paginationPageSize).subscribe((countries: any) => {
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
    debugger
    if (this.countryForm.valid) {
      const formData = this.countryForm.value;
       const payload = {
        id: this.editingId,
        ...formData
      };
      if (this.isEditing && this.editingId) {
        this.dropdownService.updateCountry(payload).subscribe(() => {
          this._toastr.success("Updated successfully");
          this.loadCountries();
          this.cancelForm();
        });
      } else {
        this.dropdownService.createCountry(formData).subscribe(() => {
         this._toastr.success("Added successfully");
          this.loadCountries();
          this.cancelForm();
        });
      }
    }
  }

  confirmDelete(id: number): void {
    this.deleteId = id;
    this.showDeleteConfirm = true;
  }

  deleteCountry(): void {
    if (this.deleteId) {
      this.dropdownService.deleteCountry(this.deleteId).subscribe(() => {
        this._toastr.success("deleted successfully");
        this.loadCountries();
        this.showDeleteConfirm = false;
        this.deleteId = null;
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


    
}