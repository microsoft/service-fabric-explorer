import { Pipe, PipeTransform } from '@angular/core';
import { TimeUtils } from 'src/app/Utils/TimeUtils';

@Pipe({
  name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {

  transform(value: string | number): string {
    return TimeUtils.getDuration(value);
  }

}
