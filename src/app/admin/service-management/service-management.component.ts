import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DropdownService } from '../../service/therapist/dropdown.service';
import { CreateDropdownItemRequest, DropdownItem, UpdateDropdownItemRequest } from '../../models/dropdown-therapist-model';
import { TosterService } from '../../service/toaster/tostr.service';
import { PopupService } from '../../service/popup/popup-service';
import { AdminService } from '../../service/admin/admin.service';
import { SuperAdminService } from '../../service/admin/superAdmin.service';

@Component({
  selector: 'app-service-management',
  standalone: false,
  templateUrl: './service-management.component.html',
  styleUrl: './service-management.component.scss'
})
export class ServiceManagementComponent {

  private dropdownService = inject(DropdownService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(TosterService);
  private fb = inject(FormBuilder);

  public _loader = inject(PopupService);
  

  // State
  appointmentTypes = signal<DropdownItem[]>([]);
  showServiceModal = signal(false);
  editingService = signal<DropdownItem | null>(null);
  serviceForm: FormGroup;
  activeTab = signal<'services' | 'subscriptions'>('services');

  // Computed values
  totalServices = computed(() => this.appointmentTypes().length);
  activeServices = computed(() => this.appointmentTypes().filter(s => s.isActive).length);
  averagePrice = computed(() => {
    const services = this.appointmentTypes();
    if (services.length === 0) return 0;
    const total = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
    console.log("Total price sum:", total);
    return total / services.length;
  });

  constructor() {
    this.serviceForm = this.fb.group({
      label: ['', [Validators.required]],
      description: [''],
      category:[''],
      price: ['', [Validators.required, Validators.min(0)]],
      duration: ['', [Validators.required, Validators.min(1)]],
      cptCode: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadClients();
  }

  
  getServiceId!: string;
  private loadData(): void {
    this._loader.show();
    
    this.dropdownService.getItems().subscribe({
      next: (items: any) => {
        console.log("items[0]", items[0]);
        this.getServiceId = items[0].id;
        this.appointmentTypes.set(items);
        this._loader.hide();
        console.log("items", items);
      },
      error: () => {
        this._loader.hide();
      }
    });
  }

  // Tab management
  setActiveTab(tab: 'services' | 'subscriptions'): void {
    this.activeTab.set(tab);
    if(tab ==='subscriptions'){
      this.subscribedServices.set([])
    }
  }

  createService(): void {
    this.editingService.set(null);
    this.serviceForm.reset({
      label: '',
      description: '',
      category:'',
      price: '',
      duration: '',
      cptCode: '',
      isActive: true
    });
    this.showServiceModal.set(true);
  }

  editService(service: DropdownItem): void {
    console.log("serviceDropdownItem", service);
    
    this.editingService.set(service);
    this.serviceForm.patchValue({
      label: service.label,
      description: service.description || '',
      category: service.category || '',
      price: service.price || '',
      duration: service.metadata?.['duration'] || '',
      cptCode: service.metadata?.['code'] || '',
      isActive: service.isActive
    });
    this.showServiceModal.set(true);

    console.log("this.serviceForm.value", this.serviceForm.value);
  }

  saveServiceForm() {
    if (this.serviceForm.invalid) {
      this.notificationService.error('Validation Error');
      return;
    }

    this._loader.show();

    const formValue = this.serviceForm.value;
    const editingService = this.editingService();

    const serviceData: any = {
      name: formValue.label,
      description: formValue.description,
      category: formValue.category,
      isActive: formValue.isActive,
      sortOrder: editingService?.sortOrder || 0,
      defaultRate: formValue.price,
      defaultDurationMinutes: formValue.duration,
      code: formValue.cptCode
    };

    if (editingService) {
      const updateData: UpdateDropdownItemRequest = {
        ...serviceData,
        id: editingService.id
      };

      console.log("updateData", updateData);
      
      this.dropdownService.updateItem(editingService.id, updateData).subscribe({
        next: (data) => {
          this._loader.hide();
          console.log("data", data);
          this.notificationService.success('Service updated successfully');
          this.closeServiceModal();
          this.loadData();
          return;
        },
        error: (err) => {
          this._loader.hide();
          const backendMessage = err?.error?.message || 'Something went wrong';
          this.notificationService.error(backendMessage);
          this.closeServiceModal();
          return;
        }
      });
    } else {
      // Create new service
      this.dropdownService.createItem(serviceData).subscribe({
        next: () => {
          this._loader.hide();
          this.notificationService.success('Service created successfully');
          this.closeServiceModal();
          this.loadData();
        },
        error: (err) => {
          this._loader.hide();
          const backendError = err?.error;
          const errorMsg = Array.isArray(backendError?.errors) 
            ? backendError.errors.join(', ') 
            : backendError?.message || 'Something went wrong';
          this.notificationService.error(errorMsg);
        }
      });
    }
  }

  closeServiceModal(): void {
    this.showServiceModal.set(false);
    this.editingService.set(null);
    this.serviceForm.reset();
  }

  showDeleteModal = false;
  selectedService: DropdownItem | null = null;

  deleteService(service: DropdownItem): void {
    this.selectedService = service;
    this.showDeleteModal = true;
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedService = null;
    this._loader.hide();
  }

  confirmDelete(): void {
    if (!this.selectedService) return;
    
    this._loader.show();
    
    this.dropdownService.deleteItem(this.selectedService.id).subscribe({
      next: () => {
        this.notificationService.success('Service deleted successfully');
        this._loader.hide();
        this.loadData();
        this.closeDeleteModal();
      },
      error: () => {
        this.notificationService.error('Failed to delete service');
        this._loader.hide();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.serviceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  private generateValueFromLabel(label: string): string {
    return label.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  loadingClients = false;
  clients: any[] = [];
  public adminService = inject(AdminService);
  public superAdmin = inject(SuperAdminService);
  
  loadClients(): void {
    this.loadingClients = true;
    this.adminService.getClientList().subscribe({
      next: (clients) => {
        this.clients = clients || [];
        this.loadingClients = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.loadingClients = false;
      }
    });
  }
  
  public get_clientId: string = '';
  private subscribedServices = signal<string[]>([]);

  onClientChangeEvent(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.get_clientId = selectElement.value;
    console.log('Selected client ID:', this.get_clientId);
    
    // Load subscribed services for this client
    if (this.get_clientId) {
      this.loadSubscribedServices();
    } else {
      this.subscribedServices.set([]);
    }
  }

  loadSubscribedServices(): void {
  if (!this.get_clientId) return;
  
  this._loader.show();
  this.superAdmin.getClientSubscriptions(this.get_clientId).subscribe({
    next: (response: any) => {
      this._loader.hide();
      if (response.success) {
        // Extract service IDs from the response data
        const serviceIds = response.data?.map((service: any) => service.serviceId) || [];
        this.subscribedServices.set(serviceIds);
        console.log('Subscribed services:', serviceIds);
      } else {
        this.notificationService.error(response.message || 'Failed to load subscriptions');
      }
    },
    error: (err) => {
      this._loader.hide();
      console.error('Error loading subscriptions:', err);
      const errorMessage = err?.error?.message || 'Failed to load client subscriptions';
      this.notificationService.error(errorMessage);
      this.subscribedServices.set([]);
    }
  });
}

subscribeService(service: DropdownItem): void {
  const clientId = this.get_clientId;
  
  if (!clientId) {
    this.notificationService.error('Please select a client first');
    return;
  }

  const payload: any = {
    clientId: clientId,
    serviceIds: [service.id]
  };

  this._loader.show();
  
  this.superAdmin.subscribeService(payload).subscribe({
    next: (res: any) => {
      this._loader.hide();
      if (res) {
        this.notificationService.success(res.data || 'Service subscribed successfully');
        // Add to subscribed services
        this.subscribedServices.update(current => [...current, service.id]);
        // Reload subscriptions to ensure data is fresh
        this.loadSubscribedServices();
      } 
    },
    error: (err) => {
      this._loader.hide();
      const backendMessage = err?.error?.message || 'Failed to subscribe to service';
      this.notificationService.error(backendMessage);
    }
  });
}

unsubscribeService(service: DropdownItem): void {
  const clientId = this.get_clientId;
  
  if (!clientId) {
    this.notificationService.error('Please select a client first');
    return;
  }

  this._loader.show();
  
  this.superAdmin.unsubscribeService(service.id, clientId).subscribe({
    next: (res: any) => {
      this._loader.hide();
      if (res?.success) {
        this.notificationService.success(res.data || 'Service unsubscribed successfully');
        this.subscribedServices.update(current => current.filter(id => id !== service.id));
        this.loadSubscribedServices();
      } else {
        this.notificationService.error(res?.message || 'Failed to unsubscribe from service');
      }
    },
    error: (err) => {
      this._loader.hide();
      const backendMessage = err?.error?.message || 'Failed to unsubscribe from service';
      this.notificationService.error(backendMessage);
    }
  });
}

  isServiceSubscribed(serviceId: string): boolean {
    return this.subscribedServices().includes(serviceId);
  }

 
}