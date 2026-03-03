import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateUtils } from '../../../../models/utlis/date.utlis';
import { TimeSlot } from '../../../../models/CalendarEvent.model';

@Component({
  selector: 'app-time-grid',
  standalone: false,
  templateUrl: './time-grid.component.html',
  styleUrl: './time-grid.component.scss'
})
export class TimeGridComponent {
  @Input() startHour = 0;
  @Input() endHour = 24;
  @Input() showLabels = true;

  get timeSlots(): TimeSlot[] {
    return DateUtils.getHalfHourSlots(this.startHour, this.endHour);
  }
}
