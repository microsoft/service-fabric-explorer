import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ticksFormatter'
})
export class TicksFormatterPipe implements PipeTransform {

  transform(value: string | number, ...args: unknown[]): unknown {
  //   //ticks are in nanotime; convert to microtime
  // var ticksToMicrotime = +value / 10000;

  // //ticks are recorded from 1/1/1; get microtime difference from 1/1/1/ to 1/1/1970
  //   var epochMicrotimeDiff = 2208988800000;
  //   return new Date(ticksToMicrotime - epochMicrotimeDiff).toLocaleDateString();
  return new Date ( +value / 10000 - 11644473600000 );
  }

}
