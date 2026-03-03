import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { TimeSlotRowComponent } from '../../admin/scheduler/time-slot-row/time-slot-row.component';

import { SchedulerService } from '../../service/scheduler/scheduler.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarSchedulerComponent } from '../../admin/scheduler/calendar-scheduler/calendar-scheduler.component';
import { SchedulerHeaderComponent } from '../../admin/scheduler/scheduler-header/scheduler-header.component';
import { ButtonComponent } from '../button/button.component';
import { ModalComponent } from '../modal/modal.component';
import { WeekViewComponent } from '../../admin/scheduler/Therapist Calendar/week-view/week-view.component';
import { TimeGridComponent } from '../../admin/scheduler/Therapist Calendar/time-grid/time-grid.component';
import { DayViewComponent } from '../../admin/scheduler/Therapist Calendar/day-view/day-view.component';
import { CalendarHeaderComponent } from '../../admin/scheduler/Therapist Calendar/calendar-header/calendar-header.component';
import { CalendarComponent } from '../../admin/scheduler/Therapist Calendar/calendar/calendar.component';
import { AppointmentSidebarComponent } from '../../admin/scheduler/Therapist Calendar/appointment-sidebar/appointment-sidebar.component';
import { AppointmentModalComponent } from '../../admin/scheduler/Therapist Calendar/appointment-modal/appointment-modal.component';
import { AppointmentCardComponent } from '../../admin/scheduler/Therapist Calendar/appointment-card/appointment-card.component';

@NgModule({
  declarations: [
    CalendarSchedulerComponent,
    SchedulerHeaderComponent,
    TimeSlotRowComponent,
    ButtonComponent,
    ModalComponent,
    WeekViewComponent,
    TimeGridComponent,
    DayViewComponent,
    CalendarHeaderComponent,
    CalendarComponent,
    AppointmentSidebarComponent,
    AppointmentModalComponent,
    AppointmentCardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
 
  ],
  providers: [
    SchedulerService
  ],
  exports: [
    CalendarSchedulerComponent,
    SchedulerHeaderComponent,
    TimeSlotRowComponent,
    ButtonComponent,
    ModalComponent,
    WeekViewComponent,
    TimeGridComponent,
    DayViewComponent,
    CalendarHeaderComponent,
    CalendarComponent,
    AppointmentSidebarComponent,
    AppointmentModalComponent,
    AppointmentCardComponent
  ]
})
export class SchedulerModule { }
