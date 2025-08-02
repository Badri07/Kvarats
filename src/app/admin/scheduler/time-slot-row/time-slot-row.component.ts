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
} from '../../../models/scheduler.interface';
import { DatePipe, formatDate } from '@angular/common';
import { PopupService } from '../../../service/popup/popup-service';
import { Slot } from '../../../models/scheduler';

@Component({
  selector: 'app-time-slot-row',
  templateUrl: './time-slot-row.component.html',
  styleUrls: ['./time-slot-row.component.scss'],
  standalone: false,
   providers: [DatePipe]
})
export class TimeSlotRowComponent {
 @Output() slotClicked = new EventEmitter<SchedulerClickEvent>();

  users: User[] = [];
  timeSlots: TimeSlot[] = [];
  selectedDate: Date = new Date();
  loading: boolean = true;
  currentTime: Date = new Date();
  currentTimePosition: number = 0;
  private timeUpdateInterval: any;


  public _loader = inject(PopupService )
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
    
    // Set initial scroll position to 9:00 AM after view initialization
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
    startOfDay.setHours(0, 0, 0, 0); // 12:00:00 AM

    // Calculate milliseconds since midnight
    const msSinceMidnight = now.getTime() - startOfDay.getTime();
    const minutesSinceMidnight = msSinceMidnight / (1000 * 60);

    // Debug output
    console.log('Actual Time:', now.toLocaleTimeString());
    console.log('Minutes since midnight:', minutesSinceMidnight);

    // Constants (match your layout)
    const slotHeight = 48; // 48px per 30-minute slot (h-12)
    const minutesPerSlot = 30;

    // Calculate position
    const position = (minutesSinceMidnight / minutesPerSlot) * slotHeight;
    console.log('Calculated position (px):', position);

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
  const existingAppointment = this.getAppointmentForSlot(user, timeSlot.id);
  if (
    existingAppointment ||
    !this.isSlotWithinAvailability(user, timeSlot.time)
  ) {
    return;
  }

  console.log('Clicked slot time:', timeSlot.time);

  const dateStr = this.selectedDate.toISOString().split('T')[0]; 
  const timeStr = timeSlot.time; 

  const fullDateTimeString = `${dateStr} ${timeStr}`;

  const start = new Date(fullDateTimeString);

  if (isNaN(start.getTime())) {
    console.error('Invalid timeSlot.time:', timeSlot.time);
    return;
  }

  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const startTime = formatDate(start, 'hh:mm a', 'en-US');
  const endTime = formatDate(end, 'hh:mm a', 'en-US');

  const slotData: Slot = {
  userId: user.id,
  date: formatDate(this.selectedDate, "yyyy-MM-dd'T'00:00:00", 'en-US'),
  startTime,
  endTime,
};


  this.schedulerService.getCheckUserAvailability(slotData).subscribe({
    next: (response) => {
      console.log('API success:', response);
       this.schedulerService.setAvailabilityStatus(response);
    },
    error: (err) => {
      console.error('API failed:', err);
    }
  });

  const clickEvent: SchedulerClickEvent = {
    userId: user.id,
    userName: user.name,
    date: dateStr,
    timeSlot: timeSlot,
    isAddEvent: false,
  };

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
      isAddEvent: true,
    };

    this.slotClicked.emit(clickEvent);
  }

  getAppointmentForSlot(user: User, timeSlotId: string): Appointment | null {
    if (!user.appointments || user.appointments.length === 0) return null;
    return (
      user.appointments.find((apt) => apt.timeSlotId === timeSlotId) || null
    );
  }

  getAppointmentStyle(appointment: Appointment): any {
    const slots = Math.ceil((appointment.duration || 30) / 30); // fallback to 30 min
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
    debugger
    this._loader.show();

    const formattedDate =
      this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd') ?? '';

    this.schedulerService.getSchedulerUsersByDate(formattedDate).subscribe({
      next: (users) => {
        console.log(users);
        
        this.schedulerService.setTherapistList(users);
        this.users = users.map((user) => ({
          
          ...user,
          appointments: user.appointments || [],
        }));
this._loader.hide();      },
      error: (error) => {
        console.error('Error loading users:', error);
this._loader.hide();        this.users = [];
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

    const [fromHour, fromMinute] = user.availableFrom.split(':').map(Number);
    const fromTime = fromHour * 60 + fromMinute;

    const [toHour, toMinute] = user.availableTo.split(':').map(Number);
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

    // Only disable past time slots if the selected date is today
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
    // Find the 9:00 AM time slot (slot index 18: 9:00-9:30)
    const nineAMSlotIndex = 18; // 9:00 AM is the 18th slot (0-based: 0:00, 0:30, 1:00... 9:00)
    const slotHeight = 48; // 48px per slot (h-12)
    const headerHeight = 144; // Height of the therapist header
    
    // Calculate scroll position
    const scrollPosition = (nineAMSlotIndex * slotHeight);
    
    // Get the scheduler body element and scroll to position
    const schedulerBody = document.querySelector('.scheduler-body');
    if (schedulerBody) {
      schedulerBody.scrollTop = scrollPosition;
    }
  }
}
