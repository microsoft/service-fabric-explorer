import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PowershellCommand, CommandSafetyLevel } from 'src/app/Models/PowershellCommand';
import { BadgeConstants } from 'src/app/Common/Constants';

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandComponent  {

  constructor() { }

  @Input() command: PowershellCommand;

  safetyLevelEnum = CommandSafetyLevel;
  BadgeConstants = BadgeConstants;


}
