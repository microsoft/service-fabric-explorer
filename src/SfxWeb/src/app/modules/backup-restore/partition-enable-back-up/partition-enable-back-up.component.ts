import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-partition-enable-back-up',
  templateUrl: './partition-enable-back-up.component.html',
  styleUrls: ['./partition-enable-back-up.component.scss']
})
export class PartitionEnableBackUpComponent implements OnInit {

  backupPolicyName = '';

  constructor(public dialogRef: MatDialogRef<PartitionEnableBackUpComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction, public dataService: DataService) { }

  ngOnInit() {
    this.dataService.backupPolicies.ensureInitialized().subscribe();
  }

  ok(){
    this.data.data.enable(this.backupPolicyName).subscribe( () => {
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
