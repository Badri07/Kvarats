import {Component,Input,Output,EventEmitter,OnInit,OnChanges,SimpleChanges,inject,signal,computed} from '@angular/core';
import {FormBuilder,FormGroup,Validators,FormArray} from '@angular/forms';
import {SchedulerClickEvent,AppointmentTypeOption,PatientOption,MeetingTypeOption, User} from '../../../models/scheduler';
import { SchedulerService } from '../../../service/scheduler/scheduler.service';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../../service/admin/admin.service';
import { TosterService } from '../../../service/toaster/tostr.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../service/auth/auth.service';
import { UserRole } from '../../../models/availability-user.model.interface';
import { DropdownService } from '../../../service/therapist/dropdown.service';
import { AppointmentEditEvent } from '../../../models/scheduler.interface';
import { AppointmentService } from '../../Billing/services/patient.service';

@Component({
  selector: 'app-scheduler-header',
  templateUrl: './scheduler-header.component.html',
  styleUrls: ['./scheduler-header.component.scss'],
  standalone: false,
  providers: [DatePipe]
})
export class SchedulerHeaderComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() schedulerEvent: SchedulerClickEvent | AppointmentEditEvent | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

  selectedTherapist = signal<any | null>(null);
  currentDate = signal(new Date());

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
  availableEndTimes: string[] = [];
  appointmentTypeOptions: AppointmentTypeOption[] = [];
  meetingTypeOptions: MeetingTypeOption[] = [];
  PatientsListOptions: PatientOption[] = [];

  // Transaction tab properties
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

  // Calendar popup edit
  isEditMode = false;
  editingAppointmentId: string | null = null;
  
  public _service = inject(AdminService);
  public _authservice = inject(AuthService);
  public toastr = inject(TosterService);
  
  constructor(
    private formBuilder: FormBuilder,
    private schedulerService: SchedulerService,
    private datePipe: DatePipe,
    private router: Router,
    private adminservice: AdminService,
  ) {}

  private sub!: Subscription;
  modalData: any;
  currentUser: any = this._authservice.getUserRole();
  isClientAdmin = computed(() => this.currentUser === UserRole.CLIENT_ADMIN);
  
  ngOnInit() {
    this.getServiceDropdown();
    this.loadDropdowns();
    this.fetchDropdownOptions('Appointment Type');

    this.schedulerService.getTherapistList().subscribe((list) => {
      this.therapistList = list;
    });

    // Initialize form
    this.appointmentForm = this.formBuilder.group({
      therapistInput: ['', Validators.required],
      chiefComplaintId: ['', Validators.required],
      patientId: ['', Validators.required],
      title: [''],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      meetingTypeInput: ['', Validators.required],
      ServiceInput: ['', Validators.required],
      diagnosisInput: [''],
      repeatEvery: [1],
      repeatPeriod: ['Day'],
      endDate: [''],
      repeat: [false],
      repeatDays: this.formBuilder.array([]),
      notes: [''],
    });

    // Availability subscription for slot clicks
    this.schedulerService.availabilityStatus$.subscribe(resp => {
      if (!resp || this.isEditMode) return;

      const data = resp.data ?? resp;

      // Find therapist by name
      const fullName = data.userName?.trim().toLowerCase();
      const matchedTherapist = this.therapistList.find(t => {
        const therapistFullName = `${t.firstName || ''} ${t.lastName || ''}`.trim().toLowerCase();
        return therapistFullName === fullName;
      });

      // Format time for form
      const formatTimeForForm = (timeStr: string): string => {
        if (!timeStr) return '';
        
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [timePart, period] = timeStr.split(' ');
          let [hours, minutes] = timePart.split(':').map(Number);
          const displayHours = hours % 12 || 12;
          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
        
        const timeParts = timeStr.split(':');
        if (timeParts.length !== 2) return '';
        
        let hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        if (isNaN(hours) || isNaN(minutes)) return '';
        
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      };

      const formattedStartTime = formatTimeForForm(data.startTime);
      const formattedEndTime = formatTimeForForm(data.endTime);

      // Patch the form with the times from slot click
      this.appointmentForm.patchValue({
        therapistInput: matchedTherapist?.id ?? null,
        date: data.date,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      }, { emitEvent: false });

      // If therapist is selected, generate available time slots
      if (matchedTherapist?.id) {
        this.generateTimeSlotsForTherapistId(matchedTherapist.id);
      }

      // Add clicked time to available times
      setTimeout(() => {
        const currentStartTime = this.appointmentForm.get('startTime')?.value;
        if (currentStartTime && !this.availableStartTimes.includes(currentStartTime)) {
          this.availableStartTimes = [currentStartTime, ...this.availableStartTimes];
        }
      }, 100);
    });

    this.fetchDropdownOptions('Meeting Type');
    this.getItems();

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

  // Generate time slots by therapist ID
  generateTimeSlotsForTherapistId(therapistId: string, done?: () => void) {
    this.adminservice.getAvailabilityByUser(therapistId).subscribe(res => {
      this.selectedTherapistAvailability = res;
      this.onDateChange();
    });

    this.fetchAllPatients(therapistId, done);
  }

  setTab(tab: string) {
    this.selectedTab = tab;
  }  

  ensureTimeSlotsAvailable() {
    if (this.availableStartTimes.length === 0) {
      this.generateTimeSlots('09:00', '17:00');
    }
  }

  onNext() {
    this.selectedTab = 'transactions';
  }

  fetchDropdownOptions(category: string): void {
    this.schedulerService
      .getDropdownsByCategory(category)
      .subscribe((options: any[]) => {
        const mappedOptions = options.map((item: any) => ({
          id: item.id,
          value: item.description || item.value || item.text || item.label,
        }));

        if (category === 'Appointment Type') {
          this.appointmentTypeOptions = mappedOptions;
        } else if (category === 'Meeting Type') {
          this.meetingTypeOptions = mappedOptions;
        }
      });
  }

  currentPage = 1;
  paginationPageSize = 25;

  fetchAllPatients(therapistId: string, done?: () => void): void {
    this.adminservice.getPatientsByTherapist(therapistId).subscribe({
      next: (patients: any[]) => {
        this.PatientsListOptions = patients || [];
        if (done) done();
      },
      error: () => {
        this.PatientsListOptions = [];
      }
    });
  }

  generateTimeSlots(start: string, end: string) {
    const normalizeTime = (timeStr: string): string => {
      if (!timeStr) return '';

      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }

      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }

      return timeStr;
    };

    const normalizedStart = normalizeTime(start);
    const normalizedEnd = normalizeTime(end);

    if (!normalizedStart || !normalizedEnd) {
      this.availableStartTimes = [];
      this.availableEndTimes = [];
      return;
    }

    const convertTo12Hour = (time24: string): string => {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const result: string[] = [];

    try {
      const [startHour, startMin] = normalizedStart.split(':').map(Number);
      const [endHour, endMin] = normalizedEnd.split(':').map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const time24 = `${currentHour.toString().padStart(2, '0')}:${currentMin
          .toString()
          .padStart(2, '0')}`;
        const time12 = convertTo12Hour(time24);
        result.push(time12);

        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }

      this.availableStartTimes = result;

      const patchedStart = this.appointmentForm.get('startTime')?.value;
      if (patchedStart && !this.availableStartTimes.includes(patchedStart)) {
        this.availableStartTimes.unshift(patchedStart);
      }

      this.availableEndTimes = result.map(startTime => {
        const [time, period] = startTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        minutes += 30;
        if (minutes >= 60) {
          minutes = 0;
          hours += 1;
        }

        const endPeriod = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${endPeriod}`;
      });

    } catch (error) {
      this.availableStartTimes = [];
      this.availableEndTimes = [];
    }
  }

  calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal() {
  this.appointmentForm.reset();
  this.isEditMode = false;
  this.editingAppointmentId = null;
  this.show = false;
  this.close.emit();
}

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  getTodayDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  chiefComplaints: any[] = [];
  loadDropdowns(): void {
    this.adminservice.getChiefComplaintdata().subscribe({
      next: (data: any) => this.chiefComplaints = data,
      error: (err: any) => console.error('Failed to load chief complaints', err)
    });
  }

  onSubmit(): void {
  if (this.appointmentForm.invalid) {
    this.markFormGroupTouched(this.appointmentForm);
    return;
  }

  const formVal = this.appointmentForm.value;
  const selectedDate = new Date(formVal.date);

  // Convert form service value (item.id) to ClientServiceId for API
  let clientServiceIdForApi = '';
  if (formVal.ServiceInput) {
    const selectedService = this.serviceDropdown.find(s => s.id === formVal.ServiceInput);
    // Use id (ClientServiceId) not serviceId
    clientServiceIdForApi = selectedService?.id || '';
  }

  const toISOStringWithTime = (date: Date, timeStr: string): string => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);

    return dateTime.toISOString();
  };

  const payload: any = {
    patientId: formVal.patientId,
    userId: formVal.therapistInput,
    date: selectedDate,
    startTime: toISOStringWithTime(selectedDate, formVal.startTime),
    endTime: toISOStringWithTime(selectedDate, formVal.endTime),
    meetingTypeId: Number(formVal.meetingTypeInput) || 0,
    chiefComplaintIds: formVal.chiefComplaintId ? [formVal.chiefComplaintId] : [],
    appointmentStatusId: Number(formVal.appointmentStatusInput) || 0,
    notes: formVal.notes,
    serviceIds: clientServiceIdForApi ? [clientServiceIdForApi] : [], // Send id, not serviceId
    repeat: formVal.repeat || false,
    repeatEvery: formVal.repeatEvery || 0,
    repeatPeriod: formVal.repeatPeriod,
    endDate: formVal.endDate ? new Date(formVal.endDate) : null,
    repeatDays: formVal.repeatDays || []
  };

  console.log('Submitting payload:', payload);
  console.log('Selected service:', this.serviceDropdown.find(s => s.id === formVal.ServiceInput));

  // Handle create vs update
  if (this.isEditMode && this.editingAppointmentId) {
    // UPDATE existing appointment
    this._service.updateAppointmentWithTransaction(this.editingAppointmentId, payload).subscribe(
      res => {
        this.toastr.success('Appointment updated successfully!');
        this.closeModal();
        this.submit.emit({ type: 'update', data: res });
      },
      err => {
        console.error('Update error:', err);
        this.toastr.error('Failed to update appointment');
      }
    );
  } else {
    // CREATE new appointment
    this._service.saveAppointmentWithTransaction(payload).subscribe(
      res => {
        this.toastr.success('Appointment created successfully!');
        this.closeModal();
        this.submit.emit({ type: 'create', data: res });
      },
      err => {
        console.error('Create error:', err);
        this.toastr.error('Failed to create appointment');
      }
    );
  }
}

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  appointmentTypeList: any[] = [];
  public dropdownService = inject(DropdownService);
  
  getItems() {
    this.dropdownService.getItems().subscribe((res) => {
      this.appointmentTypeList = res;
    });
  }

  get repeatDaysArray(): FormArray {
    return this.appointmentForm.get('repeatDays') as FormArray;
  }

  isDaySelected(day: string): boolean {
    return this.repeatDaysArray.value.includes(day);
  }

  toggleRepeatDay(day: string) {
    const index = this.repeatDaysArray.value.indexOf(day);
    if (index > -1) {
      this.repeatDaysArray.removeAt(index);
    } else {
      this.repeatDaysArray.push(this.formBuilder.control(day));
    }
  }

  getSelectedRepeatDays(): string[] {
    return this.repeatDaysArray.value;
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

  therapist: any;
  selectedTherapistAvailability: any[] = [];
  availableStartTimes: string[] = [];

  generateTimeSlotsForSelectedTherapist(event: any) {
    const selectedTherapistId = event.target.value;

    if (!selectedTherapistId) {
      this.PatientsListOptions = [];
      return;
    }

    this.generateTimeSlotsForTherapistId(selectedTherapistId);
  }

  onDateChange() {
    const selectedDate = this.appointmentForm.value.date;
    if (!selectedDate || this.selectedTherapistAvailability.length === 0) return;

    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const day = selectedDateObj.getDay();

    const dayAvailability = this.selectedTherapistAvailability.find(d => d.dayOfWeek === day);

    if (!dayAvailability || dayAvailability.isAvailable === false) {
      this.availableStartTimes = [];
      return;
    }

    // Generate all available slots
    let allSlots = this.generateSlots12Hour(
      dayAvailability.startTime,
      dayAvailability.endTime
    );

    // Filter out past times if selected date is today
    if (selectedDateObj.toDateString() === today.toDateString()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      this.availableStartTimes = allSlots.filter(slot => {
        const [timePart, period] = slot.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        
        // Convert to 24-hour for comparison
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        // Check if slot is in the future
        if (hours > currentHour) return true;
        if (hours === currentHour && minutes > currentMinute) return true;
        return false;
      });
    } else {
      this.availableStartTimes = allSlots;
    }
  }

  generateSlots12Hour(start: string, end: string): string[] {
    let slots: string[] = [];
    let [startH, startM] = start.split(':').map(Number);
    let [endH, endM] = end.split(':').map(Number);

    let time = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    while (time < endTime) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      
      const formattedTime = `${displayHours}:${displayMinutes} ${period}`;
      slots.push(formattedTime);
      time += 30;
    }
    
    return slots;
  }

  onStartTimeChange() {
    const startTime = this.appointmentForm.value.startTime;
    if (!startTime) return;

    const [timePart, period] = startTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const totalMinutes = hours * 60 + minutes + 30;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    const endPeriod = endHours >= 12 ? 'PM' : 'AM';
    const displayHours = endHours % 12 || 12;
    const endTime = `${displayHours}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
    
    this.appointmentForm.patchValue({ endTime });
  }

  parseTime(date: string, time: string): Date {
    const [hour, minute] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setHours(hour, minute, 0, 0);
    return dt;
  }

  getSlidingScaleDiscount(): number {
    if (!this.selectedSlidingScaleId) {
      return 0;
    }

    const selectedScale = this.slidingScalesList.find((scale: any) => scale.id === this.selectedSlidingScaleId);

    if (!selectedScale) {
      return 0;
    }

    const discount = selectedScale.discountPercentage || 0;
    return parseFloat(discount.toFixed(1));
  }

  onchangePatient() {
    // Implementation if needed
  }

  serviceDropdown: any[] = [];
  diagnosisDropdown: any[] = [];
  
  getServiceDropdown() {
    const clientId = this._authservice.getClientId();
    
    if (!clientId) {
      this.serviceDropdown = [];
      return;
    }
    
    this.dropdownService.GetServiceItemS(clientId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.serviceDropdown = res.data;
        } else {
          this.serviceDropdown = [];
        }
      },
      error: (error) => {
        console.error("Error loading services:", error);
        this.serviceDropdown = [];
      }
    });
  }

  getdiagnosisDropdown() {
    if (!this.selectedPatientId) {
      this.diagnosisDropdown = [];
      return;
    }

    this.dropdownService.getDiagnosis(this.selectedPatientId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.diagnosisDropdown = res.data;
        } else {
          this.diagnosisDropdown = [];
        }
      },
      error: (error) => {
        console.error("Error loading diagnoses:", error);
        this.diagnosisDropdown = [];
      }
    });
  }

  selectedPatientId: any;
  
  onSelectPatients(): void {
    this.selectedPatientId = this.appointmentForm.get('patientId')?.value;
    if (this.selectedPatientId) {
      this.getdiagnosisDropdown();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schedulerEvent'] && this.schedulerEvent) {
      this.isEditMode = false;
      this.editingAppointmentId = null;

      if ('appointmentId' in this.schedulerEvent) {
        this.isEditMode = true;
        this.editingAppointmentId = this.schedulerEvent.appointmentId;
        this.loadAppointmentForEdit(this.editingAppointmentId);
        return;
      }

      this.patchFormForCreate(this.schedulerEvent as SchedulerClickEvent);
    }
  }

  private loadAppointmentForEdit(appointmentId: string): void {
    // Clear arrays
    this.PatientsListOptions = [];
    this.serviceDropdown = [];

    this._service.GetAppointmentsById(appointmentId).subscribe({
      next: async (apt) => {
        this.isEditMode = true;
        this.editingAppointmentId = appointmentId;

        const start12 = this.to12Hour(apt.startTime);
        const end12 = this.to12Hour(apt.endTime);
        const dateStr = apt.date.split('T')[0];
        const serviceId = apt.services?.[0]?.serviceId ?? null;
        const patientId = apt.patientId?.toString();
        const therapistId = apt.userId;

        // RESET FORM
        this.appointmentForm.reset();

        // Load services FIRST
        await this.loadServicesPromise();
        
        // Load patients for therapist
        await this.loadPatientsPromise(therapistId);

        // Find the correct value to patch for service
        let serviceValueToPatch = '';
        if (serviceId) {
          const matchingService = this.serviceDropdown.find(s => s.serviceId === serviceId);
          if (matchingService) {
            serviceValueToPatch = matchingService.id;
          }
        }

        // Patch form with values
        const formValues: any = {
          therapistInput: therapistId,
          patientId: patientId || '',
          date: dateStr,
          startTime: start12,
          endTime: end12,
          meetingTypeInput: apt.meetingTypeId,
          chiefComplaintId: apt.chiefComplaints?.[0]?.id ?? null,
          notes: apt.notes ?? '',
          ServiceInput: serviceValueToPatch,
          title: apt.title || '',
          diagnosisInput: apt.diagnosisInput || '',
          repeatEvery: apt.repeatEvery || 1,
          repeatPeriod: apt.repeatPeriod || 'Day',
          endDate: apt.endDate || '',
          repeat: apt.repeat || false,
          repeatDays: apt.repeatDays || []
        };

        this.appointmentForm.patchValue(formValues, { emitEvent: false });

        // Generate time slots
        this.selectedTherapistAvailability = await this.loadTherapistAvailability(therapistId);
        this.onDateChange();

        // Ensure appointment time is in available slots
        if (start12 && !this.availableStartTimes.includes(start12)) {
          this.availableStartTimes = [start12, ...this.availableStartTimes];
        }

        // Force UI update
        setTimeout(() => {
          this.forceDropdownUpdate();
        }, 300);
      },
      error: (err) => {
        console.error('Failed to load appointment:', err);
      }
    });
  }

  // Helper methods using Promises
  private loadServicesPromise(): Promise<void> {
    return new Promise((resolve) => {
      const clientId = this._authservice.getClientId();
      
      if (!clientId) {
        this.serviceDropdown = [];
        resolve();
        return;
      }

      this.dropdownService.GetServiceItemS(clientId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.serviceDropdown = res.data;
          } else {
            this.serviceDropdown = [];
          }
          resolve();
        },
        error: (error) => {
          console.error("Error loading services:", error);
          this.serviceDropdown = [];
          resolve();
        }
      });
    });
  }

  private loadPatientsPromise(therapistId: string): Promise<void> {
    return new Promise((resolve) => {
      this.adminservice.getPatientsByTherapist(therapistId).subscribe({
        next: (patients: any[]) => {
          this.PatientsListOptions = patients || [];
          resolve();
        },
        error: (err) => {
          console.error('Failed to load patients:', err);
          this.PatientsListOptions = [];
          resolve();
        }
      });
    });
  }

  private loadTherapistAvailability(therapistId: string): Promise<any[]> {
    return new Promise((resolve) => {
      this.adminservice.getAvailabilityByUser(therapistId).subscribe({
        next: (res) => {
          resolve(res);
        },
        error: (err) => {
          console.error('Failed to load availability:', err);
          resolve([]);
        }
      });
    });
  }

  // Force dropdown UI to update
  private forceDropdownUpdate(): void {
    // Clone arrays to trigger change detection
    this.PatientsListOptions = [...this.PatientsListOptions];
    this.serviceDropdown = [...this.serviceDropdown];
    
    // Check if service value exists in dropdown
    const serviceControl = this.appointmentForm.get('ServiceInput');
    if (serviceControl?.value) {
      const serviceExists = this.serviceDropdown.some(s => s.id === serviceControl.value);
      if (!serviceExists) {
        const serviceByServiceId = this.serviceDropdown.find(s => s.serviceId === serviceControl.value);
        if (serviceByServiceId) {
          serviceControl.setValue(serviceByServiceId.id, { emitEvent: false });
        }
      }
    }
    
    // Force Angular change detection by resetting and re-setting
    const patientControl = this.appointmentForm.get('patientId');
    if (serviceControl?.value) {
      const currentValue = serviceControl.value;
      serviceControl.setValue(null, { emitEvent: false });
      setTimeout(() => {
        serviceControl.setValue(currentValue, { emitEvent: false });
      }, 50);
    }
    
    if (patientControl?.value) {
      const currentValue = patientControl.value;
      patientControl.setValue(null, { emitEvent: false });
      setTimeout(() => {
        patientControl.setValue(currentValue, { emitEvent: false });
      }, 100);
    }
    
    // Update form validity
    this.appointmentForm.updateValueAndValidity();
  }

  private patchFormForCreate(event: SchedulerClickEvent): void {
    // Implementation for create mode
  }

  private to12Hour(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  }

  trackByPatientId(index: number, patient: any): string {
    return patient?.id || index;
  }

  trackByServiceId(index: number, service: any): string {
    return service?.id || index;
  }

  compareById(a: any, b: any): boolean {
    if (a == null || b == null) return false;
    return String(a) === String(b);
  }
}