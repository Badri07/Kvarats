import { Component, inject } from '@angular/core';
import { AdminService } from '../../../service/admin/admin.service';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { SuperAdminService } from '../../../service/admin/superAdmin.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dropdown-values',
  standalone: false,
  templateUrl: './dropdown-values.component.html',
  styleUrl: './dropdown-values.component.scss'
})
export class DropdownValuesComponent {
  categories: any[] = [];
  values: any[] = [];
  filteredValues: any[] = [];
  selectedCategory = 'AlcoholFrequency';
  searchTerm = '';
  showActiveOnly = false;
  showModal = false;
  showDeleteModal = false;
  sortMode = false;
  editingValue: any | null = null;
  valueToDelete: any | null = null;
  isLoading = false;
  originalSortOrder: any[] = [];

  // New properties for parent-child functionality
  isCreatingChild = false;
  selectedParent: any | null = null;

  formData: any = {
    code: '',
    sortOrder: '',
    description: '',
    category: '',
    parentValueId: null
  };

  constructor(private _adminservice: AdminService) {}
  public breadcrumbService = inject(BreadcrumbService);
  public _superadminService = inject(SuperAdminService);
  public route = inject(ActivatedRoute);
  public _toastr = inject(TosterService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['selectedCategory'] || 'AlcoholFrequency';
      this.loadCategories();
      this.loadValues(this.selectedCategory);

      // Auto-open accordions for parent items with children
      this.filteredValues.forEach(value => {
        if (value.children && value.children.length > 0) {
          this.openAccordions.add(value.id);
        }
      });
    });

    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dropdown Management', url: 'settings/dropdowns' },
      { label: 'Dropdown Values', url: 'settings/dropdownsValues' },
    ]);
  }

  loadCategories(): void {
    this._adminservice.getAllCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
        console.log("Categories loaded:", response);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadValues(category: string): void {
    this.isLoading = true;
    this._adminservice.getValuesByCategories(category).subscribe({
      next: (response) => {
        this.values = response.data;
        this.filterValues();
        this.isLoading = false;
        console.log("Values loaded for category:", category, response.data);
      },
      error: (error) => {
        console.error('Error loading values:', error);
        this.isLoading = false;
      }
    });
  }

  onCategoryChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const categoryName = selectElement.value;
    this.selectedCategory = categoryName;
    this.loadValues(categoryName);
    this.formData.category = this.selectedCategory;
    this._superadminService.setCategoryName(categoryName);
  }

  filterValues(): void {
    let filtered = [...this.values];

    if (this.searchTerm) {
      const lowerSearch = this.searchTerm.toLowerCase();

      filtered = filtered.filter(value =>
        (value.description?.toLowerCase().includes(lowerSearch) ?? false) ||
        (value.code?.toLowerCase().includes(lowerSearch) ?? false)
      );
    }

    if (this.showActiveOnly) {
      filtered = filtered.filter(value => value.active);
    }

    this.filteredValues = filtered;
  }

  toggleSortMode(): void {
    if (this.sortMode) {
      this.cancelSort();
    } else {
      this.sortMode = true;
      this.originalSortOrder = [...this.filteredValues];
    }
  }

  cancelSort(): void {
    this.sortMode = false;
    this.filteredValues = [...this.originalSortOrder];
    this.originalSortOrder = [];
  }

  saveSort(): void {
    // Implementation for saving sort order
    // const valueIds = this.filteredValues.map(v => v.id);
    // this.isLoading = true;
    // Your save sort logic here
  }

  // Open modal for creating a new parent value
  openCreateModal(): void {
    this.editingValue = null;
    this.isCreatingChild = false;
    this.selectedParent = null;
    this.formData = {
      code: '',
      sortOrder: '',
      description: '',
      category: this.selectedCategory,
      active: true,
      parentValueId: null
    };
    this.showModal = true;
  }

  // Open modal for creating a child value
  openCreateChildModal(parent: any): void {
    this.isCreatingChild = true;
    this.selectedParent = parent;
    this.editingValue = null;
    this.formData = {
      code: '',
      sortOrder: '',
      description: '',
      category: this.selectedCategory,
      active: true,
      parentValueId: parent.id
    };

    // Auto-generate a suggested sort order for the child
    if (parent.children && parent.children.length > 0) {
      const maxSortOrder = Math.max(...parent.children.map((child: any) => child.sortOrder));
      this.formData.sortOrder = maxSortOrder + 1;
    } else {
      this.formData.sortOrder = 1;
    }

    this.showModal = true;
  }

  openEditModal(value: any): void {
    this.editingValue = value;
    this.isCreatingChild = false;
    this.selectedParent = null;
    console.log("Editing value:", this.editingValue);

    this.formData = {
      sortOrder: value.sortOrder,
      code: value.code,
      description: value.description || '',
      category: value.category,
      active: value.active,
      parentValueId: value.parentValueId || null
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingValue = null;
    this.isCreatingChild = false;
    this.selectedParent = null;
  }

  submitForm(): void {
    if (!this.formData.code || !this.formData.sortOrder || !this.formData.description || !this.formData.category) {
      return;
    }

    // Prepare the form data according to your API structure
    const submitData = {
      ...this.formData,
      category: this.selectedCategory
    };

    this.isLoading = true;

    if (this.editingValue) {
      // Update existing value
      this._superadminService.updateDropdownValue(this.editingValue.id, submitData).subscribe({
        next: (response) => {
          this.loadValues(this.selectedCategory);
          this.loadCategories();
          this.closeModal();
          this.isLoading = false;
          if (response && response.message) {
            this._toastr.success(response.message);
          }
        },
        error: (error) => {
          this.handleError(error, 'updating');
        }
      });
    } else {
      // Create new value (either parent or child)
      this._superadminService.createDropdownValue(submitData).subscribe({
        next: (res) => {
          this.loadValues(this.selectedCategory);
          this.loadCategories();
          this.closeModal();
          this.isLoading = false;
          if (res && res.message) {
            this._toastr.success(res.message);
          }
        },
        error: (error) => {
          this.handleError(error, 'creating');
        }
      });
    }
  }

  private handleError(error: any, action: string): void {
    console.error(`Error ${action} value:`, error);
    const message = error?.error?.message || error?.message || `Failed to ${action} value`;
    this._toastr.error(message);
    this.isLoading = false;
  }

  confirmDelete(value: any): void {
    this.valueToDelete = value;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.valueToDelete = null;
  }

  deleteValue(id: any) {
    this.isLoading = true;
    this._superadminService.deleteDropdownValue(id).subscribe({
      next: (response) => {
        this.loadValues(this.selectedCategory);
        this.loadCategories();
        this.showDeleteModal = false;
        this.valueToDelete = null;
        this.isLoading = false;

        if (response && response.message) {
          this._toastr.success(response.message);
        } else {
          this._toastr.success('Value deleted successfully');
        }
      },
      error: (error) => {
        this.handleError(error, 'deleting');
      }
    });
  }

  openAccordions: Set<number> = new Set();

  toggleAccordion(id: number): void {
    if (this.openAccordions.has(id)) {
      this.openAccordions.delete(id);
    } else {
      this.openAccordions.add(id);
    }
  }

  // Check if accordion is open
  isAccordionOpen(id: number): boolean {
    return this.openAccordions.has(id);
  }

  // Helper method to check if a value is a parent (has no parentValueId)
  isParent(value: any): boolean {
    return !value.parentValueId;
  }

  // Helper method to get parent values (for filtering if needed)
  getParentValues(): any[] {
    return this.filteredValues.filter(value => this.isParent(value));
  }
}