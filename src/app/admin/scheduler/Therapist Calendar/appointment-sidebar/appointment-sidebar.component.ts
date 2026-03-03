import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent, AvailabilityDto,CalendarView,Appointment,Patient,Diagnosis,ServiceItem,CreateAppointmentRequest } from '../../../../models/CalendarEvent.model';
import { DateUtils } from '../../../../models/utlis/date.utlis';
import { AuthService } from '../../../../service/auth/auth.service';
import { TherapistAppointmentService } from '../../../../service/scheduler/Appointment.service';


@Component({
  selector: 'app-appointment-sidebar',
  standalone: false,
  templateUrl: './appointment-sidebar.component.html',
  styleUrl: './appointment-sidebar.component.scss'
})
export class AppointmentSidebarComponent {
  @Input() appointment!: CalendarEvent;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<CalendarEvent>();
  @Output() delete = new EventEmitter<string>();

  showDeleteConfirm = false;

  getFormattedDate(): string {
    return new Date(this.appointment.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  getTimeRange(): string {
    return DateUtils.formatTimeRange(this.appointment.startDate, this.appointment.endDate);
  }

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    this.edit.emit(this.appointment);
  }

  onDeleteClick(): void {
    this.showDeleteConfirm = true;
  }

  onDeleteConfirm(): void {
    this.delete.emit(this.appointment.id);
  }

  onDeleteCancel(): void {
    this.showDeleteConfirm = false;
  }
}
