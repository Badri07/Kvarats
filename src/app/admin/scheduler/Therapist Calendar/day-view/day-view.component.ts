import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeGridComponent } from '../time-grid/time-grid.component';
import { AppointmentCardComponent } from '../appointment-card/appointment-card.component';
import { CalendarEvent, AvailabilityDto } from '../../../../models/CalendarEvent.model';
import { DateUtils } from '../../../../models/utlis/date.utlis';
import { AuthService } from '../../../../service/auth/auth.service';
import { TherapistAppointmentService } from '../../../../service/scheduler/Appointment.service';

@Component({
  selector: 'app-day-view',
  standalone: false,
  templateUrl: './day-view.component.html',
  styleUrl: './day-view.component.scss'
})
export class DayViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() currentDate!: Date;
  @Input() events: CalendarEvent[] = [];
  @Input() startHour = 0;
  @Input() endHour = 24;
  @Output() eventClick = new EventEmitter<CalendarEvent>();
  @Output() timeSlotClick = new EventEmitter<{ date: Date; hour: number }>();

  unavailableSlots: Map<number, boolean> = new Map();
  userAvailabilities: AvailabilityDto[] = [];
  currentTimePosition = 0;
  showCurrentTimeIndicator = false;
  private timeUpdateInterval: any;

  constructor(
    private appointmentService: TherapistAppointmentService,
    private authService: AuthService
  ) {}

  get dayEvents(): CalendarEvent[] {
    return this.events.filter((event) =>
      DateUtils.isSameDay(new Date(event.date), this.currentDate)
    );
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
    if (!userId) return;

    this.appointmentService.getAvailabilitiesByUserId(userId).subscribe({
      next: (availabilities) => {
        this.userAvailabilities = availabilities.filter(a => a.active && a.isApproved);
        this.updateSlotAvailability();
      },
      error: (error) => {
        // console.error('Failed to load user availabilities:', error);
        this.userAvailabilities = [];
      }
    });
  }

  updateSlotAvailability(): void {
    this.unavailableSlots.clear();
    const dayOfWeek = this.currentDate.getDay();

    this.timeSlots.forEach(slotIndex => {
      const hour = this.startHour + Math.floor(slotIndex / 2);
      const minutes = (slotIndex % 2) * 30;
      const slotStartTime = new Date(this.currentDate);
      slotStartTime.setHours(hour, minutes, 0, 0);
      const slotEndTime = new Date(slotStartTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);

      const isAvailable = this.checkSlotAgainstAvailabilities(dayOfWeek, slotStartTime, slotEndTime);
      this.unavailableSlots.set(slotIndex, !isAvailable);
    });
  }

  checkSlotAgainstAvailabilities(dayOfWeek: number, slotStart: Date, slotEnd: Date): boolean {
    const availabilitiesForDay = this.userAvailabilities.filter(a => a.dayOfWeek === dayOfWeek && a.isAvailable);

    if (availabilitiesForDay.length === 0) {
      return false;
    }

    for (const availability of availabilitiesForDay) {
      const availStartTime = this.parseTimeString(availability.startTime);
      const availEndTime = this.parseTimeString(availability.endTime);

      const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
      const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();

      if (slotStartMinutes >= availStartTime && slotEndMinutes <= availEndTime) {
        return true;
      }
    }

    return false;
  }

  parseTimeString(timeStr: string): number {
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.getHours() * 60 + date.getMinutes();
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  isSlotUnavailable(slotIndex: number): boolean {
    return this.unavailableSlots.get(slotIndex) || false;
  }

  updateCurrentTimePosition(): void {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // console.log('=== DAY VIEW TIME UPDATE ===');
    // console.log('Current time:', now.toLocaleString());
    // console.log('Current time (ISO):', now.toISOString());
    // console.log('Hours:', hours, 'Minutes:', minutes);

    if (hours < this.startHour || hours >= this.endHour) {
      this.showCurrentTimeIndicator = false;
      // console.log('Time outside range, hiding indicator');
      return;
    }

    const isToday = DateUtils.isSameDay(this.currentDate, now);
    this.showCurrentTimeIndicator = isToday;
    // console.log('Is today:', isToday, 'Show indicator:', this.showCurrentTimeIndicator);

    const totalMinutes = (hours - this.startHour) * 60 + minutes;
    this.currentTimePosition = (totalMinutes * 60) / 30;
    // console.log('Start hour:', this.startHour);
    // console.log('Total minutes from start:', totalMinutes);
    // console.log('Position in pixels:', this.currentTimePosition);
    // console.log('Position in hours:', this.currentTimePosition / 120);
    // console.log('===========================');
  }

  getCurrentTimeTop(): number {
    return this.currentTimePosition;
  }

  onTimeSlotClick(index: number): void {
    if (this.isSlotUnavailable(index)) {
      return;
    }
    const hour = this.startHour + Math.floor(index / 2);
    const date = new Date(this.currentDate);
    date.setHours(hour, 0, 0, 0);
    this.timeSlotClick.emit({ date, hour });
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

  getCurrentTimeString(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
