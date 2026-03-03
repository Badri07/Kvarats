// pipes/format-date.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateFormatService } from '../../service/global-date/date-format-service';

@Pipe({
  name: 'formatDate',
  pure: false
})
export class FormatDatePipe implements PipeTransform {
  private dateFormatService = inject(DateFormatService);

  transform(value: Date | string | null | undefined): string {
    return this.dateFormatService.formatDate(value);
  }
}