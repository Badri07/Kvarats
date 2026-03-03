import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../service/auth/auth.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { AdminService } from '../../../service/admin/admin.service';
import { Leave, CreateLeaveRequest } from '../../../models/leave.model';
import { User, UserRole } from '../../../models/availability-user.model.interface';
import { ButtonComponent } from '../../../shared/button/button.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { PopupService } from '../../../service/popup/popup-service';

@Component({
  selector: 'app-leaves',
  standalone: false,
  templateUrl: './leaves.component.html',
  styleUrl: './leaves.component.scss'
})
export class LeavesComponent implements OnInit, OnDestroy {
  private leaveService = inject(AdminService);
  private authService = inject(AuthService);
  private notificationService = inject(TosterService);
  private loader = inject(PopupService);
  private fb = inject(FormBuilder);

  // State
  leaves = signal<Leave[]>([]);
  therapists = signal<User[]>([]);
  filteredLeaves = signal<Leave[]>([]);
  isLoading = signal(true);
  showLeaveModal = signal(false);
  showDeleteModal = signal(false);
  editingLeave = signal<Leave | null>(null);
  leaveToDelete = signal<Leave | null>(null);
  isDeleting = signal(false);
  isSaving = signal(false);
  leaveSubmitted = signal(false);

  // Current user info
  currentUser: any = this.authService.getUserRole();
  isTherapist = computed(() => this.currentUser === UserRole.THERAPIST);
  isClientAdmin = computed(() => this.currentUser === UserRole.CLIENT_ADMIN);
  

  filterForm: FormGroup = this.fb.group({
    therapistId: [''],
    dateFrom: [''],
    dateTo: [''],
    isFullDay: ['']
  });

  leaveForm: FormGroup = this.fb.group({
    therapistIdLeave: [''],
    leaveDate: ['', Validators.required],
    isFullDay: [true],
    fromTime: [''],
    toTime: [''],
    reason: ['']
  });

  totalLeaves = computed(() => this.filteredLeaves().length);
  upcomingLeaves = computed(() => {
    const today = new Date();
    return this.filteredLeaves().filter(leave => new Date(leave.leaveDate) >= today).length;
  });
  fullDayLeaves = computed(() => this.filteredLeaves().filter(leave => leave.isFullDay).length);
  partialLeaves = computed(() => this.filteredLeaves().filter(leave => !leave.isFullDay).length);

 public breadcrumbService = inject(BreadcrumbService)
   ngOnInit(): void {
     this.breadcrumbService.setBreadcrumbs([
       { label: 'Leaves', url: 'appointments/leave' },
     ]);
    this.loadData();
    this.setupFilters();
    this.setupLeaveFormSubscriptions();
    this.getTherapist();
    
    this.leaveForm.get('therapistIdLeave')?.valueChanges.subscribe(value => {
    this.selectedValueIds = value;
    console.log('Selected ID:', this.selectedValueIds);
  });
  }

  ngOnDestroy(): void {
  }

loadData(): void {
  
  this.isLoading.set(true);

  if (this.isTherapist()) {
    const therapistId: any = this.authService.getUserId();
    this.leaveService.getUserLeave().subscribe({
      next: (response: any) => {
        const leaves: Leave[] = response.data || response || [];
        const therapistLeaves = leaves.filter(leave => leave.userId === therapistId);
        this.leaves.set(therapistLeaves);
        this.filteredLeaves.set(therapistLeaves);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        this.notificationService.error('Failed to load leaves');
        console.error('Error loading leaves:', error);
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });

  } else if (this.isClientAdmin()) {
    this.leaveService.getUserLeave().subscribe({
      next: (response: any) => {
        const leaves: Leave[] = response.data || response || [];
        console.log("Admin leaves:", leaves);

        // Admin sees all leaves
        this.leaves.set(leaves);
        this.filteredLeaves.set(leaves);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        this.notificationService.error('Failed to load leaves');
        console.error('Error loading leaves:', error);
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });

    this.loadTherapists();

  } else {
    this.isLoading.set(false);
  }
}


  loadTherapists(): void {
    debugger
    this.authService.getTherapistList().subscribe({
      next: (response: any) => {
        const users = response.data || response || [];
        this.therapists.set(users);
        console.log("this.therapistList",this.therapistList);
        
      },
      error: (error: any) => {
        console.error('Error loading therapists:', error);
      }
    });
  }

  setupFilters(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

setupLeaveFormSubscriptions(): void {
  this.leaveForm.get('isFullDay')?.valueChanges.subscribe(isFullDay => {
    if (isFullDay) {
      this.leaveForm.patchValue({ fromTime: '', toTime: '' });
    }
  });

  this.leaveForm.get('leaveDate')?.valueChanges.subscribe(() => {
    this.validateLeaveDate();
  });
}

  applyFilters(): void {
    const formValue = this.filterForm.value;
    let filtered = this.leaves();

    if (formValue.therapistId) {
      filtered = filtered.filter(leave => leave.therapistId === formValue.therapistId);
    }

    if (formValue.dateFrom) {
      filtered = filtered.filter(leave => new Date(leave.leaveDate) >= new Date(formValue.dateFrom));
    }

    if (formValue.dateTo) {
      filtered = filtered.filter(leave => new Date(leave.leaveDate) <= new Date(formValue.dateTo));
    }

    if (formValue.isFullDay !== '') {
      filtered = filtered.filter(leave => leave.isFullDay === (formValue.isFullDay === 'true'));
    }

    this.filteredLeaves.set(filtered);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredLeaves.set(this.leaves());
  }

  createLeave(): void {
    
    console.log("isTherapist",this.isTherapist());
    
    this.editingLeave.set(null);
    this.leaveForm.reset({
      therapistId: this.isTherapist() ? this.authService.getClientId() : '',
      leaveDate: '',
      isFullDay: true,
      fromTime: '',
      toTime: '',
      reason: ''
    });
    this.showLeaveModal.set(true);
  }

  
  

  
editLeave(leave: Leave): void {
  
  this.editingLeave.set(leave);
  
  // Find therapist ID from the userName
  const therapist = this.therapists().find(t => 
    `${t.firstName} ${t.lastName}` === leave.userName
  );
  
  this.leaveForm.patchValue({
    therapistId: therapist?.userId || '', // Use the found ID
    leaveDate: this.formatDateForInput(leave.leaveDate),
    isFullDay: leave.isFullDay,
    fromTime: leave.fromTime || '',
    toTime: leave.toTime || '',
    reason: leave.reason || ''
  });
  
  console.log("Form values after patch:", this.leaveForm.value);
  
  this.showLeaveModal.set(true);
}

saveLeave(): void {
  debugger
  
  this.leaveSubmitted.set(true);
  this.validateLeaveDate();
  
  if (this.leaveForm.invalid) {
    this.markFormGroupTouched();
    return;
  }

  this.isSaving.set(true);
  const formValue = this.leaveForm.value;

  let userId: string;
  
  // if (this.isTherapist()) {
  //   userId = this.authService.getUserId();
  // } else if (this.isClientAdmin()) {
  //   console.log("formValue.therapistId",formValue.therapistIdLeave);
  //   userId = this.selectedValueIds;
    
  //   if (!userId) {
  //     this.notificationService.error('Please select a therapist');
  //     this.isSaving.set(false);
  //     return;
  //   }
  // } else {
  //   this.notificationService.error('You are not authorized to apply leaves');
  //   this.isSaving.set(false);
  //   return;
  // }

  const formattedDate = this.formatDate(new Date(formValue.leaveDate));

  const leaveRequest: any = {
    id: this.editingLeave() ? this.editingLeave()!.id : 0, 
    userId : this.authService.getUserId(), 
    leaveDate: formattedDate, 
    isFullDay: formValue.isFullDay,
    fromTime: formValue.isFullDay ? null : this.formatTimeForApi(formValue.fromTime),
    toTime: formValue.isFullDay ? null : this.formatTimeForApi(formValue.toTime),
    reason: formValue.reason || ''
  };

  this.leaveService.AddUserLeave(leaveRequest).subscribe({
    next: (response: any) => {
      this.notificationService.success(
        `Leave ${this.editingLeave() ? 'updated' : 'created'} successfully`
      );
      this.loadData();
      this.closeLeaveModal();
      this.isSaving.set(false);
    },
    error: (error: any) => {
      this.notificationService.error('Failed to save leave');
      console.error('Error saving leave:', error);
      this.isSaving.set(false);
    },
    complete: () => {
      this.isSaving.set(false);
    }
  });
}

private formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

private formatTimeForApi(time: string): string | null {
  if (!time) {
    return null;
  }
  
  if (time.length === 5) {
    return `${time}:00`; 
  }
  
  return time;
}
  confirmDelete(leave: Leave): void {
    this.leaveToDelete.set(leave);
    this.showDeleteModal.set(true);
  }

  deleteLeave(): void {
    const leave = this.leaveToDelete();
    if (!leave) return;

    this.isDeleting.set(true);
    this.leaveService.deleteLeave(leave.id).subscribe({
      next: () => {
        this.notificationService.success('Leave deleted successfully');
        this.loadData();
        this.showDeleteModal.set(false);
        this.leaveToDelete.set(null);
        this.isDeleting.set(false);
      },
      error: (error: any) => {
        this.notificationService.error('Failed to delete leave');
        console.error('Error deleting leave:', error);
        this.isDeleting.set(false);
      },
      complete: () => {
        this.isDeleting.set(false);
      }
    });
  }

  closeLeaveModal(): void {
    this.showLeaveModal.set(false);
    this.editingLeave.set(null);
    this.leaveForm.reset({
      therapistId: this.isTherapist() ? this.authService.getClientId() : '',
      leaveDate: '',
      isFullDay: true,
      fromTime: '',
      toTime: '',
      reason: ''
    });
    this.leaveSubmitted.set(false);
  }

  therapistList:any[]=[];
  getTherapist(){
    debugger
        this.authService.getTherapistList().subscribe({
      next: (res: any[]) => {
        this.therapistList = res;
        console.log("therapistListtherapistListtherapistList",this.therapistList);
        
         if (this.editingLeave()) {
        this.leaveForm.patchValue({
          therapistId: this.editingLeave()!.therapistId
        });
      }
      },
      error: (err) => {
        console.error('Failed to load therapists:', err);
      }
    });
  }
selectedValueIds:any;
onTherapistChange(event: Event) {
  debugger
  const selectElement = event.target as HTMLSelectElement;
  this.selectedValueIds = selectElement.value;
  console.log('Selected ID:', this.selectedValueIds);
}

// Add a cache property
private therapistNameCache = new Map<string, string>();

getTherapistName(therapistId: any): string {
  debugger
  console.log('getTherapistName called with:', therapistId, 'type:', typeof therapistId);
  console.log('Available therapists:', this.therapists());
  
  if (!therapistId) return 'Unknown Therapist';
  
  const id = therapistId.toString();
  const therapists = this.therapists();
  
  if (!therapists || therapists.length === 0) {
    console.log('No therapists data available');
    return 'Loading...';
  }
  
  const therapist = therapists.find((t: any) => {
    console.log(`Comparing: ${t.id} (${typeof t.id}) with ${id} (${typeof id})`);
    return t.id == id;
  });
  
  console.log('Found therapist:', therapist);
  
  // Use firstName + lastName if available, otherwise fall back to userName
  let name = 'Unknown Therapist';
  if (therapist) {
    if (therapist.firstName && therapist.lastName) {
      name = `${therapist.firstName} ${therapist.lastName}`;
    } else if (therapist.userName) {
      name = therapist.userName;
    }
  }
  
  this.therapistNameCache.set(id, name);
  return name;
}

// Clear cache when therapists data changes (if using signals)
// therapists = signal([]); // Your current signal

// Or if you need to manually clear cache when data reloads
clearTherapistCache() {
  this.therapistNameCache.clear();
}
  canEdit(leave: Leave): boolean {
    
    console.log("leave.therapistId",leave.therapistId);
    console.log("authService.getClientId()",this.authService.getClientId());
    if (this.isTherapist()) {
      return true
    }
    return this.isClientAdmin();
  }

  canDelete(leave: Leave): boolean {
    
    return this.canEdit(leave);
  }

  private formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private markFormGroupTouched(): void {
    Object.keys(this.leaveForm.controls).forEach(key => {
      this.leaveForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.leaveForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.leaveSubmitted()));
  }

getFieldError(fieldName: string): string {
  const field = this.leaveForm.get(fieldName);
  if (!field || !field.errors || (!field.touched && !this.leaveSubmitted())) return '';

  if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
  if (field.errors['pastDate']) return 'Cannot select past dates for leaves';
  
  return '';
}

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }
approveLeave(leave: any): void {
  this.loader.show();

  this.leaveService.approveLeaveRequest(leave.id).subscribe({
    next: (response: any) => {
      this.loader.hide();
      this.notificationService.success('Leave approved successfully');
      
      leave.isApproved = true;
      leave.approvedBy = response.data?.approvedBy || this.authService.getUserId();
      leave.approvedAt = new Date().toISOString();
      
      this.loadData();
    },
    error: (error: any) => {
      this.loader.hide();
      this.notificationService.error('Failed to approve leave');
      console.error('Error approving leave:', error);
    }
  });
}

getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

getMaxFutureDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().split('T')[0];
}

isPastDate(dateString: string): boolean {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(dateString);
  return selectedDate < today;
}
validateLeaveDate(): void {
  const leaveDateControl = this.leaveForm.get('leaveDate');
  if (leaveDateControl?.value) {
    if (this.isPastDate(leaveDateControl.value)) {
      leaveDateControl.setErrors({ 'pastDate': true });
    } else {
      leaveDateControl.setErrors(null);
    }
  }
}
isPastLeave(leaveDate: string | Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const leave = new Date(leaveDate);
  return leave < today;
}
isTodayAndPastTime(): boolean {
  const leaveDate = this.leaveForm.get('leaveDate')?.value;
  if (!leaveDate) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return leaveDate === today;
}
}