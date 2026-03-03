import { Component, OnInit, OnDestroy, ViewChild, inject, signal, computed } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TimeSlot, Appointment } from '../../../models/appointment.model';
import { SchedulerService } from '../../../service/scheduler/scheduler.service';
import { PopupService } from '../../../service/popup/popup-service';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { SchedulerClickEvent } from '../../../models/scheduler';
import { TimeSlotRowComponent } from '../time-slot-row/time-slot-row.component';
import { AuthService } from '../../../service/auth/auth.service';
import { AppointmentTherapist, AppointmentType, BookingRequest, Patient } from '../../../models/therapist-interface';
import { TherapistService } from '../../../service/therapist/therapist.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../../service/therapist/patient.service';
import { Availability, Leave } from '../../../models/leave.model';
import { AppointmentEditEvent } from '../../../models/scheduler.interface';

interface CalendarSlot {
  date: Date;
  time: string;
  status: 'available' | 'booked' | 'unavailable' | 'on-leave' | 'past' | 'break';
  appointment?: Appointment;
}

// Extended Appointment interface to include appointmentType
// Extended Appointment interface to include all required properties
interface ExtendedAppointment  {
  id: string;
  startTime: Date;
  endTime: Date;
  appointmentType?: string;
  clientId: string;
  status: string;
}

@Component({
  selector: 'app-calendar-scheduler',
  templateUrl: './calendar-scheduler.component.html',
  styleUrls: ['./calendar-scheduler.component.scss'],
  standalone: false
})
export class CalendarSchedulerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Services
  private appointmentService = inject(TherapistService);
  private patientService = inject(PatientService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private popupService = inject(PopupService);

  @ViewChild(TimeSlotRowComponent) schedulerComponent!: TimeSlotRowComponent;

  // Calendar state
  currentDate = signal(new Date());
  appointments = signal<ExtendedAppointment[]>([]);
  patients = signal<Patient[]>([]);
  availabilities = signal<Availability[]>([]);
  leaves = signal<Leave[]>([]);

  // Modal state
  showModal = false;
  showBookingModal = signal(false);
  selectedSlot = signal<CalendarSlot | null>(null);
  selectedDateForBooking = signal<Date | null>(null);
  isLoading = signal(false);
  schedulerEvent: SchedulerClickEvent | AppointmentEditEvent | null = null;

  // Current time tracking
  currentTime = signal(new Date());
  private timeInterval?: number;

  // View controls
  currentView = signal<'day' | 'work-week' | 'week' | 'month'>('week');
  dayRange = signal(1);
  
  // Calendar filters
  showUSHolidays = signal(true);
  
  // Dropdown state
  showViewDropdown = signal(false);
  showDaySubmenu = signal(false);

  // User role
  getUser_Role!: string;

  // Form
  bookingForm: FormGroup = this.fb.group({
    patientId: ['', Validators.required],
    appointmentType: [AppointmentType.THERAPY_SESSION, Validators.required],
    title: [''],
    notes: [''],
    selectedTime: ['']
  });

  // Computed signals
  weekDates = computed(() => {
    const current = this.currentDate();
    const view = this.currentView();
    
    if (view === 'month') {
      return this.getMonthDates();
    }
    
    const startOfWeek = new Date(current);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const dates = [];
    const daysToShow = view === 'day' ? this.dayRange() : 
                      view === 'work-week' ? 5 : 7;
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  });

  timeSlots = computed(() => {
    const slots: string[] = [];
    for (let hour = 7; hour < 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  });

  calendarDays = computed(() => {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  });

  currentTimePosition = computed(() => {
    const now = this.currentTime();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours < 7 || hours >= 21) return null;
    
    const totalMinutes = (hours - 7) * 60 + minutes;
    const totalBusinessMinutes = 14 * 60;
    return (totalMinutes / totalBusinessMinutes) * 100;
  });

  // Check if current week has today
  hasTodayInWeek = computed(() => {
    return this.weekDates().some(day => this.isToday(day));
  });

  // Enhanced slot status computation
  calendarSlots = computed(() => {
    const slots: any[] = [];
    const dates = this.weekDates();
    const times = this.timeSlots();

    dates.forEach(date => {
      times.forEach(time => {
        const status = this.getSlotStatus(date, time);
        const appointment = this.getAppointmentForSlot(date, time);
        
        slots.push({
          date: new Date(date),
          time,
          status,
          appointment
        });
      });
    });

    return slots;
  });

  ngOnInit(): void {
    this.loadAppointments();
    this.loadPatients();
    this.loadAvailabilities();
    this.loadLeaves();
    this.startTimeTracking();
    this.getUserRole();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  // Data loading methods
  loadAppointments(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (appointments: any) => {
        const processedAppointments: ExtendedAppointment[] = appointments.map((apt: any) => ({
          ...apt,
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime),
          appointmentType: apt.appointmentType || 'therapy_session',
          status: apt.status || 'scheduled'
        }));
        this.appointments.set(processedAppointments);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
      }
    });
  }

  loadPatients(): void {
    this.patientService.getPatientsByTherapist('therapist-1').subscribe({
      next: (patients: Patient[]) => {
        this.patients.set(patients);
      },
      error: (error) => {
        console.error('Error loading patients:', error);
      }
    });
  }

  loadAvailabilities(): void {
    // Mock data - replace with actual API call
    const mockAvailabilities: any[] = [
      { id: '1', therapistId: '1', dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '17:00' },
      { id: '2', therapistId: '1', dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '17:00' },
      { id: '3', therapistId: '1', dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '17:00' },
      { id: '4', therapistId: '1', dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '17:00' },
      { id: '5', therapistId: '1', dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '17:00' }
    ];
    this.availabilities.set(mockAvailabilities);
  }

  loadLeaves(): void {
    // Mock data - replace with actual API call
    const mockLeaves: Leave[] = [];
    this.leaves.set(mockLeaves);
  }

  // Enhanced slot management
  getSlotStatus(date: Date, time: string): CalendarSlot['status'] {
    if (this.isSlotInPast(date, time)) return 'past';
    
    const appointment = this.getAppointmentForSlot(date, time);
    if (appointment) return 'booked';
    
    if (this.isTherapistOnLeave(date, time)) return 'on-leave';
    
    if (!this.isTherapistAvailable(date, time)) return 'unavailable';
    
    return 'available';
  }

  getAppointmentForSlot(date: Date, time: string): ExtendedAppointment | undefined {
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

    return this.appointments().find((apt:any) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return aptStart < slotEnd && aptEnd > slotStart;
    });
  }

  isSlotInPast(date: Date, time: string): boolean {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);
    return slotDateTime < now;
  }

  isTherapistOnLeave(date: Date, time: string): boolean {
    const dateString = date.toDateString();
    const [hours, minutes] = time.split(':').map(Number);
    
    return this.leaves().some(leave => {
      const leaveDate = leave.leaveDate.toDateString();
      if (leaveDate !== dateString) return false;
      
      if (leave.isFullDay) return true;
      
      if (leave.fromTime && leave.toTime) {
        const [fromHours, fromMinutes] = leave.fromTime.split(':').map(Number);
        const [toHours, toMinutes] = leave.toTime.split(':').map(Number);
        
        const slotMinutes = hours * 60 + minutes;
        const fromTotalMinutes = fromHours * 60 + fromMinutes;
        const toTotalMinutes = toHours * 60 + toMinutes;
        
        return slotMinutes >= fromTotalMinutes && slotMinutes < toTotalMinutes;
      }
      
      return false;
    });
  }

  isTherapistAvailable(date: Date, time: string): boolean {
    const dayOfWeek = date.getDay();
    const [hours, minutes] = time.split(':').map(Number);
    const slotMinutes = hours * 60 + minutes;
    
    const availability = this.availabilities().find(avail => avail.dayOfWeek === dayOfWeek);
    
    if (!availability || !availability.isAvailable) return false;
    
    const [startHours, startMinutes] = availability.startTime.split(':').map(Number);
    const [endHours, endMinutes] = availability.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return slotMinutes >= startTotalMinutes && slotMinutes < endTotalMinutes;
  }

  // Navigation methods
  previousWeek(): void {
    const current = new Date(this.currentDate());
    const daysToSubtract = this.currentView() === 'month' ? 0 : 7;
    current.setDate(current.getDate() - daysToSubtract);
    this.currentDate.set(current);
  }

  nextWeek(): void {
    const current = new Date(this.currentDate());
    const daysToAdd = this.currentView() === 'month' ? 0 : 7;
    current.setDate(current.getDate() + daysToAdd);
    this.currentDate.set(current);
  }

  previousMonth(): void {
    const current = new Date(this.currentDate());
    current.setMonth(current.getMonth() - 1);
    this.currentDate.set(current);
  }

  nextMonth(): void {
    const current = new Date(this.currentDate());
    current.setMonth(current.getMonth() + 1);
    this.currentDate.set(current);
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  selectDate(date: Date): void {
    this.currentDate.set(new Date(date));
  }

  // Slot interaction
  onSlotClick(date: Date, time: string): void {
    const slotStatus = this.getSlotStatus(date, time);
    
    if (slotStatus !== 'available') return;
    
    const slot: CalendarSlot = {
      date: new Date(date),
      time,
      status: slotStatus
    };
    
    this.selectedSlot.set(slot);
    this.bookingForm.reset({
      patientId: '',
      appointmentType: AppointmentType.THERAPY_SESSION,
      title: '',
      notes: ''
    });
    this.showBookingModal.set(true);
  }

  onMonthDateClick(date: Date): void {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);
    
    if (clickedDate < today) return;

    this.selectedDateForBooking.set(date);
    this.selectedSlot.set(null);
    this.bookingForm.reset({
      patientId: '',
      appointmentType: AppointmentType.THERAPY_SESSION,
      selectedTime: '',
      title: '',
      notes: ''
    });
    this.showBookingModal.set(true);
  }

  // Modal methods
  closeBookingModal(): void {
    this.showBookingModal.set(false);
    this.selectedSlot.set(null);
    this.selectedDateForBooking.set(null);
    this.bookingForm.reset();
  }

  onSubmitBooking(): void {
    if (this.bookingForm.invalid) return;
    
    const slot = this.selectedSlot();
    const selectedDate = this.selectedDateForBooking();
    
    if (!slot && !selectedDate) return;

    this.isLoading.set(true);
    
    let startTime: Date;
    let timeString: string;

    if (slot) {
      const [hours, minutes] = slot.time.split(':').map(Number);
      startTime = new Date(slot.date);
      startTime.setHours(hours, minutes, 0, 0);
      timeString = slot.time;
    } else if (selectedDate) {
      const selectedTime = this.bookingForm.get('selectedTime')?.value;
      if (!selectedTime) {
        this.isLoading.set(false);
        return;
      }
      const [hours, minutes] = selectedTime.split(':').map(Number);
      startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      timeString = selectedTime;
    } else {
      this.isLoading.set(false);
      return;
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const formValue = this.bookingForm.value;
    const bookingRequest: BookingRequest = {
      clientId: formValue.patientId,
      therapistId: 'therapist-1',
      preferredDate: startTime,
      preferredTime: timeString,
      appointmentType: formValue.appointmentType,
      duration: 30,
      notes: formValue.notes,
      isUrgent: false
    };

    this.appointmentService.bookAppointment(bookingRequest).subscribe({
      next: (appointment: any) => {
        const newAppointment: ExtendedAppointment = {
          ...appointment,
          startTime: new Date(appointment.startTime),
          endTime: new Date(appointment.endTime),
          appointmentType: appointment.appointmentType || 'therapy_session',
          status: appointment.status || 'scheduled'
        };
        this.appointments.update(appointments => [...appointments, newAppointment]);
        this.closeBookingModal();
        this.isLoading.set(false);
        // this.popupService.showSuccess('Appointment booked successfully!');
      },
      error: (error) => {
        console.error('Error booking appointment:', error);
        // this.popupService.showError('Failed to book appointment. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  // Utility methods
  getAvailableTimesForDate(date: Date): string[] {
    const dayOfWeek = date.getDay();
    const availability = this.availabilities().find(avail => avail.dayOfWeek === dayOfWeek);
    
    if (!availability || !availability.isAvailable) {
      return [];
    }

    if (this.isTherapistOnLeaveForDay(date)) {
      return [];
    }

    const [startHours, startMinutes] = availability.startTime.split(':').map(Number);
    const [endHours, endMinutes] = availability.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    const availableTimes: string[] = [];
    const now = new Date();
    
    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hours, mins, 0, 0);
      
      if (slotDateTime <= now) continue;
      
      const isOccupied = this.getAppointmentForSlot(date, timeString);
      if (!isOccupied) {
        availableTimes.push(timeString);
      }
    }
    
    return availableTimes;
  }

  isTherapistOnLeaveForDay(date: Date): boolean {
    const dateString = date.toDateString();
    return this.leaves().some(leave => 
      leave.leaveDate.toDateString() === dateString
    );
  }

  // View control methods
  setView(view: 'day' | 'work-week' | 'week' | 'month'): void {
    this.currentView.set(view);
    this.closeDropdowns();
  }

  setDayRange(days: number): void {
    if (days >= 1 && days <= 7) {
      this.dayRange.set(days);
      this.currentView.set('day');
      this.closeDropdowns();
    }
  }

  toggleUSHolidays(): void {
    this.showUSHolidays.update(show => !show);
  }

  getViewTitle(): string {
    const view = this.currentView();
    switch (view) {
      case 'day':
        const dayCount = this.dayRange();
        return dayCount === 1 ? 'Day' : `${dayCount} Days`;
      case 'work-week':
        return 'Work Week';
      case 'week':
        return 'Week';
      case 'month':
        return 'Month';
      default:
        return 'Week';
    }
  }

  toggleViewDropdown(): void {
    this.showViewDropdown.update(show => !show);
    this.showDaySubmenu.set(false);
  }

  toggleDaySubmenu(): void {
    this.showDaySubmenu.update(show => !show);
  }

  closeDropdowns(): void {
    this.showViewDropdown.set(false);
    this.showDaySubmenu.set(false);
  }

  // Date formatting and utilities
  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isCurrentMonth(date: Date): boolean {
    const current = this.currentDate();
    return date.getMonth() === current.getMonth() && date.getFullYear() === current.getFullYear();
  }

  isSelected(date: Date): boolean {
    const current = this.currentDate();
    return date.toDateString() === current.toDateString();
  }

  getMonthName(): string {
    return this.currentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getWeekRange(): string {
    const dates = this.weekDates();
    if (dates.length === 0) return '';
    
    const start = dates[0];
    const end = dates[dates.length - 1];
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${start.getFullYear()}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  }

  getDayName(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getDayNumber(date: Date): number {
    return date.getDate();
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 30;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const period = endHours >= 12 ? 'PM' : 'AM';
    const displayHours = endHours % 12 || 12;
    return `${displayHours}:${endMinutes.toString().padStart(2, '0')} ${period}`;
  }

  getPatientName(patientId: string): string {
    const patient = this.patients().find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  }

  getAppointmentsForDate(date: Date): ExtendedAppointment[] {
    return this.appointments().filter((apt:any) => 
      apt.startTime.toDateString() === date.toDateString()
    );
  }

  hasAppointments(date: Date): boolean {
    return this.getAppointmentsForDate(date).length > 0;
  }

  // Safe getter methods for template
  getSelectedSlotDate(): Date | null {
    const slot = this.selectedSlot();
    return slot ? slot.date : null;
  }

  getSelectedSlotTime(): string | null {
    const slot = this.selectedSlot();
    return slot ? slot.time : null;
  }

  getSelectedDateForBookingSafe(): Date | null {
    return this.selectedDateForBooking();
  }

  // US Holidays
  isUSHoliday(date: Date): boolean {
    if (!this.showUSHolidays()) return false;
    return this.getUSHolidays().some(holiday => holiday.date.toDateString() === date.toDateString());
  }

  getHolidayInfo(date: Date): {name: string, type: string} | null {
    const holiday = this.getUSHolidays().find(h => h.date.toDateString() === date.toDateString());
    return holiday ? { name: holiday.name, type: holiday.type } : null;
  }

  getUSHolidays(): Array<{date: Date, name: string, type: string}> {
    const year = new Date().getFullYear();
    return [
      { date: new Date(year, 0, 1), name: "New Year's Day", type: "Federal Holiday" },
      { date: this.getMLKDay(year), name: "Martin Luther King Jr. Day", type: "Federal Holiday" },
      { date: this.getPresidentsDay(year), name: "Presidents' Day", type: "Federal Holiday" },
      { date: this.getMemorialDay(year), name: "Memorial Day", type: "Federal Holiday" },
      { date: new Date(year, 5, 19), name: "Juneteenth", type: "Federal Holiday" },
      { date: new Date(year, 6, 4), name: "Independence Day", type: "Federal Holiday" },
      { date: this.getLaborDay(year), name: "Labor Day", type: "Federal Holiday" },
      { date: this.getColumbusDay(year), name: "Columbus Day", type: "Federal Holiday" },
      { date: new Date(year, 10, 11), name: "Veterans Day", type: "Federal Holiday" },
      { date: this.getThanksgiving(year), name: "Thanksgiving Day", type: "Federal Holiday" },
      { date: new Date(year, 11, 25), name: "Christmas Day", type: "Federal Holiday" }
    ];
  }

  private getMLKDay(year: number): Date {
    const jan1 = new Date(year, 0, 1);
    const firstMonday = new Date(year, 0, 1 + (8 - jan1.getDay()) % 7);
    return new Date(year, 0, firstMonday.getDate() + 14);
  }

  private getPresidentsDay(year: number): Date {
    const feb1 = new Date(year, 1, 1);
    const firstMonday = new Date(year, 1, 1 + (8 - feb1.getDay()) % 7);
    return new Date(year, 1, firstMonday.getDate() + 14);
  }

  private getMemorialDay(year: number): Date {
    const may31 = new Date(year, 4, 31);
    const lastMonday = new Date(year, 4, 31 - (may31.getDay() + 6) % 7);
    return lastMonday;
  }

  private getLaborDay(year: number): Date {
    const sep1 = new Date(year, 8, 1);
    const firstMonday = new Date(year, 8, 1 + (8 - sep1.getDay()) % 7);
    return firstMonday;
  }

  private getColumbusDay(year: number): Date {
    const oct1 = new Date(year, 9, 1);
    const firstMonday = new Date(year, 9, 1 + (8 - oct1.getDay()) % 7);
    return new Date(year, 9, firstMonday.getDate() + 7);
  }

  private getThanksgiving(year: number): Date {
    const nov1 = new Date(year, 10, 1);
    const firstThursday = new Date(year, 10, 1 + (11 - nov1.getDay()) % 7);
    return new Date(year, 10, firstThursday.getDate() + 21);
  }

  private getMonthDates(): Date[] {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  private startTimeTracking(): void {
    this.timeInterval = window.setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000);
  }

  getUserRole(): void {
    this.getUser_Role = this.authService.getUserRole();
  }

  // Helper method for template
  getSlotTitle(date: Date, time: string, status: string, appointment?: ExtendedAppointment): string {
    const dateStr = this.formatDate(date);
    const timeStr = this.formatTime(time);
    
    switch (status) {
      case 'available':
        return `Available - ${dateStr} at ${timeStr}`;
      case 'booked':
        const patientName = appointment ? this.getPatientName(appointment.clientId) : 'Unknown Patient';
        return `Booked: ${patientName} - ${dateStr} at ${timeStr}`;
      case 'unavailable':
        return `Unavailable - ${dateStr} at ${timeStr}`;
      case 'on-leave':
        return `On Leave - ${dateStr} at ${timeStr}`;
      case 'past':
        return `Past Time Slot - ${dateStr} at ${timeStr}`;
      default:
        return `${dateStr} at ${timeStr}`;
    }
  }

  // Get appointment type safely
  getAppointmentType(appointment: ExtendedAppointment): string {
    return appointment.appointmentType || 'Therapy Session';
  }

  // Admin calendar methods
  onSlotClicked(event: SchedulerClickEvent) {
    const [hourStr, minuteStr] = event.timeSlot.time.split(':');
    const startHour = parseInt(hourStr, 10);
    const startMinute = parseInt(minuteStr, 10);

    const start = new Date(0, 0, 0, startHour, startMinute);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const formatTime = (date: Date) =>
      date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    const enrichedSlot = {
      ...event.timeSlot,
      startTime: formatTime(start),
      endTime: formatTime(end),
    };

    this.schedulerEvent = {
      ...event,
      timeSlot: enrichedSlot,
    };

    this.showModal = true;
  }

  onModalClose() {
    this.showModal = false;
    this.schedulerEvent = null;
  }

  onAppointmentSubmit(appointmentData: any) {
    console.log('Appointment data:', appointmentData);
    this.onModalClose();
    if (this.schedulerComponent) {
      this.schedulerComponent.loadUsers();
    }
  }

  // Method to create new date for template
  createNewDate(): Date {
    return new Date();
  }

  onAppointmentEdit(event: AppointmentEditEvent) {
  console.log('📌 Edit event received in scheduler:', event);

  this.schedulerEvent = event; // contains ONLY appointmentId
  this.showModal = true;       // open popup
}

}