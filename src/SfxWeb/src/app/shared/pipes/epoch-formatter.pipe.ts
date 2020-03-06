import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'epochFormatter'
})
export class EpochFormatterPipe implements PipeTransform {

  transform(value: string | number, ...args: unknown[]): unknown {
    console.log(value)
    return new Date(value).toLocaleString();
  }

}
