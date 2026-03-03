import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-common-pagination',
  standalone: false,
  templateUrl: './common-pagination.component.html',
  styleUrl: './common-pagination.component.scss'
})
export class CommonPaginationComponent {
  @Input() currentPage: number = 1;
  @Input() paginationPageSize: number = 20;
  @Input() totalPages: number = 1;
  @Input() totalCount: number = 0;
  @Input() pageStart: number = 0;
  @Input() pageEnd: number = 0;
  @Input() paginationPageSizeSelector: number[] = [20, 50, 100];
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();

  onPageSizeChange(newSize: number) {
    this.pageSizeChange.emit(newSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  goToPrevious() {
    if (this.currentPage > 1) {
      this.previousPage.emit();
    }
  }

  goToNext() {
    if (this.currentPage < this.totalPages) {
      this.nextPage.emit();
    }
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage = Math.max(2, this.currentPage - 1);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);
      if (this.currentPage <= 3) {
        endPage = 4;
      }
      if (this.currentPage >= this.totalPages - 2) {
        startPage = this.totalPages - 3;
      }
      if (startPage > 2) {
        pages.push(-1);
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < this.totalPages - 1) {
        pages.push(-2);
      }
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }
}
