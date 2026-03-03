import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent, AvailabilityDto,CalendarView } from '../../../../models/CalendarEvent.model';
import { DateUtils } from '../../../../models/utlis/date.utlis';
import { AuthService } from '../../../../service/auth/auth.service';
import { TherapistAppointmentService } from '../../../../service/scheduler/Appointment.service';

@Component({
  selector: 'app-calendar-header',
  standalone: false,
  templateUrl: './calendar-header.component.html',
  styleUrl: './calendar-header.component.scss'
})
export class CalendarHeaderComponent {
  @Input() currentDate!: Date;
  @Input() view!: CalendarView;
  @Output() dateChange = new EventEmitter<Date>();
  @Output() viewChange = new EventEmitter<CalendarView>();
  @Output() todayClick = new EventEmitter<void>();

  views: CalendarView[] = ['day', 'week', 'month'];

  getFormattedDate(): string {
    if (this.view === 'day') {
      return this.currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (this.view === 'week') {
      const weekStart = DateUtils.getWeekStart(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleDateString('en-US', {
          month: 'long',
        })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      }

      return `${weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} - ${weekEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }

    return this.currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  navigateDate(direction: 'prev' | 'next'): void {
    const newDate = new Date(this.currentDate);

    if (this.view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (this.view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }

    this.dateChange.emit(newDate);
  }

  onTodayClick(): void {
    this.todayClick.emit();
  }

  onViewChange(view: CalendarView): void {
    this.viewChange.emit(view);
  }
}
