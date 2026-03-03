import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';
import { ColDef, Column, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AdminService } from '../../service/admin/admin.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { BreadcrumbService } from '../../shared/breadcrumb/breadcrumb.service';
import { SchedulerService } from '../../service/scheduler/scheduler.service';
import {
  SchedulerClickEvent,
  AppointmentTypeOption,
  PatientOption,
  MeetingTypeOption,
  User,
} from '../../models/scheduler';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import moment from 'moment';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TosterService } from '../../service/toaster/tostr.service';
import { AppointmentType, UserRole } from '../../models/availability-user.model.interface';
import { DropdownService } from '../../service/therapist/dropdown.service';
import { DateFormatService } from '../../service/global-date/date-format-service';

@Component({
  selector: 'app-appointment-list',
  standalone: false,
  providers: [DatePipe],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent {
  rowData: any[] = [];
  columnDefs: ColDef[] = [];
  searchValue: string = '';
  gridApi!: GridApi;
  gridColumnApi!: Column; 
  paginationPageSize = 10;
  paginationPageSizeSelector: number[] | boolean = [10, 20, 50, 100];
  show: boolean = false;

  appointmentForm!: FormGroup;
  selectedTab: string = 'schedule';
  weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  therapistList: User[] = [];
  availableStartTimes: string[] = [];
  availableEndTimes: string[] = [];
  appointmentTypeOptions: AppointmentTypeOption[] = [];
  meetingTypeOptions: MeetingTypeOption[] = [];
  PatientsListOptions: PatientOption[] = [];
  
  totalAmount: number = 0;
  useInsurance: boolean = false;
  selectedInsuranceId: any = null;
  selectedSlidingScaleId: string = '';
  copayAmount: number = 0;
  insuranceClaimAmount: number = 0;
  patientPaysAmount: number = 0;
  transactionNotes: string = '';

  insuranceList: any[] = [];
  selectedInsurance: any = null;
  slidingScalesList: any = [];
  selectedPatient: any;
  selectedPatientView = signal<any | null>(null);
  selectedDiagnoses: any[] = [];

  public _service = inject(AdminService);
  public _adminservice = inject(AdminService);
  public authService = inject(AuthService);
  public toastr = inject(TosterService);
  public dateFormatService = inject(DateFormatService);
  
  constructor(
    private formBuilder: FormBuilder,
    private schedulerService: SchedulerService,
    private datePipe: DatePipe,
    private router: Router,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      {
        label: 'Appointment List',
        url: 'Appointment/list'
      }
    ]);
    const userId = this.authService.getUserId();
    this.breadcrumbService.setVisible(true);
    this.dateFormatService.initializeDateFormat(userId);
    window.addEventListener('dateFormatChanged', () => {
    this.refreshDateFormats();
  });
    this.initializeAppointmentForm();
    this.loadDropdowns();
    this.initializeColumnDefs();
    this.getAppointments();
    this.getAllTherapist();
    this.getItems();
    this.getServiceDropdown();

    this.schedulerService.availabilityStatus$.subscribe((response) => {
      if (response) {
        // console.log("response", response);
        const matchedTherapist = this.therapistList.find(
          (therapist) => therapist.name === response.userName
        );

        this.appointmentForm.patchValue({
          therapistInput: matchedTherapist?.id ?? '',
          date: response.date,
          startTime: response.startTime,
          endTime: response.endTime
        });

        // console.log("this.appointmentForm.value", this.appointmentForm.value);

        if (matchedTherapist) {
          this.generateTimeSlotsForSelectedTherapist();
        }
      }
    });

    this.fetchDropdownOptions('AppointmentType');
    this.fetchDropdownOptions('MeetingType');
    this.fetchAllPatients();

    this.appointmentForm.get('patientId')?.valueChanges.subscribe((patientId: string) => {
      this.selectedPatient = this.PatientsListOptions.find(p => p.id === patientId);
      this.insuranceList = this.selectedPatient?.insurances || [];
      this.selectedInsurance = null;
      if (this.selectedPatient?.slidingScaleId) {
        this.appointmentForm.patchValue({ slidingScaleId: this.selectedPatient.slidingScaleId });
        this.selectedSlidingScaleId = this.selectedPatient.slidingScaleId;
        this.recalculateInsuranceClaim();
      }
    });
  }

  private initializeColumnDefs(): void {
    this.columnDefs = [
      { field: 'patientName', headerName: 'Patient Name', sortable: true, filter: true },
      { field: 'therapistName', headerName: 'Therapist', sortable: true, filter: true },
      { 
        field: 'date', 
        headerName: 'Date', 
        sortable: true, 
        filter: true,
        valueFormatter: (params: any) => this.formatDateForGrid(params.value)
      },
      { 
        field: 'startTime', 
        headerName: 'Start Time', 
        sortable: true, 
        filter: true,
        valueFormatter: (params: any) => this.formatTimeTo12Hour(params.value)
      },
      { 
        field: 'endTime', 
        headerName: 'End Time', 
        sortable: true, 
        filter: true,
        valueFormatter: (params: any) => this.formatTimeTo12Hour(params.value)
      },
      { field: 'appointmentStatus', headerName: 'Appointment Status', sortable: true, filter: true },
      { field: 'meetingType', headerName: 'Meeting Type', sortable: true, filter: true },
      {
        headerName: 'Actions',
        field: 'actions',
        flex: 1,
        filter: false,
        pinned: 'right',
        cellRenderer: (params: any) => {
          return `
            <div class="flex gap-2">
              <button class="text-primary-border-color  hover:underline" data-action="edit">
                <i class="fa fa-edit"></i>
              </button>
              <button class="text-primary-border-color  hover:underline" data-action="delete">
                <i class="fa fa-trash"></i>
              </button>
            </div>
          `;
        },
      }
    ];
  }

  private formatDateForGrid(dateString: string): string {
    return this.dateFormatService.formatDate(dateString);
  }

  formatTimeTo12Hour(timeString: string): string {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = minutes || '00';
    const period = hour >= 12 ? 'PM' : 'AM';
    const twelveHour = hour % 12 || 12;
    return `${twelveHour}:${minute} ${period}`;
  }

  onQuickFilterChanged(): void {
    if (this.gridApi) {
      const value = this.searchValue?.trim() || '';

      this.gridApi.setGridOption('quickFilterText', value);

      // Wait for filter to apply
      setTimeout(() => {
        if (this.gridApi.getDisplayedRowCount() === 0) {
          this.gridApi.showNoRowsOverlay();
        } else {
          this.gridApi.hideOverlay();
        }
      });
    }
  }

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  onGridReady(params: GridReadyEvent) {
    params.api.sizeColumnsToFit();
  }

gridOptions: any = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  paginationPageSize: this.paginationPageSize, 
  paginationPageSizeSelector: this.paginationPageSizeSelector, 
  suppressPaginationPanel: false,
  suppressScrollOnNewData: true,
  overlayNoRowsTemplate: 
  `<div style="padding: 20px; font-size: 16px; color: #6b7280;">
      No appointments found
    </div>`,
  
  localeText: {
    pageSizeLabel: 'Page Size:',
    page: 'Page',
    to: 'to',
    of: 'of',
    nextPage: 'Next',
    lastPage: 'Last',
    firstPage: 'First',
    previousPage: 'Previous',
    more: '...',
    totalRows: 'Total Rows',
  },
  
  onGridReady: (params: any) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    
    params.api.sizeColumnsToFit();
    
    setTimeout(() => {
      params.api.refreshHeader();
      params.api.refreshCells();
    }, 100);
  },
  onFirstDataRendered: (params: any) => {
    params.api.refreshHeader();
  }
};

  public fb = inject(FormBuilder);

  getAllTherapist() {
    this.authService.getTherapistList().subscribe(res => {
      this.therapistList = res;
    });
  }

  scheduleForm: FormGroup = this.fb.group({
    appointmentType: [AppointmentType.THERAPY_SESSION, Validators.required],
    title: [''],
    notes: [''],
    meetingTypeInput: ['']
  });

  closeScheduleModal(): void {
    this.showScheduleModal.set(false);
    this.selectedPatientView.set(null);
    this.scheduleForm.reset();
  }

  GetAppointmentsList: any[] = [];

  getAppointments(): void {
    const userRole = this._authservice.getUserRole();

    if (userRole === 'Admin') {
      this._adminservice.GetAppointments().subscribe({
        next: (response) => {
          this.rowData = response.data;
          this.GetAppointmentsList = response.data;
        },
        error: (error) => {
          console.error('Error fetching admin appointments:', error);
        }
      });
    } else {
      this._adminservice.GetAppointmentsTherapist().subscribe({
        next: (response) => {
          this.rowData = response.data;
          this.GetAppointmentsList = response.data;
        },
        error: (error) => {
          console.error('Error fetching therapist appointments:', error);
        }
      });
    }
  }

  get_id: any;

  onCellClicked(event: any): void {
    if (event.colDef.field !== 'actions') return;
    
    this.get_id = event.data.id;
    const clickedEl = event.eventPath?.[0] || event.target;
    
    if (!this.get_id || !clickedEl) return;
    
    const action = clickedEl.getAttribute('data-action') || 
                  clickedEl.parentElement?.getAttribute('data-action');
    
    if (action === 'edit') {
      this.onEdit();
    } else if (action === 'delete') {
      this.openDeleteModal(event.data);
    }
  }

  selectedAppointment = signal<any | null>(null);
  isEditMode = signal(false);

  public serviceIds: any = [];
  selectedChiefComplaints = signal<any[]>([]);



private patchFormData(data: any): void {
  const formattedDate = this.formatDateForInput(data.date);
  const formattedStartTime = this.formatTimeForInput(data.startTime);
  const formattedEndTime = this.formatTimeForInput(data.endTime);
  
  const meetingTypeId = data.meetingTypeId?.toString(); // Convert to string
  
  // Check if the meeting type ID exists in the options
  const meetingTypeExists = this.meetingTypeOptions.some(opt => opt.id === meetingTypeId);
  // console.log(`Meeting type ID ${meetingTypeId} exists in options: ${meetingTypeExists}`);
  
  this.appointmentForm.patchValue({
    date: formattedDate,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    notes: data.notes || '',
    therapistInput: data.userId || data.therapistId || '',
    appointmentTypeInput: data.appointmentTypeId || '',
    meetingTypeInput: meetingTypeId || '', // Use string value
    appointmentStatusInput: data.appointmentStatusId?.toString() || '',
    patientId: data.patientId || '',
    ServiceInput: data.services?.[0]?.serviceId || '',
    chiefComplaintInput: data.chiefComplaints?.[0]?.id || '',
    repeat: data.repeat || false,
    repeatEvery: data.repeatEvery || 1,
    repeatPeriod: data.repeatPeriod || 'Day',
    endDate: data.endDate ? this.formatDateForInput(data.endDate) : '',
    repeatDays: data.repeatDays || [],
    units: data.services?.[0]?.units || 1,
    chargeAmount: data.services?.[0]?.chargeAmount
  });

  // console.log("Form values after patch:", this.appointmentForm.value);
  // console.log("Meeting type form value:", this.appointmentForm.get('meetingTypeInput')?.value);
  
  this.show = true;
}

// private patchFormData(data: any): void {
//   const formattedDate = this.formatDateForInput(data.date);
//   const formattedStartTime = this.formatTimeForInput(data.startTime);
//   const formattedEndTime = this.formatTimeForInput(data.endTime);
  
//   const meetingTypeId = data.meetingTypeId?.toString(); // Convert to string
  
//   // Check if the meeting type ID exists in the options
//   const meetingTypeExists = this.meetingTypeOptions.some(opt => opt.id === meetingTypeId);
//   console.log(`Meeting type ID ${meetingTypeId} exists in options: ${meetingTypeExists}`);
  
//   this.appointmentForm.patchValue({
//     date: formattedDate,
//     startTime: formattedStartTime,
//     endTime: formattedEndTime,
//     notes: data.notes || '',
//     therapistInput: data.userId || data.therapistId || '',
//     appointmentTypeInput: data.appointmentTypeId || '',
//     meetingTypeInput: meetingTypeId || '', // Use string value
//     appointmentStatusInput: data.appointmentStatusId?.toString() || '',
//     patientId: data.patientId || '',
//     ServiceInput: data.services?.[0]?.serviceId || '',
//     chiefComplaintInput: data.chiefComplaints?.[0]?.id || '',
//     repeat: data.repeat || false,
//     repeatEvery: data.repeatEvery || 1,
//     repeatPeriod: data.repeatPeriod || 'Day',
//     endDate: data.endDate ? this.formatDateForInput(data.endDate) : '',
//     repeatDays: data.repeatDays || [],
//     units: data.services?.[0]?.units || 1,
//     chargeAmount: data.services?.[0]?.chargeAmount
//   });

//   console.log("Form values after patch:", this.appointmentForm.value);
//   console.log("Meeting type form value:", this.appointmentForm.get('meetingTypeInput')?.value);
  
//   this.show = true;
// }

  updateAppointmentWithTransaction(appointmentId: string, data: any) {
    return this._service.updateAppointmentWithTransaction(appointmentId, data);
  }

onUpdateAppointment(): void {
    if (this.appointmentForm.invalid) {
      this.toastr.error('Please fill all required fields correctly');
      this.markFormGroupTouched(this.appointmentForm);
      return;
    }

    if (!this.selectedAppointment()?.id) {
      this.toastr.error('No appointment selected for update');
      return;
    }

    try {
      const formVal = this.appointmentForm.value;
      const selectedDate = new Date(formVal.date);

      const toISOStringWithTime = (date: Date, timeStr: string): string => {
        if (!timeStr) return '';
        
        try {
          let hours: number, minutes: number;
          
          if (timeStr.includes(' ')) {
            const [time, modifier] = timeStr.split(' ');
            [hours, minutes] = time.split(':').map(Number);
            
            if (modifier === 'PM' && hours !== 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
          } else {
            [hours, minutes] = timeStr.split(':').map(Number);
          }

          const dateTime = new Date(date);
          dateTime.setHours(hours, minutes, 0, 0);
          
          return dateTime.toISOString();
        } catch (error) {
          console.error('Error converting time:', error);
          return '';
        }
      };

      const diagnosesPayload = (this.selectedDiagnoses && this.selectedDiagnoses.length > 0) 
        ? this.selectedDiagnoses.map(diagnosis => ({
            diagnosisId: diagnosis.id,
            isPrimary: diagnosis.isPrimary || false
          }))
        : (this.selectedAppointment()?.diagnoses?.map((d: any) => ({
            diagnosisId: d.diagnosisId || d.id,
            isPrimary: d.isPrimary || false
          })) || []);

      // Prepare chief complaints payload - corrected structure
      const chiefComplaintIds = formVal.chiefComplaintInput ? 
        [Number(formVal.chiefComplaintInput)] : [];

      const serviceIds = formVal.ServiceInput
        ? [formVal.ServiceInput] 
        : this.serviceIds;

      const updatePayload = {
        patientId: this.selectedAppointment()?.patientId || formVal.patientId,
        userId: formVal.therapistInput || this.selectedAppointment()?.userId,
        date: selectedDate.toISOString(),
        startTime: toISOStringWithTime(selectedDate, formVal.startTime),
        endTime: toISOStringWithTime(selectedDate, formVal.endTime),
        meetingTypeId: Number(formVal.meetingTypeInput) || this.selectedAppointment()?.meetingTypeId || 0,
        appointmentStatusId: Number(formVal.appointmentStatusInput) || this.selectedAppointment()?.appointmentStatusId || 0,
        notes: formVal.notes || this.selectedAppointment()?.notes || '',
        repeat: formVal.repeat || this.selectedAppointment()?.repeat || false,
        repeatEvery: formVal.repeatEvery || this.selectedAppointment()?.repeatEvery || 0,
        repeatPeriod: formVal.repeatPeriod || this.selectedAppointment()?.repeatPeriod || 'Day',
        endDate: formVal.endDate ? new Date(formVal.endDate).toISOString() : this.selectedAppointment()?.endDate || null,
        repeatDays: formVal.repeatDays || this.selectedAppointment()?.repeatDays || [],
        serviceIds: serviceIds,
        diagnoses: diagnosesPayload,
        chiefComplaintIds: chiefComplaintIds // Corrected property name and structure
      };

      // console.log('Update Appointment Payload:', JSON.stringify(updatePayload, null, 2));

      this.updateAppointmentWithTransaction(this.selectedAppointment()?.id, updatePayload).subscribe(
        (res: any) => {
          if (res) {
            this.toastr.success('Appointment updated successfully!');
            this.closeModal();
            this.getAppointments();
          } else {
            this.toastr.error(res?.message || 'Failed to update appointment');
          }
        },
        (err: any) => {
          console.error('Error updating appointment:', err);
          if (err.error) {
            console.error('Error details:', err.error);
          }
          if (err.error && err.error.message) {
            this.toastr.error(err.error.message);
          } else if (err.message) {
            this.toastr.error(err.message);
          } else {
            this.toastr.error('Failed to update appointment');
          }
        }
      );

    } catch (error: any) {
      console.error('Error in onUpdateAppointment:', error);
      this.toastr.error('An unexpected error occurred while preparing update');
    }
  }

  appointmentToDelete = signal<any>(null);
  openDeleteModal(appointment: any): void {
    this.appointmentToDelete.set(appointment);
    this.showDeleteModal.set(true);
  }

  private initializeAppointmentForm(): void {
    this.appointmentForm = this.formBuilder.group({
      therapistInput: [null],
      appointmentTypeInput: [''],
      patientId: [''],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      meetingTypeInput: [''],
      appointmentStatusInput: [''],
      ServiceInput: [''],
      chiefComplaintInput: [''], // Add chief complaint form control
      repeatEvery: [1],
       chargeAmount: [{ value: '', disabled: true }],
      repeatPeriod: ['Day'],
      endDate: [''],
      repeat: [false],
      repeatDays: this.formBuilder.array([]),
      notes: [''],
      slidingScaleId: [''],
      units:['']
    });
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return '';
    }
  }

  private formatTimeForInput(timeString: string): string {
    if (!timeString) return '';
    
    try {
      if (timeString.includes(' ')) {
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let displayHours = hours;
        if (period === 'PM' && hours < 12) displayHours += 12;
        if (period === 'AM' && hours === 12) displayHours = 0;
        
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else {
        return timeString.substring(0, 5);
      }
    } catch (error) {
      console.error('Error formatting time:', error, timeString);
      return '';
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal() {
    this.appointmentForm.reset();
    this.selectedAppointment.set(null);
    this.isEditMode.set(false);
    this.show = false;
  }

  onStartTimeChange(): void {
    const startTime = this.appointmentForm.get('startTime')?.value;
    if (!startTime) return;

    const startMoment = moment(startTime, 'hh:mm A');
    const endMoment = startMoment.clone().add(30, 'minutes');
    const formattedEnd = endMoment.format('hh:mm A');

    this.availableEndTimes = [formattedEnd];
    this.appointmentForm.get('endTime')?.setValue(formattedEnd);
  }

fetchDropdownOptions(category: string): void {
  // console.log(`Fetching dropdown for category: ${category}`);
  
  this.schedulerService.getDropdownsByCategory(category).subscribe({
    next: (options: any[]) => {
      // console.log(`API response for ${category}:`, options);
      
      // if (!options || options.length === 0) {
      //   console.warn(`No options returned for ${category}`);
      //   return;
      // }
      
      const mappedOptions = options.map((item) => ({
        id: item.id?.toString() || '',
        value: item.name || item.value || item.text || item.label || item.description || 'Unknown',
      }));

      // console.log(`Mapped options for ${category}:`, mappedOptions);

      if (category === 'AppointmentType') {
        this.appointmentTypeOptions = mappedOptions;
      } else if (category === 'MeetingType') {
        this.meetingTypeOptions = mappedOptions;
        // console.log(`MeetingTypeOptions set with ${mappedOptions.length} items`);
      }
    },
    error: (error) => {
      console.error(`Error fetching ${category}:`, error);
    }
  });
}

  fetchAllPatients(): void {
    this.schedulerService.getAllPatientsList().subscribe((patients: any) => {
      this.PatientsListOptions = patients.data.patients;
      // console.log("PatientsListOptions", this.PatientsListOptions);
    });
  }

  therapist: any;
  generateTimeSlotsForSelectedTherapist() {
    const selectedId = this.appointmentForm.get('therapistInput')?.value;
    this.therapist = this.therapistList.find((t) => t.id === selectedId);

    if (this.therapist) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedForInput = `${yyyy}-${mm}-${dd}`;

      this.appointmentForm.patchValue({ date: formattedForInput });

      if (this.therapist.availableFrom && this.therapist.availableTo) {
        this.generateTimeSlots(this.therapist.availableFrom, this.therapist.availableTo);
      } else {
        this.availableStartTimes = [];
        this.availableEndTimes = [];
      }
    } else {
      this.availableStartTimes = [];
      this.availableEndTimes = [];
    }
  }


  onEdit() {
  this._adminservice.GetAppointmentsById(this.get_id).subscribe((res: any) => {
    // console.log("Full API response:", res);
    
    let data: any;
    
    if (Array.isArray(res)) {
      data = res[0];
    } else if (res && res.data) {
      data = Array.isArray(res.data) ? res.data[0] : res.data;
    } else if (res) {
      data = res;
    } else {
      console.error("Invalid response format:", res);
      return;
    }
    
 
    
    this.selectedAppointment.set(data);
    this.isEditMode.set(true);
    
    const formattedDate = this.formatDateForInput(data.date);
    const formattedStartTime = this.formatTimeForInput(data.startTime);
    const formattedEndTime = this.formatTimeForInput(data.endTime);
    
    this.serviceIds = data.services?.map((s: any) => s.id) || [];

    // // **DEBUG: Check what meetingTypeOptions currently has**
    // console.log("Current meetingTypeOptions:", this.meetingTypeOptions);
    // console.log("Current meetingTypeOptions length:", this.meetingTypeOptions.length);
    
    if (this.meetingTypeOptions.length === 0) {
      // console.log("Meeting types empty, loading from API...");
      
      this.schedulerService.getDropdownsByCategory('Meeting Type').subscribe({
        next: (options) => {
          // console.log("RAW meeting type API response:", options);
          
          // if (!options || options.length === 0) {
          //   console.error("API returned empty options for MeetingType");
          //   return;
          // }
          
          // Convert options
          this.meetingTypeOptions = options.map((item) => ({
            id: item.id?.toString() || '', // Force string
            value: item.name || item.value || item.text || item.label || item.description || 'No name',
          }));
          
          // console.log("Processed meetingTypeOptions:", this.meetingTypeOptions);
          // console.log("Looking for ID '70' in options:", 
          //   this.meetingTypeOptions.find(opt => opt.id === '70'));
          
          // NOW patch the form
          this.patchFormWithMeetingTypes(data, formattedDate, formattedStartTime, formattedEndTime);
        },
        error: (error) => {
          console.error("Error loading meeting types:", error);
          // Still try to patch form
          this.patchFormWithMeetingTypes(data, formattedDate, formattedStartTime, formattedEndTime);
        }
      });
    } else {
      // console.log("Meeting types already loaded, patching form...");
      this.patchFormWithMeetingTypes(data, formattedDate, formattedStartTime, formattedEndTime);
    }
    
  }, error => {
    console.error("Error fetching appointment:", error);
    this.toastr.error('Failed to load appointment details');
  });
}

private patchFormWithMeetingTypes(
  data: any, 
  formattedDate: string, 
  formattedStartTime: string, 
  formattedEndTime: string
): void {
  const meetingTypeId = data.meetingTypeId?.toString(); 
  
  // console.log("Patching form with meetingTypeId:", meetingTypeId);
  // console.log("Available meetingTypeOptions during patch:", this.meetingTypeOptions);
  
  this.appointmentForm.patchValue({
    date: formattedDate,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    notes: data.notes || '',
    therapistInput: data.userId || data.therapistId || '',
    appointmentTypeInput: data.appointmentTypeId || '',
    meetingTypeInput: meetingTypeId || '', // String value
    appointmentStatusInput: data.appointmentStatusId?.toString() || '',
    patientId: data.patientId || '',
    ServiceInput: data.services?.[0]?.serviceId || '',
    chiefComplaintInput: data.chiefComplaints?.[0]?.id || '',
    repeat: data.repeat || false,
    repeatEvery: data.repeatEvery || 1,
    repeatPeriod: data.repeatPeriod || 'Day',
    endDate: data.endDate ? this.formatDateForInput(data.endDate) : '',
    repeatDays: data.repeatDays || [],
    units: data.services?.[0]?.units || 1,
    chargeAmount: data.services?.[0]?.chargeAmount
  });

  // console.log("Form meetingTypeInput value AFTER patch:", 
  
  
  this.show = true;
}

  parseTime(date: string, time: string): Date {
    const [hour, minute] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setHours(hour, minute, 0, 0);
    return dt;
  }

  getSlidingScaleDiscount(): number {
    if (!this.selectedSlidingScaleId) {
      console.warn('No sliding scale selected');
      return 0;
    }

    const selectedScale = this.slidingScalesList.find((scale: any) => scale.id === this.selectedSlidingScaleId);

    if (!selectedScale) {
      console.warn('Selected scale not found in list');
      return 0;
    }

    const discount = selectedScale.discountPercentage || 0;
    return parseFloat(discount.toFixed(1));
  }

  recalculateInsuranceClaim(): void {
    let slidingDiscount = 0;
    const selectedScale = this.slidingScalesList.find((scale: any) => scale.id === this.selectedSlidingScaleId);

    if (selectedScale) {
      slidingDiscount = (this.totalAmount * selectedScale.discountPercentage) / 100;
    }

    if (this.selectedInsurance) {
      const calculatedInsuranceClaim = this.totalAmount - (this.copayAmount || 0) - slidingDiscount;
      this.insuranceClaimAmount = Math.max(0, parseFloat(calculatedInsuranceClaim.toFixed(2)));
      this.patientPaysAmount = 0;
    } else {
      const patientTotal = this.totalAmount - slidingDiscount;
      this.patientPaysAmount = Math.max(0, parseFloat(patientTotal.toFixed(2)));
      this.insuranceClaimAmount = 0;
      this.copayAmount = 0;
      this.selectedInsurance = null;
    }

    this.updateTransactionNotes();
  }

  updateTransactionNotes(): void {
    if (this.selectedInsurance) {
      this.transactionNotes = (this.insuranceClaimAmount > 0 || this.copayAmount > 0)
        ? 'Partially covered by insurance'
        : 'Fully paid by patient';
    } else {
      this.transactionNotes = (this.patientPaysAmount > 0)
        ? 'Paid by patient'
        : '';
    }
  }

  setTab(tab: string) {
    this.selectedTab = tab;
  }

  get repeatDaysArray(): FormArray {
    return this.appointmentForm.get('repeatDays') as FormArray;
  }

  onInsuranceToggle(event: any) {
    this.useInsurance = event.target.checked;
    if (this.useInsurance) {
      const patientId = this.appointmentForm.get('patientId')?.value;
      if (patientId) {
        this.selectedPatient = this.PatientsListOptions.find(p => p.id === patientId);
        this.insuranceList = this.selectedPatient?.insurances || [];
        if (this.insuranceList.length > 0) {
          this.selectedInsuranceId = this.insuranceList[0].id;
          this.selectedInsurance = this.insuranceList[0];
          this.copayAmount = this.selectedInsurance.coPay || 0;
        }
      }
    } else {
      this.selectedInsuranceId = null;
      this.selectedInsurance = null;
      this.insuranceClaimAmount = 0;
      this.copayAmount = 0;
    }
    this.recalculateInsuranceClaim();
  }

  onInsuranceChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedInsuranceId = target.value;
    this.selectedInsurance = this.insuranceList.find(ins => ins.id === selectedInsuranceId);

    if (this.selectedInsurance) {
      this.copayAmount = this.selectedInsurance.coPay || 0;
      this.recalculateInsuranceClaim();
      this.updateTransactionNotes();
    }
  }

  toggleRepeatDay(day: string) {
    const index = this.repeatDaysArray.value.indexOf(day);
    if (index > -1) {
      this.repeatDaysArray.removeAt(index);
    } else {
      this.repeatDaysArray.push(this.formBuilder.control(day));
    }
  }

  isDaySelected(day: string): boolean {
    return this.repeatDaysArray.value.includes(day);
  }

  generateTimeSlots(start: string, end: string) {
    const result: string[] = [];
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let current = new Date(2000, 0, 1, startHour, startMin);
    const endDate = new Date(2000, 0, 1, endHour, endMin);

    while (current <= endDate) {
      const formatted = moment(current).format('hh:mm A');
      result.push(formatted);
      current.setMinutes(current.getMinutes() + 30);
    }

    this.availableStartTimes = result.slice(0, -1);
    this.availableEndTimes = result.slice(1);
  }

  onSubmit() {
    // Your existing submit logic
  }

  isBooking = signal(false);
  public _authservice = inject(AuthService);
  public dropdownService = inject(DropdownService);
  currentUser: any = this._authservice.getUserRole();
  currentDate = signal(new Date());
  isClientAdmin = computed(() => this.currentUser === UserRole.CLIENT_ADMIN);

  onSubmitSchedule(): void {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes <= 30 ? 30 : 0;
    const addHour = minutes > 30 ? 1 : 0;

    const slotStart = new Date(now);
    slotStart.setMinutes(roundedMinutes);
    slotStart.setSeconds(0);
    slotStart.setMilliseconds(0);
    slotStart.setHours(slotStart.getHours() + addHour);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + 30);

    const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    const slotString = `${slotStart.toLocaleTimeString([], options)} - ${slotEnd.toLocaleTimeString([], options)}`;

    const appointmentData = {
      ...this.scheduleForm.value,
      appointmentSlot: {
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        display: slotString
      }
    };

    this._adminservice.saveAppointmentWithTransaction(appointmentData).subscribe({
      next: (res) => {
        if (res) {
          this.toastr.success('Saved successfully');
          this.showScheduleModal.set(false);
        } else {
          this.toastr.error('Save failed');
        }
      },
      error: () => {
        this.toastr.error('Save failed');
      }
    });
  }

  appointmentTypeList: any[] = [];
  getItems() {
    this.dropdownService.getItems().subscribe((res) => {
      this.appointmentTypeList = res;
      // console.log("res", res);
    });
  }

  public formatDate(dateString: string): string {
    return this.dateFormatService.formatDate(dateString);
  }

  showDeleteModal = signal(false);
  patientToDelete = signal<any>(null);
  isDeleting = signal(false);

  confirmDelete(): void {
    const appointment = this.appointmentToDelete();
    if (!appointment) {
      this.toastr.error('No appointment selected for deletion');
      return;
    }

    this.isDeleting.set(true);

    this._adminservice.DeleteAppointmentById(appointment.id).subscribe({
      next: (res: any)=>{
        this.isDeleting.set(false);
        
        if (res) {
          this.toastr.success('Appointment deleted successfully');
          this.getAppointments();
          this.closeDeleteModal();
        } else {
          this.toastr.error(res?.message || 'Failed to delete appointment');
        }
      },
      error: (error: any)=>{
        this.isDeleting.set(false);
        console.error('Delete appointment error:', error);
        this.toastr.error(error.message || 'Error occurred while deleting appointment');
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.patientToDelete.set(null);
    this.isDeleting.set(false);
  }

  deletePatient(): void {
    this.isDeleting.set(true);

    this._adminservice.DeleteAppointmentWithTransaction(this.get_id).subscribe({
      next: (res: any)=>{
        this.isDeleting.set(false);
        this.toastr.success(res.message || 'Patient deleted successfully');
        this.getAppointments();
        this.closeDeleteModal();
      },
      error: (err: any)=>{
        this.isDeleting.set(false);
        console.error('Delete patient error:', err);
        const errorMessage = err.error?.message || 'Error occurred while deleting patient';
        this.toastr.error(errorMessage);
      }
    });
  }

  formatDeleteDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return this.dateFormatService.formatDate(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }

  formatDeleteTime(timeString: string): string {
    if (!timeString) return 'Unknown time';
    try {
      if (timeString.includes(' ')) {
        return timeString;
      } else {
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  }

  showScheduleModal = signal(false);
  refreshDateFormats(): void {
    if (this.gridApi) {
      this.gridApi.refreshCells();
    }
  }

  serviceDropdown: any[] = [];
  chargeAmount: number = 0;
  units: number = 1;
  modifier: string | null = null;

  getServiceDropdown() {
    var get_Client_id: any = this._authservice.getClientId();
    this.dropdownService.GetServiceItemS(get_Client_id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.serviceDropdown = res.data;
          // console.log("serviceDropdown loaded successfully", this.serviceDropdown);
        } else {
          console.error("Failed to load services:", res.message);
          this.serviceDropdown = [];
        }
      },
      error: (error) => {
        console.error("Error loading services:", error);
        this.serviceDropdown = [];
      }
    });
  }

   chiefComplaints: any[] = [];
loadDropdowns(): void {
    this._adminservice.getChiefComplaintdata().subscribe({
      next: (data:any) => this.chiefComplaints = data,
      error: (err:any) => console.error('Failed to load blood groups', err)
    });
  }
}