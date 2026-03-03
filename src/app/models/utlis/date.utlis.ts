import { TimeSlot } from '../../models/CalendarEvent.model';

export class DateUtils {
  static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  static getWeekDays(date: Date): Date[] {
    const weekStart = this.getWeekStart(date);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }

    return days;
  }

  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  static formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  static formatTimeRange(start: Date, end: Date): string {
    return `${this.formatTime(start)} - ${this.formatTime(end)}`;
  }

  static parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  }

  static timeStringToDate(dateStr: Date, timeStr: string): Date {
    const date = new Date(dateStr);
    const { hours, minutes } = this.parseTimeString(timeStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  static getHalfHourSlots(startHour: number = 0, endHour: number = 24): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        slots.push({
          hour,
          minute,
          display: this.formatTime(date),
        });
      }
    }

    return slots;
  }

  static calculateEventPosition(
    startTime: string,
    endTime: string,
    startHour: number = 0,
    pixelsPerHour: number = 60
  ): { top: number; height: number } {
    const start = this.parseTimeString(startTime);
    const end = this.parseTimeString(endTime);

    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    const startMinutesOffset = startHour * 60;

    const top = ((startMinutes - startMinutesOffset) / 60) * pixelsPerHour;
    const height = ((endMinutes - startMinutes) / 60) * pixelsPerHour;

    return { top, height };
  }
}
