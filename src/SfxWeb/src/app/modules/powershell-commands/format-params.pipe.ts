import { Pipe, PipeTransform } from '@angular/core';
import { PowershellCommand } from 'src/app/Models/PowershellCommand';

@Pipe({
  name: 'formatParams',
  pure: false
})
export class FormatParamsPipe implements PipeTransform {

  transform(value: PowershellCommand): {name:string, value:string}[] {
    return value.convertParamsToStringArr();
  }

}
