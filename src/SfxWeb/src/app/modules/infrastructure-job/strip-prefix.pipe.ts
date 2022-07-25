import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripPrefix'
})
export class StripPrefixPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.replace(`fabric:/System/InfrastructureService/` ,'');
  }

}
