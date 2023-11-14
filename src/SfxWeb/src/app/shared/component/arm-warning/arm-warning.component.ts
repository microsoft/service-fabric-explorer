import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-arm-warning',
  templateUrl: './arm-warning.component.html',
  styleUrls: ['./arm-warning.component.scss']
})
export class ArmWarningComponent{

  @Input() armWarningText = "This is an ARM managed resource. ARM managed resources should only be modified during ARM deployments.";
  @Input() resourceId: string;

}
