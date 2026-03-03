import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeGridComponent } from '../time-grid/time-grid.component';
import { AppointmentCardComponent } from '../appointment-card/appointment-card.component';
import { CalendarEvent, AvailabilityDto } from '../../../../models/CalendarEvent.model';
import { DateUtils } from '../../../../models/utlis/date.utlis';
import { AuthService } from '../../../../service/auth/auth.service';
import { TherapistAppointmentService } from '../../../../service/scheduler/Appointment.service';

@Component({
  selector: 'app-week-view',
  standalone: false,
  templateUrl: './week-view.component.html',
  styleUrl: './week-view.component.scss'
})
export class WeekViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() currentDate!: Date;
  @Input() events: CalendarEvent[] = [];
  @Input() startHour = 0;
  @Input() endHour = 24;
  @Output() eventClick = new EventEmitter<CalendarEvent>();
  @Output() timeSlotClick = new EventEmitter<{ date: Date; hour: number }>();

  today = new Date();
  unavailableSlots: Map<string, boolean> = new Map();
  userAvailabilities: AvailabilityDto[] = [];
  currentTimePosition = 0;
  showCurrentTimeIndicator = false;
  hoveredSlot: string | null = null;
  private timeUpdateInterval: any;

  constructor(
    private appointmentService: TherapistAppointmentService,
    private authService: AuthService
  ) {}

  get weekDays(): Date[] {
    return DateUtils.getWeekDays(this.currentDate);
  }

  get timeSlots(): number[] {
    const slots: number[] = [];
    for (let i = 0; i < (this.endHour - this.startHour) * 2; i++) {
      slots.push(i);
    }
    return slots;
  }

  ngOnInit(): void {
    this.loadUserAvailabilities();
    this.updateCurrentTimePosition();
    this.timeUpdateInterval = setInterval(() => {
      this.updateCurrentTimePosition();
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate']) {
      this.updateSlotAvailability();
    }
  }

  loadUserAvailabilities(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      return;
    }
    
    this.appointmentService.getAvailabilitiesByUserId(userId).subscribe({
      next: (availabilities) => {      
        this.userAvailabilities = availabilities || [];            
        this.checkTodaysAvailability();
        this.updateSlotAvailability();
      },
      error: (error) => {
        this.userAvailabilities = [];
        this.updateSlotAvailability();
      }
    });
  }

  updateSlotAvailability(): void {
    this.unavailableSlots.clear();
    this.weekDays.forEach(day => {
      const dayOfWeek = day.getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      
      const availabilityForDay = this.userAvailabilities.find(a => a.dayOfWeek === dayOfWeek);
      this.timeSlots.forEach(slotIndex => {
        const hour = this.startHour + Math.floor(slotIndex / 2);
        const minutes = (slotIndex % 2) * 30;
        const slotStartTime = new Date(day);
        slotStartTime.setHours(hour, minutes, 0, 0);
        const slotEndTime = new Date(slotStartTime);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);

        const isAvailable = this.checkSlotAgainstAvailabilities(dayOfWeek, slotStartTime, slotEndTime);
        const key = this.getSlotKey(day, slotIndex);
        this.unavailableSlots.set(key, !isAvailable);
      });
    });
  }

  checkTodaysAvailability(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const availabilityForToday = this.userAvailabilities.find(a => a.dayOfWeek === dayOfWeek);  
    if (availabilityForToday) {
    } else {
    }
  }

  checkSlotAgainstAvailabilities(dayOfWeek: number, slotStart: Date, slotEnd: Date): boolean {
    const availabilityForDay = this.userAvailabilities.find(a => a.dayOfWeek === dayOfWeek);
    
    if (!availabilityForDay || !availabilityForDay.isAvailable) {
      return false;
    }
    
    const availStart = this.parseTimeString(availabilityForDay.startTime);
    const availEnd = this.parseTimeString(availabilityForDay.endTime);
    const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
    return slotStartMinutes >= availStart && slotStartMinutes < availEnd;
  }

  parseTimeString(timeStr: string): number {  
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      const result = date.getHours() * 60 + date.getMinutes();
      return result;
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = hours * 60 + (minutes || 0);
    return result;
  }

  getSlotKey(day: Date, slotIndex: number): string {
    return `${day.toDateString()}-${slotIndex}`;
  }

  // NEW: Check if a day is in the past
  isPastDay(day: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDay = new Date(day);
    compareDay.setHours(0, 0, 0, 0);
    return compareDay < today;
  }

  // NEW: Check if a time slot is in the past
  isPastTimeSlot(day: Date, slotIndex: number): boolean {
    const now = new Date();
    const slotStartTime = this.getSlotDateTime(day, slotIndex);
    return slotStartTime < now;
  }

  // NEW: Get the actual datetime for a slot
  getSlotDateTime(day: Date, slotIndex: number): Date {
    const hour = this.startHour + Math.floor(slotIndex / 2);
    const minutes = (slotIndex % 2) * 30;
    const slotDateTime = new Date(day);
    slotDateTime.setHours(hour, minutes, 0, 0);
    return slotDateTime;
  }

  isSlotUnavailable(day: Date, slotIndex: number): boolean {
    // Check if day is in the past
    if (this.isPastDay(day)) {
      return true;
    }

    // Check if time slot is in the past (for today)
    if (this.isToday(day) && this.isPastTimeSlot(day, slotIndex)) {
      return true;
    }

    const dayOfWeek = day.getDay();
    const dayAvailability = this.userAvailabilities.find(avail => avail.dayOfWeek === dayOfWeek);
    
    // If no availability data found for this day, consider it unavailable
    if (!dayAvailability) {
      return true;
    }
    
    // If therapist is not available on this day
    if (!dayAvailability.isAvailable) {
      return true;
    }
    
    // If therapist has leave on this day
    if (dayAvailability.hasLeave) {
      const leaveInfo = dayAvailability.leaveInfo;
      
      // If it's a full day leave, disable all slots
      if (leaveInfo?.isFullDay) {
        return true;
      }
      
      // If it's a partial day leave, disable only the affected time slots
      if (leaveInfo?.fromTime && leaveInfo?.toTime) {
        const slotStartTime = this.getSlotStartTime(slotIndex);
        const slotEndTime = this.getSlotEndTime(slotIndex);
        const leaveStart = this.timeToMinutes(leaveInfo.fromTime);
        const leaveEnd = this.timeToMinutes(leaveInfo.toTime);
        const slotStart = this.timeToMinutes(slotStartTime);
        const slotEnd = this.timeToMinutes(slotEndTime);
        
        // Check if slot overlaps with leave time
        return this.isTimeOverlap(slotStart, slotEnd, leaveStart, leaveEnd);
      }
    }
    
    // Check if slot is outside working hours
    if (dayAvailability.startTime && dayAvailability.endTime) {
      const slotStartTime = this.getSlotStartTime(slotIndex);
      const slotEndTime = this.getSlotEndTime(slotIndex);
      const workStart = this.timeToMinutes(dayAvailability.startTime);
      const workEnd = this.timeToMinutes(dayAvailability.endTime);
      const slotStart = this.timeToMinutes(slotStartTime);
      const slotEnd = this.timeToMinutes(slotEndTime);
      
      return slotStart < workStart || slotEnd > workEnd;
    }
    
    return false;
  }

  getSlotStartTime(slotIndex: number): string {
    const totalMinutes = this.startHour * 60 + slotIndex * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getSlotEndTime(slotIndex: number): string {
    const totalMinutes = this.startHour * 60 + (slotIndex + 1) * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  isTimeOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 < end2 && end1 > start2;
  }

  updateCurrentTimePosition(): void {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours < this.startHour || hours >= this.endHour) {
      this.showCurrentTimeIndicator = false;
      return;
    }

    const isToday = this.weekDays.some(day => DateUtils.isSameDay(day, now));
    this.showCurrentTimeIndicator = isToday;
    const totalMinutes = (hours - this.startHour) * 60 + minutes;
    this.currentTimePosition = (totalMinutes * 60) / 30;
  }

  getCurrentTimeTop(): number {
    return this.currentTimePosition;
  }

  getCurrentTimeString(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  shouldShowIndicatorForDay(day: Date): boolean {
    return this.showCurrentTimeIndicator && DateUtils.isSameDay(day, new Date());
  }

  getEventsForDay(day: Date): CalendarEvent[] {
    return this.events.filter((event) =>
      DateUtils.isSameDay(new Date(event.date), day)
    );
  }

  isToday(date: Date): boolean {
    return DateUtils.isSameDay(date, this.today);
  }

  onTimeSlotClick(day: Date, index: number): void {
    const key = this.getSlotKey(day, index);
    const isUnavailable = this.isSlotUnavailable(day, index);
    
    if (isUnavailable) {
      return;
    }
    
    const hour = this.startHour + Math.floor(index / 2);
    const date = new Date(day);
    date.setHours(hour, 0, 0, 0);
    this.timeSlotClick.emit({ date, hour });
  }

  // NEW: Hover handlers for showing + icon
  onSlotHover(day: Date, index: number): void {
    const isUnavailable = this.isSlotUnavailable(day, index);
    if (!isUnavailable) {
      this.hoveredSlot = this.getSlotKey(day, index);
    }
  }

  onSlotLeave(): void {
    this.hoveredSlot = null;
  }

  // NEW: Check if slot is currently hovered
  isSlotHovered(day: Date, index: number): boolean {
    return this.hoveredSlot === this.getSlotKey(day, index);
  }

  getSlotHour(slotIndex: number): number {
    return this.startHour + Math.floor(slotIndex / 2);
  }

  getSlotMinutes(slotIndex: number): string {
    return (slotIndex % 2 === 0) ? '00' : '30';
  }

  getDisplayTime(slotIndex: number): string {
    const hour = this.startHour + Math.floor(slotIndex / 2);
    const minutes = (slotIndex % 2 === 0) ? '00' : '30';
    return `${hour}:${minutes}`;
  }

  getFormattedSlotTime(slotIndex: number): string {
    const hour = this.getSlotHour(slotIndex);
    const minutes = this.getSlotMinutes(slotIndex);
    return `${hour}:${minutes}`;
  }

  onEventClick(event: CalendarEvent): void {
    this.eventClick.emit(event);
  }

  getEventPosition(event: CalendarEvent): { top: number; height: number } {
    return DateUtils.calculateEventPosition(
      event.startTime,
      event.endTime,
      this.startHour,
      60
    );
  }
}