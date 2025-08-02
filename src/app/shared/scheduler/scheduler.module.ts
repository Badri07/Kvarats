import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { TimeSlotRowComponent } from '../../admin/scheduler/time-slot-row/time-slot-row.component';

import { SchedulerService } from '../../service/scheduler/scheduler.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarSchedulerComponent } from '../../admin/scheduler/calendar-scheduler/calendar-scheduler.component';
import { SchedulerHeaderComponent } from '../../admin/scheduler/scheduler-header/scheduler-header.component';

@NgModule({
  declarations: [
    CalendarSchedulerComponent,
    SchedulerHeaderComponent,
    TimeSlotRowComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    SchedulerService
  ],
  exports: [
    CalendarSchedulerComponent,
    SchedulerHeaderComponent,
    TimeSlotRowComponent
  ]
})
export class SchedulerModule { }
