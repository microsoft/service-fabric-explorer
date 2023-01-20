import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventChip } from '../event-chip/event-chip.component';

type EventType =
  "Cluster" |
  "Node" |
  'Application' |
  'Service' |
  'Replica' |
  "Partition" |
  "RepairTask"


@Component({
  selector: 'app-chip-modal',
  templateUrl: './chip-modal.component.html',
  styleUrls: ['./chip-modal.component.scss']
})
export class ChipModalComponent {

  types: EventType[] = ['Cluster', 'Node', 'Application', 'Service', 'Partition', 'Replica', 'RepairTask'];

  constructor(public dialogRef: MatDialogRef<ChipModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventChip) { }

  
  setType(event: any) {
    this.data.type = event.target.value;
  }

  formInvalid() : boolean {
    let result = true;
    if (this.data.type?.length) {
      result = false;
      if (this.data.type === 'Replica' && !this.data.partitionId?.length) {
        result = true;
      }
    }
    return result;
  }

  ok(){
    this.dialogRef.close(this.data);
  }

  cancel() {
    this.dialogRef.close(false);
  }
  
}
