import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-partition-disable-back-up',
  templateUrl: './partition-disable-back-up.component.html',
  styleUrls: ['./partition-disable-back-up.component.scss']
})
export class PartitionDisableBackUpComponent implements OnInit {

  cleanBackup = false;

  constructor(public dialogRef: MatDialogRef<PartitionDisableBackUpComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction, public dataService: DataService) { }

  ngOnInit() {
  }

  ok(){
    this.data.data.enable(this.cleanBackup).subscribe( () => {
      this.dialogRef.close(false);
    },
    err => {
      console.log(err);
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }

}
