import { Component, inject, OnInit } from '@angular/core';
import { GridOptions, ColDef,Column, GridApi } from 'ag-grid-community';
import { TosterService } from '../../../service/toaster/tostr.service';
import { AdminService } from '../../../service/admin/admin.service';
import { MatDialog } from '@angular/material/dialog';
import { MenuModalComponent } from '../menu-modal/menu-modal.component';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';


@Component({
  selector: 'app-menu-list',
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss'],
  standalone:false
})
export class MenuListComponent {
  
  gridApi!: GridApi;
  gridColumnApi!: Column;
  paginationPageSize = 10;
  paginationPageSizeSelector: any = [10, 20, 50, 100];
  searchValue: string = '';
  rowDataMenu: any[] = [];
  columnDefsMenu: ColDef[] = [];
  defaultColDef: ColDef = { sortable: true, filter: true, resizable: true };
  gridOptionsMenu: GridOptions = {};

  
  IsshowPagination:boolean = true;
  gridtable:boolean = false;

    public breadcrumbService = inject(BreadcrumbService);

  
  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private toast:TosterService
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setVisible(true);
    this.breadcrumbService.setBreadcrumbs([
    { label: 'Menu-list', url: 'menu-management/menu-list' },
  ]);
    this.setupColumns();
    this.getMenus();
  }

  setupColumns(): void {
this.columnDefsMenu = [
  { headerName: 'Name', field: 'name' },
  { headerName: 'URL', field: 'url' },
  { headerName: 'Icon', field: 'icon' },
  { headerName: 'Parent Menu', field: 'parentMenuName' },
  {
    headerName: 'Status',
    field: 'isActive',
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
  }
];

  }

  getMenus(): void {
    this.adminService.getMenus().subscribe({
      next: (data) => this.rowDataMenu = data,
      error: (err) => console.error(err)
    });
  }

  onQuickFilterChanged(): void {
    debugger
        this.gridApi.setGridOption('quickFilterText', this.searchValue);
        console.log(" this.searchValue", this.searchValue);
        console.log("this.gridApi.setGridOption", this.gridApi.setGridOption);
        
    }
  
    onGridReady(params: any) {
  this.gridApi = params.api;
  this.gridColumnApi = params.columnApi;
}


    onExportClick() {
      const worksheet = XLSX.utils.json_to_sheet(this.rowDataMenu);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, 'userList.xlsx');
    }

  addMenu(): void {
    const dialogRef = this.dialog.open(MenuModalComponent, { width: '500px', data: null });
    dialogRef.afterClosed().subscribe((result) => { if (result) this.getMenus(); });
  }
}
