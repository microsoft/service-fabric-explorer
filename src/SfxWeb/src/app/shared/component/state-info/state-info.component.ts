import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IRawPartition, IRawServiceDescription } from 'src/app/Models/RawDataTypes';



@Component({
  selector: 'app-state-info',
  templateUrl: './state-info.component.html',
  styleUrls: ['./state-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StateInfoComponent {

  @Input() stateful = false;
  @Input() data: IRawServiceDescription | IRawPartition;

  constructor() { }
}
