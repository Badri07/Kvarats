import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, AvailabilityDto, CalendarView, Appointment, Patient, Diagnosis, ServiceItem, CreateAppointmentRequest } from '../../../../models/CalendarEvent.model';
import { DateUtils } from '../../../../models/utlis/date.utlis';
import { AuthService } from '../../../../service/auth/auth.service';
import { TherapistAppointmentService } from '../../../../service/scheduler/Appointment.service';
import { AdminService } from '../../../../service/admin/admin.service';
import { SchedulerService } from '../../../../service/scheduler/scheduler.service';
import { AppointmentTypeOption, MeetingTypeOption } from '../../../../models/scheduler';

interface TimeSlot {
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  isBooked: boolean;
  isPast: boolean;
  isCurrent: boolean;
}

@Component({
  selector: 'app-appointment-modal',
  standalone: false,
  templateUrl: './appointment-modal.component.html',
  styleUrl: './appointment-modal.component.scss'
})
export class AppointmentModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() appointment?: CalendarEvent | null;
  @Input() initialDate?: Date;
  @Input() initialHour?: number;
  @Input() patients: Patient[] = [];
  @Input() diagnoses: Diagnosis[] = [];
  @Input() services: ServiceItem[] = [];
  @Input() existingAppointments: CalendarEvent[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateAppointmentRequest>();
  @Output() patientChange = new EventEmitter<string>();

  formData: Partial<CreateAppointmentRequest> & {
    repeat?: boolean;
    repeatEvery?: number;
    repeatPeriod?: 'Day' | 'Week' | 'Month';
    endDate?: Date;
    repeatDays?: string[];
  } = this.getDefaultFormData();

  selectedService: string = '';
  loading = false;
  loadingSlots = false;
  error: string | null = null;
  weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedRepeatDays: Set<string> = new Set();
  minDate: string = '';
  minEndDate: string = '';

  // Time slot properties
  availableTimeSlots: TimeSlot[] = [];
  selectedTimeSlot: TimeSlot | null = null;
  selectedTherapistAvailability: any[] = [];
  therapistWorkingHours: string = '';
  noSlotsMessage: string = '';

  // UI state properties
  displayDate: string = 'mm/dd/yyyy';
  isToday: boolean = false;
  showDebugInfo: boolean = false; // Set to false in production

  // Grouped slots for better UX
  showAllSlots = false;
  morningSlots: TimeSlot[] = [];
  afternoonSlots: TimeSlot[] = [];
  eveningSlots: TimeSlot[] = [];
  suggestedSlots: TimeSlot[] = [];

  public service = inject(TherapistAppointmentService)
  private _adminService = inject(AdminService);
  
  constructor(private authService: AuthService,private schedulerService: SchedulerService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      // Load therapist availability when modal opens
      this.loadTherapistAvailability();
    }

    if (changes['appointment'] && this.appointment) {
      this.loadAppointmentData();
    } else if (changes['initialDate'] || changes['initialHour']) {
      this.setInitialDateTime();
    }

    if (changes['existingAppointments'] && this.formData.date) {
      this.generateAvailableTimeSlots();
    }
  }

  userId: any;
  ngOnInit() {
    this.userId = this.authService.getUserId();
    this.setMinDates();
    this.loadDropdowns();
    this.showDebugInfo = false;
    this.fetchDropdownOptions('Meeting Type');
    
  }

  setMinDates(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.minDate = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minEndDate = tomorrow.toISOString().split('T')[0];
  }

  getDefaultFormData(): Partial<CreateAppointmentRequest> & {
    repeat?: boolean;
    repeatEvery?: number;
    repeatPeriod?: 'Day' | 'Week' | 'Month';
    endDate?: Date;
    repeatDays?: string[];
  } {
    const defaultEndDate = new Date();
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);

    return {
      patientId: '',
      userId: this.userId || '',
      date: undefined,
      startTime: undefined,
      endTime: undefined,
      meetingTypeId: 1,
      notes: '',
      repeat: false,
      repeatEvery: 1,
      repeatPeriod: 'Week',
      endDate: defaultEndDate,
      repeatDays: [],
      serviceIds: [],
      diagnoses: [],
      // chiefComplaintId: null
    };
  }

  resetForm(): void {
    this.formData = this.getDefaultFormData();
    this.selectedService = '';
    this.selectedRepeatDays.clear();
    this.error = null;
    this.availableTimeSlots = [];
    this.selectedTimeSlot = null;
    this.displayDate = 'mm/dd/yyyy';
    this.isToday = false;
    this.therapistWorkingHours = '';
    this.morningSlots = [];
    this.afternoonSlots = [];
    this.eveningSlots = [];
    this.suggestedSlots = [];
    this.showAllSlots = false;
    this.setMinDates();
  }

  loadAppointmentData(): void {
    if (!this.appointment) return;

    console.log('Loading appointment data:', this.appointment);

    this.formData = {
      patientId: this.appointment.patientId,
      userId: this.appointment.userId,
      date: new Date(this.appointment.date),
      startTime: new Date(this.appointment.startDate),
      endTime: new Date(this.appointment.endDate),
      meetingTypeId: this.appointment.meetingTypeId,
      notes: this.appointment.notes,
      serviceIds: this.appointment.services.map((s) => s.serviceId),
      diagnoses: this.appointment.diagnoses.map((d) => ({
        diagnosisId: d.diagnosisId,
        isPrimary: d.isPrimary,
      })),
      repeat: false,
      repeatEvery: 1,
      repeatPeriod: 'Week',
      endDate: new Date(),
      repeatDays: [],
      // chiefComplaintId: this.appointment.chiefComplaintId || null
    };

    this.selectedService = this.appointment.services[0]?.serviceId || '';
    this.displayDate = this.formatDateForDisplay(this.formData.date);
    
    // Create selected time slot from appointment data
    if (this.formData.startTime && this.formData.endTime) {
      this.selectedTimeSlot = {
        startTime: this.formatTimeForInput(this.formData.startTime),
        endTime: this.formatTimeForInput(this.formData.endTime),
        startDate: this.formData.startTime,
        endDate: this.formData.endTime,
        isBooked: false,
        isPast: false,
        isCurrent: false
      };
      
      console.log('Created selected time slot:', this.selectedTimeSlot);
    }
    
    if (this.formData.repeatDays) {
      this.selectedRepeatDays = new Set(this.formData.repeatDays);
    }

    // Generate time slots for the appointment date
    this.generateAvailableTimeSlots();
  }

    appointmentTypeOptions: AppointmentTypeOption[] = [];
      meetingTypeOptions: MeetingTypeOption[] = [];
  
  
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

  setInitialDateTime(): void {
    if (this.initialDate) {
      const now = new Date();
      let start: Date;
      let end: Date;

      if (this.initialHour !== undefined) {
        // If hour is provided (from slot click), use it
        start = new Date(this.initialDate);
        start.setHours(this.initialHour, 0, 0, 0);
      } else {
        // If no hour provided (from + button), use current time rounded to next 30 minutes
        start = this.getNextAvailableTimeSlot(now);
      }

      end = new Date(start);
      end.setMinutes(start.getMinutes() + 30);

      this.formData = {
        ...this.formData,
        date: this.initialDate,
        startTime: start,
        endTime: end,
      };

      this.displayDate = this.formatDateForDisplay(this.initialDate);

      // Create selected time slot
      this.selectedTimeSlot = {
        startTime: this.formatTimeForInput(start),
        endTime: this.formatTimeForInput(end),
        startDate: start,
        endDate: end,
        isBooked: false,
        isPast: false,
        isCurrent: false
      };

      console.log('Set initial date time - selected slot:', this.selectedTimeSlot);
      console.log('Form data startTime:', this.formData.startTime);
      console.log('Form data endTime:', this.formData.endTime);

      this.generateAvailableTimeSlots();
    }
  }

  getNextAvailableTimeSlot(now: Date): Date {
    const nextSlot = new Date(now);
    
    // Round up to next 30 minutes
    const minutes = nextSlot.getMinutes();
    if (minutes < 30) {
      nextSlot.setMinutes(30, 0, 0);
    } else {
      nextSlot.setHours(nextSlot.getHours() + 1, 0, 0, 0);
    }
    
    return nextSlot;
  }

  onDateChange(value: string): void {
    if (!value) {
      this.formData.date = undefined;
      this.displayDate = 'mm/dd/yyyy';
      this.availableTimeSlots = [];
      this.selectedTimeSlot = null;
      this.isToday = false;
      this.therapistWorkingHours = '';
      this.clearGroupedSlots();
      return;
    }

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if selected date is today
    this.isToday = selectedDate.toDateString() === today.toDateString();

    if (selectedDate < today) {
      this.formData.date = today;
      this.displayDate = this.formatDateForDisplay(today);
      this.error = 'Cannot select past dates';
      this.isToday = true;
    } else {
      this.formData.date = selectedDate;
      this.displayDate = this.formatDateForDisplay(selectedDate);
      this.error = null;
    }

    this.selectedTimeSlot = null;
    this.formData.startTime = undefined;
    this.formData.endTime = undefined;
    this.generateAvailableTimeSlots();
  }

  loadTherapistAvailability() {
    const therapistId = this.authService.getUserId();
    if (!therapistId) {
      console.error('Therapist ID not found');
      return;
    }

    this._adminService.getAvailabilityByUser(therapistId)
      .subscribe((res: any) => {
        console.log("Therapist Availability:", res);
        this.selectedTherapistAvailability = res;
        
        // Generate time slots if date is already selected
        if (this.formData.date) {
          this.generateAvailableTimeSlots();
        }
      });
  }

  generateAvailableTimeSlots() {
    const selectedDate = this.formData.date;
    if (!selectedDate || this.selectedTherapistAvailability.length === 0) {
      this.availableTimeSlots = [];
      this.clearGroupedSlots();
      return;
    }

    this.loadingSlots = true;

    const day = new Date(selectedDate).getDay();
    const dayAvailability = this.selectedTherapistAvailability.find(d => d.dayOfWeek === day);

    if (!dayAvailability || dayAvailability.isAvailable === false) {
      this.availableTimeSlots = [];
      this.clearGroupedSlots();
      this.loadingSlots = false;
      this.therapistWorkingHours = 'Not available on this day';
      this.noSlotsMessage = 'The therapist is not available on the selected day. Please choose another date.';
      this.error = 'Therapist is not available on selected day';
      return;
    }

    // Set therapist working hours display
    this.therapistWorkingHours = `Working hours: ${dayAvailability.startTime} - ${dayAvailability.endTime}`;

    // Generate all possible time slots
    const allSlots = this.generateTimeSlots(
      dayAvailability.startTime,
      dayAvailability.endTime,
      selectedDate
    );

    // Filter out booked time slots and past time slots for today
    this.filterTimeSlots(allSlots, selectedDate).then(filteredSlots => {
      this.availableTimeSlots = filteredSlots;
      this.groupTimeSlots(filteredSlots);
      this.loadingSlots = false;
      this.error = null;

      // Auto-select the first available slot if none is selected and we're creating new appointment
      if (!this.appointment && !this.selectedTimeSlot && this.suggestedSlots.length > 0) {
        this.selectTimeSlot(this.suggestedSlots[0]);
      }

      // If we have an appointment, try to match the existing time slot
      if (this.appointment && this.formData.startTime && this.formData.endTime) {
        this.matchExistingAppointmentTime();
      }

      // Set no slots message
      if (this.availableTimeSlots.length === 0) {
        this.noSlotsMessage = 'No available time slots found for the selected date. This could be due to:<br>• All slots are already booked<br>• Therapist working hours have passed for today<br>• Please try selecting another date';
      }

      console.log("Available Time Slots:", this.availableTimeSlots);
      console.log("Selected Time Slot:", this.selectedTimeSlot);
    });
  }

  clearGroupedSlots(): void {
    this.morningSlots = [];
    this.afternoonSlots = [];
    this.eveningSlots = [];
    this.suggestedSlots = [];
  }

  groupTimeSlots(slots: TimeSlot[]): void {
    this.morningSlots = slots.filter(slot => this.isMorningSlot(slot));
    this.afternoonSlots = slots.filter(slot => this.isAfternoonSlot(slot));
    this.eveningSlots = slots.filter(slot => this.isEveningSlot(slot));
    
    // Get suggested slots (next 3 available)
    this.suggestedSlots = slots
      .filter(slot => !slot.isBooked && !slot.isPast)
      .slice(0, 3);
  }

  isMorningSlot(slot: TimeSlot): boolean {
    const hour = parseInt(slot.startTime.split(':')[0]);
    return hour >= 9 && hour < 12;
  }

  isAfternoonSlot(slot: TimeSlot): boolean {
    const hour = parseInt(slot.startTime.split(':')[0]);
    return hour >= 12 && hour < 17;
  }

  isEveningSlot(slot: TimeSlot): boolean {
    const hour = parseInt(slot.startTime.split(':')[0]);
    return hour >= 17 && hour < 21;
  }

  getVisibleSlots(slots: TimeSlot[]): TimeSlot[] {
    if (this.showAllSlots) {
      return slots;
    }
    // Show only 6 slots initially, or all if less than 6
    return slots.slice(0, Math.min(6, slots.length));
  }

  getSlotClasses(slot: TimeSlot): any {
    return {
      'bg-orange-600 text-white border-orange-600 shadow-md': this.isSlotSelected(slot),
      'bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-200': 
        !this.isSlotSelected(slot) && !slot.isBooked && !slot.isPast,
      'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed': slot.isBooked || slot.isPast,
      'border-blue-300 bg-blue-50': slot.isCurrent
    };
  }

  matchExistingAppointmentTime(): void {
    if (!this.formData.startTime || !this.formData.endTime) return;

    const existingStartTime = this.formatTimeForInput(this.formData.startTime);
    const existingEndTime = this.formatTimeForInput(this.formData.endTime);

    const matchingSlot = this.availableTimeSlots.find(slot => 
      slot.startTime === existingStartTime && slot.endTime === existingEndTime
    );

    if (matchingSlot) {
      this.selectedTimeSlot = matchingSlot;
      console.log('Matched existing appointment time slot:', matchingSlot);
    }
  }

  generateTimeSlots(start: string, end: string, selectedDate: Date): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let [startH, startM] = start.split(':').map(Number);
    let [endH, endM] = end.split(':').map(Number);

    let currentTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    const now = new Date();
    const isSelectedDateToday = selectedDate.toDateString() === now.toDateString();

    while (currentTime + 30 <= endTime) {
      const startHours = Math.floor(currentTime / 60);
      const startMinutes = currentTime % 60;
      const endHours = Math.floor((currentTime + 30) / 60);
      const endMinutes = (currentTime + 30) % 60;

      const startTimeStr = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
      const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      // Create Date objects for the selected date
      const startDate = new Date(selectedDate);
      startDate.setHours(startHours, startMinutes, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(endHours, endMinutes, 0, 0);

      // Check if this slot is in the past (for today only)
      const isPast = isSelectedDateToday && startDate < now;
      
      // Check if this is the current recommended slot (next available slot for today)
      const isCurrent = isSelectedDateToday && 
                       !isPast && 
                       this.isCurrentRecommendedSlot(startDate, now);

      slots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        startDate: startDate,
        endDate: endDate,
        isBooked: false,
        isPast: isPast,
        isCurrent: isCurrent
      });

      currentTime += 30;
    }

    return slots;
  }

  isCurrentRecommendedSlot(slotStart: Date, now: Date): boolean {
    // Consider it current if it's within the next 2 slots from now
    const timeDiff = slotStart.getTime() - now.getTime();
    return timeDiff >= 0 && timeDiff <= 60 * 60 * 1000; // Within next hour
  }

  async filterTimeSlots(slots: TimeSlot[], selectedDate: Date): Promise<TimeSlot[]> {
    const filteredSlots = slots.map(slot => {
      // Skip if slot is in the past (for today)
      if (slot.isPast) {
        return { ...slot, isBooked: true };
      }

      // Check if slot is booked by existing appointments
      const isBooked = this.existingAppointments?.some(appointment => {
        const appointmentDate = new Date(appointment.date).toDateString();
        const appointmentStart = new Date(appointment.startDate);
        const appointmentEnd = new Date(appointment.endDate);

        return appointmentDate === selectedDate.toDateString() &&
               appointmentStart < slot.endDate &&
               appointmentEnd > slot.startDate;
      }) || false;

      return { ...slot, isBooked };
    });

    // Filter out past slots (they're already marked as booked)
    return filteredSlots.filter(slot => !slot.isPast || !slot.isBooked);
  }

  // FIXED: Properly patch time selection to form data
  selectTimeSlot(slot: TimeSlot): void {
    if (slot.isBooked) {
      return;
    }

    console.log('Selecting time slot:', slot);
    
    this.selectedTimeSlot = slot;
    
    // IMPORTANT: Create new Date objects to avoid reference issues
    this.formData.startTime = new Date(slot.startDate);
    this.formData.endTime = new Date(slot.endDate);
    
    console.log('Form data after selection - startTime:', this.formData.startTime);
    console.log('Form data after selection - endTime:', this.formData.endTime);
    console.log('Form data date:', this.formData.date);
  }

  clearTimeSelection(): void {
    this.selectedTimeSlot = null;
    this.formData.startTime = undefined;
    this.formData.endTime = undefined;
    console.log('Cleared time selection');
  }

  isSlotSelected(slot: TimeSlot): boolean {
    if (!this.selectedTimeSlot) return false;
    
    return this.selectedTimeSlot.startTime === slot.startTime && 
           this.selectedTimeSlot.endTime === slot.endTime;
  }

  isCurrentTimeSlot(slot: TimeSlot): boolean {
    return slot.isCurrent;
  }

  // Manual time input handlers
  onManualStartTimeChange(value: string): void {
    if (!value || !this.formData.date) return;

    const [hours, minutes] = value.split(':').map(Number);
    const startDate = new Date(this.formData.date);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + 30);

    this.formData.startTime = startDate;
    this.formData.endTime = endDate;

    // Create a matching time slot for display
    this.selectedTimeSlot = {
      startTime: value,
      endTime: this.formatTimeForInput(endDate),
      startDate: startDate,
      endDate: endDate,
      isBooked: false,
      isPast: false,
      isCurrent: false
    };
  }

  onManualEndTimeChange(value: string): void {
    if (!value || !this.formData.startTime) return;

    const [hours, minutes] = value.split(':').map(Number);
    const endDate = new Date(this.formData.date!);
    endDate.setHours(hours, minutes, 0, 0);

    this.formData.endTime = endDate;

    // Update the selected time slot
    if (this.selectedTimeSlot) {
      this.selectedTimeSlot.endTime = value;
      this.selectedTimeSlot.endDate = endDate;
    }
  }

  getTherapistName(): string {
    const currentUser = this.authService.getCurrentUserName();
    return currentUser || 'Current Therapist';
  }

  // Date and time formatting methods
  formatDateForInput(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  formatDateForDisplay(date?: Date): string {
    if (!date) return 'mm/dd/yyyy';
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  formatTimeForInput(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toTimeString().slice(0, 5);
  }

  // Repeat day selection methods
  isDaySelected(day: string): boolean {
    return this.selectedRepeatDays.has(day);
  }

  toggleRepeatDay(day: string): void {
    if (this.selectedRepeatDays.has(day)) {
      this.selectedRepeatDays.delete(day);
    } else {
      this.selectedRepeatDays.add(day);
    }
    
    this.formData.repeatDays = Array.from(this.selectedRepeatDays);
  }

  onRepeatPeriodChange(period: 'Day' | 'Week' | 'Month'): void {
    this.formData.repeatPeriod = period;
    if (period !== 'Week') {
      this.selectedRepeatDays.clear();
      this.formData.repeatDays = [];
    }
  }

  formatEndDateForInput(): string {
    if (!this.formData.endDate) return '';
    const d = new Date(this.formData.endDate);
    return d.toISOString().split('T')[0];
  }

  onEndDateChange(value: string): void {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.formData.endDate = tomorrow;
      this.error = 'End date cannot be in the past';
    } else {
      this.formData.endDate = selectedDate;
      this.error = null;
    }
  }

  // Form submission
  onSubmit(): void {
    this.error = null;

    // Validate required fields
    if (!this.formData.date) {
      this.error = 'Please select a date';
      return;
    }

    const selectedDate = new Date(this.formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      this.error = 'Cannot create appointment for past dates';
      return;
    }

    if (!this.formData.patientId) {
      this.error = 'Please select a patient';
      return;
    }

    if (!this.selectedService) {
      this.error = 'Please select a service';
      return;
    }

    if (!this.selectedTimeSlot) {
      this.error = 'Please select a time slot';
      return;
    }

    if (!this.formData.chiefComplaintId) {
      this.error = 'Please select a chief complaint';
      return;
    }

    // Validate repeat options
    if (this.formData.repeat) {
      if (!this.formData.repeatEvery || this.formData.repeatEvery < 1) {
        this.error = 'Please enter a valid repeat interval';
        return;
      }

      if (!this.formData.endDate) {
        this.error = 'Please select an end date for the repeating appointment';
        return;
      }

      const endDate = new Date(this.formData.endDate);
      if (endDate < today) {
        this.error = 'End date cannot be in the past';
        return;
      }

      if (this.formData.repeatPeriod === 'Week' && this.selectedRepeatDays.size === 0) {
        this.error = 'Please select at least one day for weekly repetition';
        return;
      }
    }

    this.loading = true;

    const request: CreateAppointmentRequest & {
      repeat?: boolean;
      repeatEvery?: number;
      repeatPeriod?: 'Day' | 'Week' | 'Month';
      endDate?: Date;
      repeatDays?: string[];
    } = {
      ...this.formData,
      userId: this.authService.getUserId() || '',
      serviceIds: [this.selectedService],
      repeatDays: Array.from(this.selectedRepeatDays),
      startTime: this.selectedTimeSlot.startDate,
      endTime: this.selectedTimeSlot.endDate,
    } as CreateAppointmentRequest & {
      repeat?: boolean;
      repeatEvery?: number;
      repeatPeriod?: 'Day' | 'Week' | 'Month';
      endDate?: Date;
      repeatDays?: string[];
    };

    console.log('Submitting appointment:', request);
    this.save.emit(request);
    this.loading = false;
  }

  patientdIds: any;
  diagnosess: any[] = [];

  onPatientChange(patientId: string): void {
    this.formData.patientId = patientId;
    this.patientChange.emit(patientId);
    this.getPatientsDiagnoses(patientId);
  }

  getPatientsDiagnoses(patientId: string) {
    this.service.getPatientDiagnoses(patientId).subscribe((res: any) => {
      this.diagnoses = res;
    });
  }

  onClose(): void {
    this.closeModal.emit();
  }

  chiefComplaints: any[] = [];
  loadDropdowns(): void {
    this._adminService.getChiefComplaintdata().subscribe({
      next: (data:any) => this.chiefComplaints = data,
      error: (err:any) => console.error('Failed to load chief complaints', err)
    });
  }

  // Method to check if a date is in the past (for template use)
  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }
}