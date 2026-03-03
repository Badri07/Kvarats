import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth/auth.service';
import { AdminService } from '../../../service/admin/admin.service';
import { Availability, DayOfWeek } from '../../../models/leave.model';
import { Leave } from '../../../models/leave.model';
import { ButtonComponent } from '../../../shared/button/button.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { User, UserRole } from '../../../models/availability-user.model.interface';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TosterService } from '../../../service/toaster/tostr.service';

@Component({
  selector: 'app-schedule-dashboard',
  standalone: false,
  templateUrl: './schedule-dashboard.component.html',
  styleUrl: './schedule-dashboard.component.scss'
})
export class ScheduleDashboardComponent implements OnInit, OnDestroy {
  private leaveService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // State
  leaves = signal<Leave[]>([]);
  availabilities = signal<Availability[]>([]);
  isLoading = signal(false);

  isDeleting = signal(false);
  isSaving = signal(false);

  showLeaveModal = signal(false);
  editingLeave = signal<Leave | null>(null);

  // Current user info
  currentUser: any = this.authService.getUserRole();
  isTherapist = computed(() => this.currentUser === UserRole.THERAPIST);
  isClientAdmin = computed(() => this.currentUser === UserRole.CLIENT_ADMIN);

upcomingLeaves = computed(() => {
  const today = new Date();
  return this.leaves()
    .filter(leave => new Date(leave.leaveDate) >= today)
    .sort((a, b) => new Date(a.leaveDate).getTime() - new Date(b.leaveDate).getTime())
    .slice(0, 5) || [];
});

 totalLeaves = computed(() => this.leaves().length || 0);
 thisWeekLeaves = computed(() => {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return this.leaves().filter(leave => {
    const leaveDate = new Date(leave.leaveDate);
    return leaveDate >= weekStart && leaveDate <= weekEnd;
  }).length || 0;
});

  workingDays = computed(() => {
  return this.availabilities().filter(avail => avail.isAvailable).length || 0;
});

  daysOfWeek = [
    { value: DayOfWeek.MONDAY, short: 'Mon', full: 'Monday' },
    { value: DayOfWeek.TUESDAY, short: 'Tue', full: 'Tuesday' },
    { value: DayOfWeek.WEDNESDAY, short: 'Wed', full: 'Wednesday' },
    { value: DayOfWeek.THURSDAY, short: 'Thu', full: 'Thursday' },
    { value: DayOfWeek.FRIDAY, short: 'Fri', full: 'Friday' },
    { value: DayOfWeek.SATURDAY, short: 'Sat', full: 'Saturday' },
    { value: DayOfWeek.SUNDAY, short: 'Sun', full: 'Sunday' }
  ];

 public breadcrumbService = inject(BreadcrumbService)
   ngOnInit(): void {
     this.breadcrumbService.setBreadcrumbs([
       { label: 'Schedule', url: 'appointments/schedule' },
     ]);
    this.loadData();
    this.getTherapist()

  }

  ngOnDestroy(): void {
  }

loadData(): void {
  this.isLoading.set(true);
  
  if (this.isTherapist()) {
    const therapistId: any = this.authService.getClientId();
    
    this.leaveService.getUserLeave().subscribe({
      next: (response: any) => {
        // Handle different response structures
        let leaves: Leave[] = [];
        
        if (Array.isArray(response)) {
          leaves = response;
        } else if (response && Array.isArray(response.data)) {
          leaves = response.data;
        } else if (response && response.data && typeof response.data === 'object') {
          // If it's an object, convert to array
          leaves = Object.values(response.data);
        }
        
        console.log('Loaded leaves:', leaves); // Debug log
        this.leaves.set(leaves);
      },
      error: (error: any) => {
        console.error('Error loading leaves:', error);
        this.leaves.set([]); // Set empty array on error
      },
      complete: () => {
        this.checkLoadingComplete();
      }
    });

    this.leaveService.getAvailabilityByUser(therapistId).subscribe({
      next: (response: any) => {
        // Handle different response structures
        let availabilities: Availability[] = [];
        
        if (Array.isArray(response)) {
          availabilities = response;
        } else if (response && Array.isArray(response.data)) {
          availabilities = response.data;
        } else if (response && response.data && typeof response.data === 'object') {
          availabilities = Object.values(response.data);
        }
        
        console.log('Loaded availabilities:', availabilities); // Debug log
        this.availabilities.set(availabilities);
      },
      error: (error: any) => {
        console.error('Error loading availabilities:', error);
        this.availabilities.set([]); // Set empty array on error
      },
      complete: () => {
        this.checkLoadingComplete();
      }
    });
  } else if (this.isClientAdmin()) {
    // Apply similar fixes for Client Admin flow
    const clientId = this.authService.getClientId();
    
    this.leaveService.getUserLeave().subscribe({
      next: (response: any) => {
        let leaves: Leave[] = [];
        
        if (Array.isArray(response)) {
          leaves = response;
        } else if (response && Array.isArray(response.data)) {
          leaves = response.data;
        }
        
        console.log('Loaded admin leaves:', leaves);
        this.leaves.set(leaves);
      },
      error: (error: any) => {
        console.error('Error loading admin leaves:', error);
        this.leaves.set([]);
      },
      complete: () => {
        this.checkLoadingComplete();
      }
    });

    this.leaveService.getExistingList().subscribe({
      next: (response: any) => {
        let availabilities: Availability[] = [];
        
        if (Array.isArray(response)) {
          availabilities = response;
        } else if (response && Array.isArray(response.data)) {
          availabilities = response.data;
        }
        
        console.log('Loaded admin availabilities:', availabilities);
        this.availabilities.set(availabilities);
      },
      error: (error: any) => {
        console.error('Error loading admin availabilities:', error);
        this.availabilities.set([]);
      },
      complete: () => {
        this.checkLoadingComplete();
      }
    });
  } else {
    this.isLoading.set(false);
  }
}

  private checkLoadingComplete(): void {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  navigateToLeaves(): void {
    this.router.navigate(['/appointments/availability/leave']);
  }

  navigateToAvailability(): void {
    this.router.navigate(['/appointments/availability/availabilitySetting']);
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

  manageAvailability(): void {
    this.router.navigate(['/appointments/availability/availabilitySetting']);
  }

  getDayName(dayOfWeek: DayOfWeek): string {
    const day = this.daysOfWeek.find(d => d.value === dayOfWeek);
    return day ? day.full : 'Unknown Day';
  }

  getAvailabilityForDay(dayOfWeek: DayOfWeek, therapistId: string): Availability | undefined {
    return this.availabilities().find(avail => 
      avail.dayOfWeek === dayOfWeek && avail.therapistId === therapistId
    );
  }

  public fb = inject(FormBuilder)
    leaveForm: FormGroup = this.fb.group({
    therapistId: [''],
    leaveDate: ['', Validators.required],
    isFullDay: [true],
    fromTime: [''],
    toTime: [''],
    reason: ['']
  });
  
   leaveSubmitted = signal(false);

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

  selectedValueIds:any;
   private notificationService = inject(TosterService);

  saveLeave(): void {
  
  this.leaveSubmitted.set(true);
  
  if (this.leaveForm.invalid) {
    this.markFormGroupTouched();
    return;
  }

  this.isSaving.set(true);
  const formValue = this.leaveForm.value;

  let userId: string;
  
  if (this.isTherapist()) {
    userId = this.authService.getUserId();
  } else if (this.isClientAdmin()) {
    console.log("formValue.therapistId",formValue.therapistId);
    userId = this.selectedValueIds;
    
    if (!userId) {
      this.notificationService.error('Please select a therapist');
      this.isSaving.set(false);
      return;
    }
  } else {
    this.notificationService.error('You are not authorized to apply leaves');
    this.isSaving.set(false);
    return;
  }

  const formattedDate = this.formatDate(new Date(formValue.leaveDate));

  const leaveRequest: any = {
    id: this.editingLeave() ? this.editingLeave()!.id : 0, 
    userId: userId, 
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
    
    return '';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  }

  therapists = signal<User[]>([]);
  therapistList:any[]=[];

  onTherapistChange(event: Event) {
  this.selectedValueIds = (event.target as HTMLSelectElement).value;
  // console.log('Selected therapist ID:', selectedValue);
}

   getTherapist(){
        this.authService.getTherapistList().subscribe({
      next: (res: any[]) => {
        this.therapistList = res;
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

   createLeaveManage(): void {
    this.router.navigate(['/appointments/availability/leave']);
  }
}