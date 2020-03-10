import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ticksFormatter'
})
export class TicksFormatterPipe implements PipeTransform {

  transform(value: string | number, ...args: unknown[]): unknown {
    return new Date ( +value / 10000 - 11644473600000 ).toLocaleString();
  }

}
