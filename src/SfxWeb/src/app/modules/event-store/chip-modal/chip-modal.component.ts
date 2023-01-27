import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from 'src/app/services/data.service';
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
export class ChipModalComponent implements OnInit{

  types: EventType[] = ['Cluster', 'Node', 'Application', 'Service', 'Partition', 'Replica', 'RepairTask'];

  chip: EventChip;

  appNames: string[];
  nodeNames: string[];

  constructor(public dataService: DataService, public dialogRef: MatDialogRef<ChipModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EventChip) { }

  
  ngOnInit(): void {
    this.chip = new EventChip(this.data);

    this.dataService.getNodes(true).subscribe(nodes => {
      this.nodeNames = nodes.collection.map(node => node.name);
    })
    this.dataService.getApps(true).subscribe(apps => {
      this.appNames = apps.collection.map(app => app.name);
    })
    
  }
  
  setType(event: any) {
    this.chip.type = event.target.value;
  }

  setId(event: any) {
    this.chip.id = event.target.value;
  }
  
  formInvalid() : boolean {
    let result = true;
    if (this.chip.type?.length) {
      result = false;
      if (this.chip.type === 'Replica' && !this.chip.partitionId?.length) {
        result = true;
      }
    }
    return result;
  }

  ok(){
    this.dialogRef.close(this.chip);
  }

  delete() {
    this.dialogRef.close(true);
  }
  cancel() {
    this.chip = new EventChip(this.data);
    this.dialogRef.close(false);
  }
  
}
