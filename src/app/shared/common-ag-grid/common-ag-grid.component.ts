import { Component, EventEmitter, inject, Input, input, Output } from '@angular/core';
import { Column, GridApi, GridOptions } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { AdminService } from '../../service/admin/admin.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-common-ag-grid',
  standalone: false,
  templateUrl: './common-ag-grid.component.html',
  styleUrl: './common-ag-grid.component.scss'
})
export class CommonAgGridComponent {

  @Input() rowData: any[] = [];
  @Input() columnDefs: any[] = [];
  @Input() defaultColDef: any = { sortable: true, filter: true, resizable: true };
  @Input() paginationPageSize: number = 10;
  @Input() paginationPageSizeSelector: number[] = [10, 20, 50, 100];

  @Input() tableHeight: string = '500px';
  @Input() IsshowPagination:boolean = true;

   @Input() gridtable:boolean = true;
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() gridReadyCallback = new EventEmitter<GridApi>();
  // public selectedTab: 'ListUser' | 'AddUser' ='ListUser';
  @Output() selectedTab = new EventEmitter<any>();

  gridApi!: any;
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageStart = 1;
  pageEnd = 1;

    gridOptions: GridOptions = {
        rowSelection: 'multiple', 
        suppressRowClickSelection: true,
      };

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridReadyCallback.emit(this.gridApi);
    this.updatePaginationInfo();
  }

  onCellClicked(event: any) {
    debugger
    if (event.colDef.field !== 'actions') return;

    const id = event.data.id;
    const clickedEl = event.eventPath?.[0] || event.target;
    if (!id || !clickedEl) return;

    const classList = clickedEl.classList;
    if (classList.contains('fa-edit')) {
      this.edit.emit(id);
      this.selectedTab.emit('AddUser');
      // console.log("this.edit.emit(id)",this.edit.emit(id));
      // console.log("this.edit.emit(id)",this.edit.emit(id));
      // console.log("this.edit.emit(id)",this.edit.emit(id));
      // console.log("this.edit.emit(id)",this.edit.emit(id));
    } else if (classList.contains('fa-trash')) {
      this.delete.emit(id);
    }
  }

  onPageSizeChanged(size: number) {
    this.paginationPageSize = +size;
    this.gridApi.paginationSetPageSize(this.paginationPageSize);
    this.updatePaginationInfo();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.gridApi.paginationGoToPreviousPage();
      this.updatePaginationInfo();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.gridApi.paginationGoToNextPage();
      this.updatePaginationInfo();
    }
  }

  updatePaginationInfo() {
    if (!this.gridApi) return;

    const currentPage = this.gridApi.paginationGetCurrentPage();
    const pageSize = this.gridApi.paginationGetPageSize();
    const totalPages = this.gridApi.paginationGetTotalPages();
    const totalRows = this.gridApi.paginationGetRowCount();

    this.currentPage = currentPage + 1;
    this.totalPages = totalPages;
    this.totalCount = totalRows;

    const startRow = currentPage * pageSize + 1;
    const endRow = Math.min(startRow + pageSize - 1, totalRows);
    this.pageStart = startRow;
    this.pageEnd = endRow;
  }

}
