import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  inject,
} from '@angular/core';
import { SchedulerService } from '../../../service/scheduler/scheduler.service';
import {
  User,
  TimeSlot,
  SchedulerClickEvent,
  Appointment,
  AppointmentEditEvent,
} from '../../../models/scheduler.interface';
import { DatePipe, formatDate } from '@angular/common';
import { PopupService } from '../../../service/popup/popup-service';

@Component({
  selector: 'app-time-slot-row',
  templateUrl: './time-slot-row.component.html',
  styleUrls: ['./time-slot-row.component.scss'],
  standalone: false,
  providers: [DatePipe]
})
export class TimeSlotRowComponent implements OnInit, OnDestroy {
  @Output() slotClicked = new EventEmitter<SchedulerClickEvent>();
  @Output() appointmentClicked = new EventEmitter<AppointmentEditEvent>();


  users: User[] = [];
  timeSlots: TimeSlot[] = [];
  selectedDate: Date = new Date();
  loading: boolean = true;
  currentTime: Date = new Date();
  currentTimePosition: number = 0;
  private timeUpdateInterval: any;

  public _loader = inject(PopupService)
  constructor(
    private schedulerService: SchedulerService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.selectedDate = new Date();
    this.generateTimeSlots();
    this.loadUsers();
    this.updateCurrentTime();
    this.startTimeUpdater();
    
    setTimeout(() => {
      this.scrollTo9AM();
    }, 100);
  }

  ngOnDestroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  startTimeUpdater() {
    this.timeUpdateInterval = setInterval(() => {
      this.updateCurrentTime();
    }, 60000);
  }

  updateCurrentTime() {
    this.currentTime = new Date();
    this.calculateCurrentTimePosition();
  }

  calculateCurrentTimePosition() {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const msSinceMidnight = now.getTime() - startOfDay.getTime();
    const minutesSinceMidnight = msSinceMidnight / (1000 * 60);

    const slotHeight = 48;
    const minutesPerSlot = 30;

    const position = (minutesSinceMidnight / minutesPerSlot) * slotHeight;
    this.currentTimePosition = position - 11.2;
  }

  isCurrentTimeVisible(): boolean {
    return this.selectedDate.toDateString() === new Date().toDateString();
  }

  getCurrentTimeString(): string {
    return this.currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }


onSlotClick(user: User, timeSlot: TimeSlot): void {
  debugger
  
  const existingAppointment = this.getAppointmentForSlot(user, timeSlot);
  if (
    existingAppointment ||
    !this.isSlotWithinAvailability(user, timeSlot.time)
  ) {
    return;
  }

  console.log('Clicked slot time:', timeSlot.time);

  const dateStr = this.selectedDate.toISOString().split('T')[0]; 
  const timeStr = timeSlot.time; 

  // Create the start time - FIXED: Use exact time from slot
  const [hour, minute] = timeStr.split(':').map(Number);
  const start = new Date(this.selectedDate);
  start.setHours(hour, minute, 0, 0);

  // Calculate end time (30 minutes later)
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  // Format times exactly as they should appear
  const formatTimeForDisplay = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const startTime = formatTimeForDisplay(start); // Should be "3:00 PM"
  const endTime = formatTimeForDisplay(end);     // Should be "3:30 PM"

  console.log('Time calculations:', {
    slotTime: timeStr,
    startTime: startTime,
    endTime: endTime
  });

  const slotData: any = {
    userId: user.id,
    date: formatDate(this.selectedDate, "yyyy-MM-dd'T'00:00:00", 'en-US'),
    startTime: startTime,
    endTime: endTime,
  };

  // Call availability API (optional - for additional checks)
  this.schedulerService.getCheckUserAvailability(slotData).subscribe({
    next: (response) => {
      // ADD THERAPIST NAME TO THE RESPONSE
      response.userName = user.name;
      response.date = dateStr;
      response.startTime = startTime;
      response.endTime = endTime;
      
      console.log('Sending to availability service:', response);
      this.schedulerService.setAvailabilityStatus(response);
    },
    error: (err) => {
      console.error('API failed:', err);
    }
  });

  // Create the click event with ALL necessary data
  const clickEvent: any = {
    userId: user.id,
    userName: user.name,
    date: dateStr,
    timeSlot: {
      id: timeSlot.id,
      time: timeSlot.time,
      displayTime: timeSlot.displayTime,
      hour: timeSlot.hour,
      minute: timeSlot.minute
    },
    startTime: startTime,  // This is the start time
    endTime: endTime,      // This is the end time
    isAddEvent: false,
  };

  console.log('🟢 EMITTING SLOT CLICK EVENT:', {
    therapist: clickEvent.userName,
    date: clickEvent.date,
    time: clickEvent.timeSlot.displayTime,
    start: clickEvent.startTime,  // Should be "3:00 PM"
    end: clickEvent.endTime,      // Should be "3:30 PM"
  });

  this.slotClicked.emit(clickEvent);
}

  onAddEventClick(): void {
    const clickEvent: SchedulerClickEvent = {
      userId: '',
      userName: '',
      date: this.selectedDate.toISOString().split('T')[0],
      timeSlot: {
        id: '',
        time: '',
        displayTime: '',
        hour: 0,
        minute: 0,
      },
      startTime: '',
      endTime: '',
      isAddEvent: true,
    };

    this.slotClicked.emit(clickEvent);
  }

  getAppointmentForSlot(user: any, timeSlot: any): any {
    if (!user.appointments || !user.appointments.length) {
      return null;
    }

    const appointment = user.appointments.find((apt: any) => {
      return apt.startTime === timeSlot.time;
    });

    return appointment;
  }

  getAppointmentStyle(appointment: Appointment): any {
    const slots = Math.ceil((appointment.duration || 30) / 30);
    return {
      'background-color': appointment.color || '#90cdf4',
      height: `${slots * 100}%`,
      'min-height': '30px',
    };
  }

  generateTimeSlots() {
    this.timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot: TimeSlot = {
          id: `${hour}-${minute}`,
          time: `${hour.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}`,
          displayTime: this.formatDisplayTime(hour, minute),
          hour,
          minute,
        };
        this.timeSlots.push(timeSlot);
      }
    }
  }

  formatDisplayTime(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  loadUsers() {
    this._loader.show();

    const formattedDate =
      this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd') ?? '';

    this.schedulerService.getSchedulerUsersByDate(formattedDate).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.schedulerService.setTherapistList(response.data);
          
          this.users = response.data.map((user: any) => ({
            ...user,
            appointments: user.appointments || [],
          }));
        } else {
          console.warn('No user data found in response');
          this.users = [];
        }
        this._loader.hide();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this._loader.hide();
        this.users = [];
      },
    });
  }

  onDateChange(event: any) {
    this.selectedDate = new Date(event.target.value);
    this.loadUsers();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-status-available';
      case 'busy':
        return 'bg-status-busy';
      case 'away':
        return 'bg-status-away';
      default:
        return 'bg-status-offline';
    }
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  isSlotWithinAvailability(user: User, time: string): boolean {
    if (!user.availableFrom || !user.availableTo) return false;

    const [slotHour, slotMinute] = time.split(':').map(Number);
    const slotTime = slotHour * 60 + slotMinute;

    let fromHour, fromMinute;
    if (user.availableFrom.includes(' ')) {
      const [timePart, period] = user.availableFrom.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      fromHour = hours;
      fromMinute = minutes;
    } else {
      [fromHour, fromMinute] = user.availableFrom.split(':').map(Number);
    }

    let toHour, toMinute;
    if (user.availableTo.includes(' ')) {
      const [timePart, period] = user.availableTo.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      toHour = hours;
      toMinute = minutes;
    } else {
      [toHour, toMinute] = user.availableTo.split(':').map(Number);
    }

    const fromTime = fromHour * 60 + fromMinute;
    const toTime = toHour * 60 + toMinute;

    return slotTime >= fromTime && slotTime < toTime;
  }

  isPastTimeSlot(slotTime: string): boolean {
    const [hour, minute] = slotTime.split(':').map(Number);

    const slotDate = new Date(
      this.selectedDate.getFullYear(),
      this.selectedDate.getMonth(),
      this.selectedDate.getDate(),
      hour,
      minute
    );

    const now = new Date();

    const isToday = this.selectedDate.toDateString() === now.toDateString();
    
    return isToday && slotDate < now;
  }

  goToPreviousDay() {
    this.selectedDate = new Date(this.selectedDate);
    this.selectedDate.setDate(this.selectedDate.getDate() - 1);
    this.loadSchedulerDataForDate();
  }

  goToNextDay() {
    this.selectedDate = new Date(this.selectedDate);
    this.selectedDate.setDate(this.selectedDate.getDate() + 1);
    this.loadSchedulerDataForDate();
  }

  loadSchedulerDataForDate() {
    this.loadUsers();
  }

  scrollTo9AM() {
    const nineAMSlotIndex = 18;
    const slotHeight = 48;
    
    const scrollPosition = (nineAMSlotIndex * slotHeight);
    const schedulerBody = document.querySelector('.scheduler-body');
    if (schedulerBody) {
      schedulerBody.scrollTop = scrollPosition;
    }
  }

  isPastDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  onAppointmentClick(user: User, appointment: any): void {
  
  const appointmentId = appointment.id.replace('apt-', '');

  const clickEvent: AppointmentEditEvent = {
    appointmentId,
    isAddEvent: false
  };

  this.appointmentClicked.emit(clickEvent);
  console.log('✏️ Appointment clicked:', clickEvent);
}


}