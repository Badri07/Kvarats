
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth/auth.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { AdminService } from '../../../service/admin/admin.service';
import { Availability, DayOfWeek, CreateAvailabilityRequest } from '../../../models/leave.model';
import { User, UserRole } from '../../../models/availability-user.model.interface';
import { ButtonComponent } from '../../../shared/button/button.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { PopupService } from '../../../service/popup/popup-service';

@Component({
  selector: 'app-availability',
  standalone: false,
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss'
})
export class AvailabilitySettingComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private notificationService = inject(TosterService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // State
  availabilities: Availability[] = [];
  therapists: User[] = [];
  selectedTherapistId: string = '';
  showAvailabilityModal = false;
  editingAvailability: Availability | null = null;
  isSaving = false; // Keep this for modal save/update loading
  availabilitySubmitted = false;
  showDeleteModal = false;
  availabilityToDelete: Availability | null = null;
  isDeleting = false; // Keep this for delete loading
  therapistList: any[] = [];
  selectedValueIds: any;

  currentUser: any = this.authService.getUserRole();
  public isLoading = inject(PopupService); // Global loading service
  
  get isTherapist(): boolean {
    return this.currentUser === UserRole.THERAPIST;
  }
  
  get isClientAdmin(): boolean {
    return this.currentUser === UserRole.CLIENT_ADMIN;
  }

  filterForm: FormGroup = this.fb.group({
    therapistIdLeave: ['']
  });

  availabilityForm: FormGroup = this.fb.group({
    therapistId: ['', Validators.required],
    dayOfWeek: [1, Validators.required], // Changed to number
    startTime: ['09:00', Validators.required],
    endTime: ['18:00', Validators.required],
    isAvailable: [true]
  });

  daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
  ];

  // Fixed weekly availability calculation
  get weeklyAvailability(): any[] {
    // console.log('Computing weekly availability...');
    
    const therapistId = this.isTherapist
      ? this.authService.getUserId()
      : this.selectedValueIds;

    if (!therapistId) {
      return [];
    }

    // Create a map of dayOfWeek to availability for easy lookup
    const availabilityMap: { [key: number]: any } = {};
    
    this.availabilities.forEach(avail => {
      if (avail.dayOfWeek !== undefined && avail.dayOfWeek !== null) {
        availabilityMap[avail.dayOfWeek] = avail;
      }
    });

    // Map each day of week to its availability
    const result = this.daysOfWeek.map(day => {
      const availability = availabilityMap[day.value] || null;
      
      if (availability) {
        const hasFullDayLeave = availability?.hasLeave && availability?.leaveInfo?.isFullDay;
        const isActuallyAvailable = availability?.isAvailable && !hasFullDayLeave;
        
        return { 
          day, 
          availability: {
            id: availability.id,
            therapistId: therapistId,
            dayOfWeek: availability.dayOfWeek,
            startTime: availability.startTime || '09:00',
            endTime: availability.endTime || '18:00',
            isAvailable: isActuallyAvailable,
            hasLeave: availability.hasLeave,
            leaveInfo: availability.leaveInfo
          },
          hasFullDayLeave: hasFullDayLeave
        };
      } else {
        return { 
          day, 
          availability: null,
          hasFullDayLeave: false
        };
      }
    });

    return result;
  }

  public breadcrumbService = inject(BreadcrumbService);

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Availability', url: 'appointments/availability/availabilitySetting' },
    ]);
    
    if (this.isTherapist) {
      this.selectedValueIds = this.authService.getUserId();
      this.loadData();
    }
    
    this.setupFilters();
    this.getTherapist();
    this.loadTherapists();
  }

  loadData(): void {
    this.isLoading.show(); // Use the service method
    const find_role = this.authService.getUserRole();
    
    if (find_role === 'Therapist') {
      const get_id: any = this.authService.getUserId();
      this.adminService.getAvailabilityByUser(get_id).subscribe({
        next: (response: any) => {
          // console.log('Therapist API response:', response);
          let availabilities = [];
          if (Array.isArray(response)) {
            availabilities = response;
          } else if (response && Array.isArray(response.data)) {
            availabilities = response.data;
          } else {
            availabilities = response || [];
          }
          this.availabilities = availabilities;
          this.isLoading.hide();
        },
        error: (error: any) => {
          this.notificationService.error('Failed to load availability');
          // console.error('Error loading availability:', error);
          this.isLoading.hide();
        }
      });
    } else if (find_role === 'client_admin' || find_role === 'Admin') {
      const therapistId = this.selectedValueIds;
      if (therapistId) {
        this.adminService.getAvailabilityByUser(therapistId).subscribe({
          next: (response: any) => {
            // console.log('Admin API response:', response);
            let availabilities = [];
            if (Array.isArray(response)) {
              availabilities = response;
            } else if (response && Array.isArray(response.data)) {
              availabilities = response.data;
            } else {
              availabilities = response || [];
            }
            
            this.availabilities = availabilities;
            this.isLoading.hide();
          },
          error: (error: any) => {
            this.notificationService.error('Failed to load availabilities');
            // console.error('Error loading availabilities:', error);
            this.isLoading.hide();
          }
        });
      } else {
        this.availabilities = [];
        this.isLoading.hide();
      }
    } else {
      this.isLoading.hide();
      this.availabilities = [];
    }
  }

  formatTo12Hour(time: string): string {
  if (!time) return '';

  const [hourStr, minute] = time.split(':');
  let hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;

  return `${hour}:${minute} ${period}`;
}


  onTherapistChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedValueIds = selectElement.value;
    // console.log('Selected ID:', this.selectedValueIds);
    this.loadData();
  }

  getTherapist(): void {
    this.authService.getTherapistList().subscribe({
      next: (res: any[]) => {
        this.therapistList = res;
      },
      error: (err) => {
        // console.error('Failed to load therapists:', err);
      }
    });
  }
  
  loadTherapists(): void {
    this.authService.getTherapistList().subscribe({
      next: (response: any) => {
        const users = response.data || response || [];
        this.therapists = users;
        
        if (users.length > 0 && !this.selectedTherapistId) {
          const firstTherapistId = users[0].id;
          this.selectedTherapistId = firstTherapistId;
          this.filterForm.patchValue({ therapistId: firstTherapistId });
          this.loadData();
        }
      },
      error: (error: any) => {
        // console.error('Error loading therapists:', error);
      }
    });
  }

  setupFilters(): void {
    this.filterForm.get('therapistId')?.valueChanges.subscribe(therapistId => {
      this.selectedTherapistId = therapistId || '';
    });
  }

  createAvailability(dayOfWeek: number): void {
    this.editingAvailability = null;
    
    let therapistId: string;
    
    if (this.isTherapist) {
      therapistId = this.authService.getUserId();
    } else {
      therapistId = this.selectedValueIds;
    }
    
    this.availabilityForm.patchValue({
      therapistId: therapistId,
      dayOfWeek: dayOfWeek,
      startTime: '09:00',
      endTime: '18:00',
      isAvailable: true
    });
    
    this.showAvailabilityModal = true;
  }

  editAvailability(availability: any): void {
    this.editingAvailability = availability;
    this.availabilityForm.patchValue({
      therapistId: availability.therapistId,
      dayOfWeek: availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isAvailable: availability.isAvailable
    });
    this.showAvailabilityModal = true;
  }

  saveAvailability(): void {
    this.availabilitySubmitted = true;
    
    if (this.availabilityForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true; // Local loading for modal
    const formValue = this.availabilityForm.value;
    const userId = this.isTherapist 
      ? this.authService.getUserId() 
      : formValue.therapistId;

    if (!userId) {
      this.notificationService.error('Therapist ID is required');
      this.isSaving = false;
      return;
    }
    
    const availabilityPayload = {
      userId: this.selectedValueIds,
      availabilities: [
        {
          id: this.editingAvailability ? this.editingAvailability!.id : 0,
          dayOfWeek: formValue.dayOfWeek,
          isAvailable: formValue.isAvailable,
          startTime: formValue.startTime,
          endTime: formValue.endTime
        }
      ]
    };

    this.adminService.addOrUpdateAvailability(availabilityPayload).subscribe({
      next: (response: any) => {
        this.notificationService.success(
          `Availability ${this.editingAvailability ? 'updated' : 'created'} successfully`
        );
        this.loadData();
        this.closeAvailabilityModal();
        this.isSaving = false;
      },
      error: (error: any) => {
        this.notificationService.error('Failed to save availability');
        // console.error('Error saving availability:', error);
        this.isSaving = false;
      }
    });
  }

  toggleAvailability(availability: any): void {
    const updatedAvailability = {
      ...availability,
      isAvailable: !availability.isAvailable
    };
    
    this.isLoading.show(); // Show global loading
    this.adminService.addOrUpdateAvailability(updatedAvailability).subscribe({
      next: () => {
        this.notificationService.success(
          `${this.getDayName(availability.dayOfWeek)} availability ${availability.isAvailable ? 'disabled' : 'enabled'}`
        );
        this.loadData();
        this.isLoading.hide();
      },
      error: (error: any) => {
        this.notificationService.error('Failed to update availability');
        // console.error('Error updating availability:', error);
        this.isLoading.hide();
      }
    });
  }

  closeAvailabilityModal(): void {
    this.showAvailabilityModal = false;
    this.editingAvailability = null;
    this.availabilityForm.reset({
      therapistId: this.isTherapist ? this.authService.getClientId() : this.selectedTherapistId,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
      isAvailable: true
    });
    this.availabilitySubmitted = false;
  }

  getTherapistName(therapistId: string): string {
    const therapist = this.therapists.find((t: any) => t.id === therapistId);
    return therapist ? `${therapist.firstName} ${therapist.lastName}` : 'Unknown Therapist';
  }

  getDayName(dayOfWeek: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayOfWeek);
    return day ? day.label : 'Unknown Day';
  }

  getShortDayName(dayOfWeek: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayOfWeek);
    return day ? day.short : 'Unknown';
  }

  canEdit(availability: any): boolean {
    if (!availability) {
      return this.isClientAdmin;
    }
    
    if (this.isTherapist) {
      return availability.therapistId === this.authService.getUserId();
    }
    
    if (this.isClientAdmin) {
      return true;
    }
    
    return false;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.availabilityForm.controls).forEach(key => {
      this.availabilityForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.availabilityForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.availabilitySubmitted));
  }

  getFieldError(fieldName: string): string {
    const field = this.availabilityForm.get(fieldName);
    if (!field || !field.errors || (!field.touched && !this.availabilitySubmitted)) return '';

    if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
    
    return '';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  goBack(): void {
    this.router.navigate(['/appointments/availability']);
  }

  deleteAvailability(): void {
    const availability = this.availabilityToDelete;
    if (!availability || !availability.id) {
      this.notificationService.error('Invalid availability data');
      return;
    }

    this.isDeleting = true; // Local loading for delete
    this.adminService.availabilitDeleteLeave(availability.id).subscribe({
      next: () => {
        this.notificationService.success('Availability deleted successfully');
        this.loadData();
        this.closeDeleteModal();
        this.isDeleting = false;
      },
      error: (error: any) => {
        this.notificationService.error('Failed to delete availability');
        // console.error('Error deleting availability:', error);
        this.isDeleting = false;
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.availabilityToDelete = null;
  }

  onDeleteAvailability(availability: any): void {
    this.confirmDelete(availability);
  }

  confirmDelete(availability: Availability): void {
    this.availabilityToDelete = availability;
    this.showDeleteModal = true;
  }
}