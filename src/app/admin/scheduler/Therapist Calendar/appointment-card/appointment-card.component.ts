import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent, AvailabilityDto,CalendarView,Appointment,Patient,Diagnosis,ServiceItem,CreateAppointmentRequest } from '../../../../models/CalendarEvent.model';
import { DateUtils } from '../../../../models/utlis/date.utlis';
import { AuthService } from '../../../../service/auth/auth.service';
import { TherapistAppointmentService } from '../../../../service/scheduler/Appointment.service';


@Component({
  selector: 'app-appointment-card',
  standalone: false,
  templateUrl: './appointment-card.component.html',
  styleUrl: './appointment-card.component.scss'
})
export class AppointmentCardComponent {
  @Input() event!: CalendarEvent;
  @Output() cardClick = new EventEmitter<void>();

  getTimeRange(): string {
    return DateUtils.formatTimeRange(this.event.startDate, this.event.endDate);
  }

  onClick(event: Event): void {
    event.stopPropagation();
    this.cardClick.emit();
  }
}
