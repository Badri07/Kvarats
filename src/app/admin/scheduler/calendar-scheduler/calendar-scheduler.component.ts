import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { User, TimeSlot, Appointment } from '../../../models/scheduler.interface';
import { SchedulerService } from '../../../service/scheduler/scheduler.service';
import { PopupService } from '../../../service/popup/popup-service';
import { BreadcrumbService } from '../../../shared/breadcrumb/breadcrumb.service';
import { SchedulerClickEvent } from '../../../models/scheduler';
import { TimeSlotRowComponent } from '../time-slot-row/time-slot-row.component';

@Component({
  selector: 'app-calendar-scheduler',
  templateUrl: './calendar-scheduler.component.html',
  styleUrls: ['./calendar-scheduler.component.scss'],
  standalone: false
})
export class CalendarSchedulerComponent {
  showModal = false;
  schedulerEvent: SchedulerClickEvent | null = null;
  private _loader = inject(PopupService);

  @ViewChild(TimeSlotRowComponent) schedulerComponent!: TimeSlotRowComponent;

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

    // Call your API to create the appointment
    // await this.apiService.saveAppointment(appointmentData).toPromise();

    this.onModalClose();

    // Refresh scheduler to reflect the newly added appointment
    this.schedulerComponent.loadUsers();
  }
}
