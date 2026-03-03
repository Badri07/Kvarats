import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ColDef, Column, GridApi } from 'ag-grid-community';
import { AdminService } from '../../service/admin/admin.service';
import { Billing } from '../../models/useradmin-model';
import { TosterService } from '../../service/toaster/tostr.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { AuthService } from '../../service/auth/auth.service';

@Component({
  selector: 'app-slidingscale',
  standalone: false,
  templateUrl: './slidingscale.component.html',
  styleUrl: './slidingscale.component.scss'
})
export class SlidingscaleComponent {

  slidingForm!: FormGroup;
  slidingScales: any[] = [];
  selectedRow: any = null;
  slidingScaleList:[] = [];

  public selectedTab: 'slidingScaleAdd' | 'slidingScaleList' = 'slidingScaleAdd';

  gridApi!: GridApi;
  gridColumnApi!: Column;
  paginationPageSize = 10;
  paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];
  searchValue: string = '';

  sliddingSubmitted: boolean = false;

  // Delete modal properties
  showDeleteModal: boolean = false;
  scaleToDelete: any = null;
  isDeleting: boolean = false;

  stats = {
    activeScales: 5,
    avgDiscount: 45,
    patientsUsing: 32,
    monthlySavings: 1240
  };

  columnDefs: ColDef[] = [
    
    { field: 'minIncome', headerName: 'Min Income', flex: 1 },
    { field: 'maxIncome', headerName: 'Max Income', flex: 1 },
    { field: 'discountPercentage', headerName: 'Discount %', flex: 1 },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      pinned: 'right',
      cellRenderer: (params: any) => {
        return `
          <div class="flex gap-2">
            <button class="text-primary-border-color hover:underline" data-action="edit">
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

  public fb = inject(FormBuilder);
  public _adminservice = inject(AdminService);
  public _authService = inject(AuthService);
  public _toastr = inject(TosterService);
  public breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Slidingscale', url: 'slidingscale' },
    ]);

    this.slidingForm = this.fb.group({
      minIncome: ['', [Validators.required, Validators.min(0)]],
      maxIncome: ['', [Validators.required, Validators.max(1000000)]],
      discountPercentage: ['', [Validators.required, Validators.max(100)]]
    });

    this.getSlidingScale();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.setTab(this.selectedTab);
    });
  }

  onSubmit() {
    if (this.slidingForm.invalid) {
      this.sliddingSubmitted = true;
      return;
    }

    const formData = this.slidingForm.value;
    if (this.selectedRow) {
      const updatedData = {
        ...formData,
        id: this.selectedRow 
      };

      this._adminservice.UpdateSlidingScale(updatedData).subscribe({
        next: (res) => {
          this._toastr.success("Sliding scale updated successfully");
          this.slidingForm.reset();
          this.sliddingSubmitted = false;
          this.selectedRow = null;
          this.getSlidingScale();
          this.setTab("slidingScaleList");
        },
        error: (err) => {
          this._toastr.error(`Failed to update sliding scale: ${err}`);
        }
      });
    } else {
      this._adminservice.AddSlidingScale(formData).subscribe({
        next: (res: Billing) => {
          if (res) {
            this._toastr.success("Sliding scale saved successfully");
            this.slidingForm.reset();
            this.sliddingSubmitted = false;
            this.getSlidingScale();
            this.setTab("slidingScaleList");
          }
        },
        error: (err) => {
          this._toastr.error(`Failed to save sliding scale: ${err}`);
        }
      });
    }
  }

  edit(event: any) {
    this.selectedRow = event.data;
    this.slidingForm.patchValue(this.selectedRow);
  }

  loadSlidingScales() {
    this.slidingScales = [
      { minIncome: 1000, maxIncome: 3000, discountPercentage: 10 },
      { minIncome: 3001, maxIncome: 5000, discountPercentage: 5 }
    ];
  }

  onGridReady(params: any) {
    params.api.sizeColumnsToFit();
  }

  get sliddingUser(): { [key: string]: AbstractControl } {
    return this.slidingForm.controls;
  }

  rowData: any[] = [];

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  gridOptions: any = {
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    onGridReady: (params: any) => {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
    },
  };

  getSlidingScale() {
    const clientId: any = this._authService.getClientId();

    this._adminservice.getSlidingScale(clientId).subscribe(res => {
      this.slidingScaleList = res.data || [];

      this.rowData = this.slidingScaleList.map((item: any) => ({
        ...item
      }));
    });
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
    FileSaver.saveAs(blob, 'SlidingList.xlsx');
  }

  setTab(tab: 'slidingScaleAdd' | 'slidingScaleList') {
    this.selectedTab = tab;

    const slider = document.querySelector('.slider') as HTMLElement;
    const tabElements = document.querySelectorAll('.tab');

    const tabIndex = { 'slidingScaleList': 1, 'slidingScaleAdd': 0 }[tab];

    if (slider && tabElements[tabIndex]) {
      const tabEl = tabElements[tabIndex] as HTMLElement;
      slider.style.left = `${tabEl.offsetLeft}px`;
      slider.style.width = `${tabEl.offsetWidth}px`;
    }
  }

  onCellClicked(event: any): void {
    if (event.colDef.field !== 'actions') return;
    
    const clickedEl = event.eventPath?.[0] || event.target;
    if (!clickedEl) return;
    
    const classList = clickedEl.classList;
    const data = event.data;
    
    if (classList.contains('fa-edit')) {
      this.setTab('slidingScaleAdd');
      this.editUser(data.id);
    } else if (classList.contains('fa-trash')) {
      this.openDeleteModal(data);
    }
  }

  editUser(id: string) {
    this._adminservice.getSlidingScaleById(id).subscribe((res) => {
      this.slidingForm.patchValue({
        minIncome: res.minIncome,
        maxIncome: res.maxIncome,
        discountPercentage: res.discountPercentage
      });
      this.selectedTab = "slidingScaleAdd";
      this.selectedRow = id;
    });
  }

  openDeleteModal(scale: any) {
    this.scaleToDelete = scale;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.scaleToDelete = null;
    this.isDeleting = false;
  }

  confirmDelete() {
    if (!this.scaleToDelete?.id) {
      this._toastr.error('Invalid sliding scale selected');
      return;
    }

    this.isDeleting = true;
    
    this._adminservice.deleteSlidingScale(this.scaleToDelete.id).subscribe(
      (res: any) => {
        this._toastr.success('Sliding Scale deleted successfully.');
        this.getSlidingScale();
        this.closeDeleteModal();
        this.isDeleting = false;
      },
      (err) => {
        this._toastr.error(
          err.status === 401 ? 'Unauthorized' : 'Error deleting sliding scale'
        );
        this.isDeleting = false;
      }
    );
  }

  onDelete(id: string) {
    const scale = this.slidingScaleList.find((item: any) => item.id === id);
    if (scale) {
      this.openDeleteModal(scale);
    }
  }
}