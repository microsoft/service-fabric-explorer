import { Pipe, PipeTransform } from '@angular/core';
import { PowershellCommand } from 'src/app/Models/PowershellCommand';

@Pipe({
  name: 'toScript'
})
export class ToScriptPipe implements PipeTransform {

  transform(value: string): string {
    const command: PowershellCommand = JSON.parse(value); //fed from a json pipe to detect changes inside the parameters array
    return PowershellCommand.GetCommandScript(command);
  }

}
