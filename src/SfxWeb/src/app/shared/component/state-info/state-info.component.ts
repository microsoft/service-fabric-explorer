import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { IRawPartition, IRawServiceDescription } from 'src/app/Models/RawDataTypes';


export interface IKeyValue {
  key: string;
  value: string;
}

@Component({
  selector: 'app-state-info',
  templateUrl: './state-info.component.html',
  styleUrls: ['./state-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StateInfoComponent implements OnChanges {
  @Input() stateful = false;
  @Input() data: IRawServiceDescription | IRawPartition;

  keyvalues: IKeyValue[] = [];

  constructor() { }

  ngOnChanges(): void {
    this.keyvalues = [];
    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
    //Add '${implements OnChanges}' to the class.
    if(this.data.ServiceKind === "Stateful") {
      this.keyvalues.push({
        key: "Minimum Replica Set Size",
        value: this.data.MinReplicaSetSize.toString()
      })
      this.keyvalues.push({
        key: "Target Replica Set Size",
        value: this.data.TargetReplicaSetSize.toString()
      })
    }else if(this.data.ServiceKind === "Stateless") {
      this.keyvalues.push({
        key: "Instance Count",
        value: this.data.InstanceCount.toString()
      })
      this.keyvalues.push({
        key: "Minimum Instance Count",
        value: this.data.MinInstanceCount.toString()
      })
    }else if(this.data.ServiceKind === "SelfReconfiguring") {
      this.keyvalues.push({
        key: "Instance Count",
        value: this.data.InstanceCount.toString()
      })
      this.keyvalues.push({
        key: "Minimum Instance Count",
        value: this.data.InstanceCount.toString()
      })
    }
  }

}
