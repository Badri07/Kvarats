import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, MinLengthValidator, Validators } from '@angular/forms';
import { ColDef, Column, GridApi } from 'ag-grid-community';
import { AdminService } from '../../service/admin/admin.service';
import { Billing } from '../../models/useradmin-model';
import { TosterService } from '../../service/toaster/tostr.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';

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
  slidingScaleList:[]=[];

      public selectedTab: 'slidingScaleAdd' | 'slidingScaleList' ='slidingScaleAdd';

  gridApi!: GridApi;
    gridColumnApi!: Column; paginationPageSize = 10;
    paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];
    searchValue: string = '';

  sliddingSubmitted:boolean= false;


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
    field: 'avatar',
    headerName: 'User',
    cellRenderer: (params: any) => {
      return `
        <div class="flex items-center gap-2">
          <img src="${params.value}" class="rounded-full w-8 h-8" />
        </div>
      `;
    },
    width: 100,
    sortable: false,
    filter: false
  },
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

  public fb = inject(FormBuilder);
  public _adminservice = inject(AdminService);
  public _toastr = inject(TosterService)
public breadcrumbService = inject(BreadcrumbService)


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
        this.selectedTab = "slidingScaleList"
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
          this.selectedTab = "slidingScaleList"
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



  rowData: any[] = [
  {
    avatar: 'https://i.pravatar.cc/150?img=1',
    minIncome: 10000,
    maxIncome: 19999,
    discountPercentage: 5,
  },
  {
    avatar: 'https://i.pravatar.cc/150?img=2',
    minIncome: 20000,
    maxIncome: 29999,
    discountPercentage: 10,
  },
  {
    avatar: 'https://i.pravatar.cc/150?img=3',
    minIncome: 30000,
    maxIncome: 39999,
    discountPercentage: 15,
  },
  {
    avatar: 'https://i.pravatar.cc/150?img=4',
    minIncome: 40000,
    maxIncome: 49999,
    discountPercentage: 20,
  },
  {
    avatar: 'https://i.pravatar.cc/150?img=5',
    minIncome: 50000,
    maxIncome: 59999,
    discountPercentage: 25,
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

// getSlidingScale(){
//   this._adminservice.getSlidingScale().subscribe((res=>{
//     console.log("slidingscale",res);    
//   }))
// }

getSlidingScale() {
      this._adminservice.getSlidingScale().subscribe(users => {
      this.slidingScaleList = users;
      this.rowData = this.slidingScaleList.map((user: any, index: number) => ({
        ...user,
        avatar: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${30 + index}.jpg`
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
  debugger
  console.log(event);
  
  if (event.colDef.field !== 'actions') return;
  const id = event.data.id;
  const clickedEl = event.eventPath?.[0] || event.target;
  if (!id || !clickedEl) return;
  const classList = clickedEl.classList;
  if (classList.contains('fa-edit')) {
    this.setTab('slidingScaleAdd');
    this.editUser(id);
  } else if (classList.contains('fa-trash')) {
    this.onDelete(id);
  }
}

editUser(id: string) {
  this._adminservice.getSlidingScaleById(id).subscribe((res) => {
    console.log("res", res);
    this.slidingForm.patchValue({
      minIncome: res.minIncome,
      maxIncome: res.maxIncome,
      discountPercentage: res.discountPercentage
    });
    this.selectedTab = "slidingScaleAdd"
    this.selectedRow = id;
  });
}



onDelete(id: string){
const confirmed = confirm('Are you sure you want to delete this?');
  if (!confirmed) return;

  this._adminservice.deleteSlidingScale(id).subscribe(
    (res: any) => {
      this._toastr.success('Slidding Scale deleted successfully.');
      this.getSlidingScale();
    },
    (err) => {
      this._toastr.error(
        err.status === 401 ? 'Unauthorized' : 'Error deleting user'
      );
    }
  );
}
}
