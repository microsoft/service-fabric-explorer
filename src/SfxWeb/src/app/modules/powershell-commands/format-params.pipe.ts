import { Pipe, PipeTransform } from '@angular/core';
import { PowershellCommand } from 'src/app/Models/PowershellCommand';

@Pipe({
  name: 'formatParams',
})
export class FormatParamsPipe implements PipeTransform {

  transform(value: string): { name: string, value: string }[] {
    const command: PowershellCommand = JSON.parse(value); //fed from a json pipe to detect changes inside the parameters array
    return PowershellCommand.convertParamsToStringArr(command.parameters);
  }

}
