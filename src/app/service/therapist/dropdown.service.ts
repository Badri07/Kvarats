import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError, map, catchError } from 'rxjs';
import { 
  DropdownCategory, 
  DropdownItem, 
  DropdownSearch, 
  DropdownCategoryType,
  DropdownStats 
} from '../../models/dropdown-therapist-model';
import { environment } from '../../../environments/environments';
import { HttpClient, HttpParams } from '@angular/common/http';


export interface PlanService {
  id: string;
  name: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class DropdownService {
  
    public _http = inject(HttpClient)
  private categories = signal<DropdownCategory[]>([
    {
      id: 'cat-1',
      name: 'Appointment Types',
      description: 'Types of appointments available for scheduling',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'cat-2',
      name: 'Insurance Providers',
      description: 'List of insurance companies and providers',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'cat-3',
      name: 'Specializations',
      description: 'Therapist specializations and areas of expertise',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'cat-4',
      name: 'CPT Codes',
      description: 'Current Procedural Terminology codes for billing',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'cat-5',
      name: 'ICD-10 Codes',
      description: 'International Classification of Diseases codes',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  private items = signal<DropdownItem[]>([]);


  // Category CRUD
  getCategories(): Observable<DropdownCategory[]> {
    return of(this.categories()).pipe(delay(300));
  }

  getCategoryById(id: string): Observable<DropdownCategory | undefined> {
    return of(this.categories().find(cat => cat.id === id)).pipe(delay(300));
  }

  createCategory(category: Omit<DropdownCategory, 'id' | 'createdAt' | 'updatedAt'>): Observable<DropdownCategory> {
    const newCategory: DropdownCategory = {
      ...category,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.categories.update(categories => [...categories, newCategory]);
    return of(newCategory).pipe(delay(500));
  }

  updateCategory(id: string, updates: Partial<DropdownCategory>): Observable<DropdownCategory> {
    const currentCategories = this.categories();
    const index = currentCategories.findIndex(cat => cat.id === id);
    
    if (index === -1) {
      return throwError(() => new Error('Category not found'));
    }

    const updatedCategory = {
      ...currentCategories[index],
      ...updates,
      updatedAt: new Date()
    };

    this.categories.update(categories => {
      const newCategories = [...categories];
      newCategories[index] = updatedCategory;
      return newCategories;
    });

    return of(updatedCategory).pipe(delay(500));
  }

  deleteCategory(id: string): Observable<boolean> {
    // Check if category has items
    const hasItems = this.items().some(item => item.categoryId === id);
    if (hasItems) {
      return throwError(() => new Error('Cannot delete category with existing items'));
    }

    this.categories.update(categories => categories.filter(cat => cat.id !== id));
    return of(true).pipe(delay(500));
  }

// Service - getItems()
getClientItems(clientId: string): Observable<DropdownItem[]> {
  const params = new HttpParams().set('clientId', clientId);
  
  return this._http.get(`${environment.apidev}/Services/GetClientServices`, { params }).pipe(
    map((response: any) => {
      const apiItems = response?.data || response || [];
      
      return apiItems.map((item: any) => ({
        id: item.id,
        categoryId: item.categoryId || '',
        value: item.id,
        label: item.name,
        category: item.category,
        serviceId:item.serviceId,
        description: item.description,
        price: item.defaultRate,
        isActive: item.active,
        isSynced: item.isSynced,
        sortOrder: item.sortOrder || 0,
        metadata: {
          duration: item.defaultDurationMinutes,
          code: item.code 
        },
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt)
      }));
    }),
    catchError(error => {
      console.error('Error fetching client services:', error);
      return throwError(() => error);
    })
  );
}

getItems(): Observable<DropdownItem[]> {
  return this._http.get(`${environment.apidev}/Services`).pipe(
    map((response: any) => {
      const apiItems = response?.data || response || [];
      
      return apiItems.map((item: any) => ({
        id: item.id,
        categoryId: item.categoryId || '',
        value: item.id,
        label: item.name,
        category:item.category,
        description: item.description,
        price: item.defaultRate, // ✅ This is now properly mapped
        isActive: item.active,
        isSynced:item.isSynced,
        sortOrder: item.sortOrder || 0,
        metadata: {
          duration: item.defaultDurationMinutes,
          code: item.code 
        },
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt)
      }));
    }),
    catchError(error => {
      console.error('Error fetching services:', error);
      return throwError(() => error);
    })
  );
}


  getItemsByCategory(categoryId: string): Observable<DropdownItem[]> {
  return this._http.get(`${environment.apidev}/PlansandPackages/GetService`).pipe(
    map((response: any) => {
      const apiItems = response?.data || response || [];
      
      return apiItems.map((item: any) => ({
        id: item.id,
        categoryId: item.categoryId || '',
        value: item.id,
        label: item.label,
        description: item.description,
        price: item.price, 
        isActive: item.isActive,
        isSynced:item.isSynced,
        sortOrder: item.sortOrder || 0,
        metadata: {
          duration: item.duration,
          cptCode: item.cptCode
        },
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt)
      }));
    }),
    catchError(error => {
      console.error('Error fetching services:', error);
      return throwError(() => error);
    })
  );
}

  getItemById(id: string): Observable<DropdownItem | undefined> {
    return of(this.items().find(item => item.id === id)).pipe(delay(300));
  }

  searchItems(criteria: DropdownSearch): Observable<DropdownItem[]> {
    let filteredItems = this.items();

    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.value.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    if (criteria.categoryId) {
      filteredItems = filteredItems.filter(item => item.categoryId === criteria.categoryId);
    }

    if (criteria.isActive !== undefined) {
      filteredItems = filteredItems.filter(item => item.isActive === criteria.isActive);
    }

    return of(filteredItems).pipe(delay(300));
  }

  services = signal<PlanService[]>([]);


createItem(item: Omit<DropdownItem, 'id' | 'createdAt' | 'updatedAt'>): Observable<DropdownItem> {
  return this._http.post(`${environment.apidev}/Services`, item).pipe(
    map((response: any) => {
      const newItem: DropdownItem = {
        ...item,
        id: this.generateId(), 
        createdAt: new Date(),
        updatedAt: new Date(),
        ...response?.data 
      };
      this.items.update(items => [...items, newItem]);

      return newItem;
    }),
    catchError(error => {
      console.error('Error while creating item:', error);
      return throwError(() => error);
    })
  );
}


 GetServiceItem(item: Omit<DropdownItem, 'id' | 'createdAt' | 'updatedAt'>): Observable<DropdownItem> {
  return this._http.get(`${environment.apidev}/PlansandPackages/GetService`).pipe(
    map((response: any) => {
      const newItem: DropdownItem = {
        ...item,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        // If response has extra fields to include:
        ...response?.data 
      };
      
      // Update signal with new item
      this.items.update(items => [...items, newItem]);

      return newItem;
    }),
    catchError(error => {
      console.error('Error while creating item:', error);
      return throwError(() => error);
    })
  );
}

 updateItem(id: string, updates: Partial<DropdownItem>): Observable<DropdownItem> {
  return this._http.put<{ data: DropdownItem }>(
    `${environment.apidev}/Services/${id}`,
    updates
  ).pipe(
    map(response => {
      const updatedItem = response.data;
      this.items.update(items =>
        items.map(item => item.id === id ? updatedItem : item)
      );
      return updatedItem;
    }),
    catchError(error => {
      console.error('Error while updating item:', error);
      return throwError(() => new Error('Failed to update item'));
    })
  );
}


deleteItem(id: string): Observable<boolean> {
  const url = `${environment.apidev}/Services/${id}`;
  return this._http.delete<boolean>(url).pipe(
    map(response => {
      this.items.update(items => items.filter(item => item.id !== id));
      return response;
    }),
    catchError(error => {
      console.error('Error while deleting item:', error);
      return throwError(() => new Error('Failed to delete item'));
    })
  );
}


  // Bulk operations
  updateItemOrder(categoryId: string, itemIds: string[]): Observable<boolean> {
    this.items.update(items => 
      items.map(item => {
        if (item.categoryId === categoryId) {
          const newOrder = itemIds.indexOf(item.id);
          return newOrder !== -1 ? { ...item, sortOrder: newOrder + 1, updatedAt: new Date() } : item;
        }
        return item;
      })
    );
    return of(true).pipe(delay(500));
  }

  bulkUpdateItems(categoryId: string, updates: Partial<DropdownItem>): Observable<boolean> {
    this.items.update(items => 
      items.map(item => 
        item.categoryId === categoryId 
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      )
    );
    return of(true).pipe(delay(500));
  }

  // Statistics
  getStats(): Observable<DropdownStats> {
    const categories = this.categories();
    const items = this.items();
    
    const stats: DropdownStats = {
      totalCategories: categories.length,
      totalItems: items.length,
      activeItems: items.filter(item => item.isActive).length,
      inactiveItems: items.filter(item => !item.isActive).length,
      categoriesWithItems: categories.filter(cat => 
        items.some(item => item.categoryId === cat.id)
      ).length,
      emptyCategories: categories.filter(cat => 
        !items.some(item => item.categoryId === cat.id)
      ).length
    };

    return of(stats).pipe(delay(300));
  }

  // Import/Export
  exportData(): Observable<{ categories: DropdownCategory[], items: DropdownItem[] }> {
    return of({
      categories: this.categories(),
      items: this.items()
    }).pipe(delay(500));
  }

  importData(data: { categories: DropdownCategory[], items: DropdownItem[] }): Observable<boolean> {
    this.categories.set(data.categories);
    this.items.set(data.items);
    return of(true).pipe(delay(1000));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
public http = inject(HttpClient);

GetServiceItemS(clientId: string): Observable<any> {
  const url = `${environment.apidev}/Services/GetClientServices`;
  const params = { clientId };

  return this.http.get<any>(url, { params }).pipe(
    map((response) => {
      console.log('Client services fetched:', response);
      return response;
    }),
    catchError((error) => {
      console.error('Error fetching client services:', error);
      return throwError(() => error);
    })
  );
}

getDiagnosis(patientId: string): Observable<any> {
  const url = `${environment.apidev}/Patients/GetPatientDiagnoses`;
  
  return this.http.get<any>(url, {
    params: { patientId }
  }).pipe(
    map((response) => {
      console.log('Patient diagnoses fetched:', response);
      return response;
    }),
    catchError((error) => {
      console.error('Error fetching patient diagnoses:', error);
      return throwError(() => error);
    })
  );
}

}