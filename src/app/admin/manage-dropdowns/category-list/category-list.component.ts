import { Component, inject } from '@angular/core';
import { AdminService } from '../../../service/admin/admin.service';
import { SuperAdminService } from '../../../service/admin/superAdmin.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss'
})
export class CategoryListComponent {
 categories: any[] = [];
  filteredCategories: any[] = [];
  searchTerm = '';
  showModal = false;
  showDeleteModal = false;
  editingCategory: any | null = null;
  categoryToDelete: any | null = null;
  // isLoading = false;

  formData: any = {
    name: ''
  };

  constructor(private _adminservice: AdminService) {}

  public _superadminService = inject(SuperAdminService);
  public _toastr = inject(TosterService);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this._adminservice.getAllCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
         this.filteredCategories = [...response.data];
        // this.totalCategories = this.categories.length;
        // // this.totalValues = this.categories.reduce((sum, cat) => sum + cat.valueCount, 0);
        // this.averagePerCategory = this.totalCategories > 0 ? Math.round(this.totalValues / this.totalCategories) : 0;
        
        // // For active values, we'd need to load all values - for demo, we'll estimate 80%
        // this.activeValues = Math.round(this.totalValues * 0.8);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }


  
  filterCategories(): void {
  const term = this.searchTerm.toLowerCase().trim();

  if (!term) {
    this.filteredCategories = [...this.categories];
    return;
  }

  this.filteredCategories = this.categories.filter(cat =>
    cat.category?.toLowerCase().includes(term) ||
    cat.description?.toLowerCase().includes(term)
  );
}

  openCreateModal(): void {
    this.editingCategory = null;
    this.formData = { name: '' };
    this.showModal = true;
  }

  openEditModal(category: any): void {
    debugger
    this.editingCategory = category;
    this.formData = {
      name: category.category,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategory = null;
    this.formData = { name: '' };
  }

submitForm(): void {
  debugger
  if(!this.formData.name || this.formData.name ===''){
    return
  }
  const updateRequest: any = {
    categoryName: this.formData.name.trim(),
  };

  if (this.editingCategory) {
    const categoryId = this.editingCategory.id || this.editingCategory.category;
    this._superadminService.updateCategory(categoryId, updateRequest).subscribe({
      next: (res: any) => {
        this.showModal = false;
        this._toastr.success(res?.message || 'Category updated successfully.');
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Error updating category:', error);
        this._toastr.error(error?.message || 'Failed to update category.');
      }
    });
  } else {
    this._superadminService.savecategories(updateRequest).subscribe({
      next: (res: any) => {
        this.showModal = false;
        this._toastr.success(res?.message || 'Category created successfully.');
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this._toastr.error(error?.message || 'Failed to create category.');
      }
    });
  }
}

  
  confirmDelete(category: any): void {
    debugger
    this.categoryToDelete = category.category;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.categoryToDelete = null;
  }

deleteCategory(): void {
  if (!this.categoryToDelete) return;

  this._superadminService.DeleteCategory(this.categoryToDelete).subscribe({
    next: (res: any) => {
      if (res) {
        this.showDeleteModal = false;
        this._toastr.success(res.message || 'Category deleted successfully.');
        this.loadDashboardData();
      }
    },
    error: (error) => {
      console.error('Error deleting category:', error);
      this._toastr.error(error?.message || 'Failed to delete category.');
      this.loadDashboardData();
    }
  });

    // this.isLoading = true;

    // this.mockDataService.deleteCategory(this.categoryToDelete.name).subscribe({
    //   next: () => {
    //     this.loadCategories();
    //     this.cancelDelete();
    //     this.isLoading = false;
    //   },
    //   error: (error) => {
    //     console.error('Error deleting category:', error);
    //     alert(error.message || 'Failed to delete category');
    //     this.isLoading = false;
    //   }
    // });
  }

  public router = inject(Router);
  viewCategoryValues(categoryName: any): void {
    console.log('Navigating to values for category:', categoryName);
    this.router.navigate(['/settings/dropdowns/dropdownsValues'], {
    queryParams: { selectedCategory: categoryName.category }
  });
}
}
