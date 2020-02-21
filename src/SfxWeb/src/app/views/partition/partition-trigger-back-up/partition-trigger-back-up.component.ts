import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { Partition } from 'src/app/Models/DataModels/Partition';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-partition-trigger-back-up',
  templateUrl: './partition-trigger-back-up.component.html',
  styleUrls: ['./partition-trigger-back-up.component.scss']
})
export class PartitionTriggerBackUpComponent implements OnInit {


  constructor(private formBuilder: FormBuilder,
              private data: DataService,
              @Inject(MAT_DIALOG_DATA) public partition: Partition,
              public dialogRef: MatDialogRef<PartitionTriggerBackUpComponent>) { }
  ngOnInit() {
  }

  ok() {
    this.data.restClient.triggerPartitionBackup(this.partition).subscribe( () => {
      this.cancel();
    }, 
    err => console.log(err));
  }

  cancel() {
    this.dialogRef.close();
  }

}
