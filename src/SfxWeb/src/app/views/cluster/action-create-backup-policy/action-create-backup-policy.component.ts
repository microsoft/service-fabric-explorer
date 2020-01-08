import { Component, OnInit, Inject } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { IRawBackupPolicy, IRawRetentionPolicy } from 'src/app/Models/RawDataTypes';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-action-create-backup-policy',
  templateUrl: './action-create-backup-policy.component.html',
  styleUrls: ['./action-create-backup-policy.component.scss']
})
export class ActionCreateBackupPolicyComponent implements OnInit {

  public backupPolicy: IRawBackupPolicy = {
      Name: "",
      AutoRestoreOnDataLoss: false,
      MaxIncrementalBackups: 0,
      Schedule: {
        ScheduleKind: "",
        ScheduleFrequencyType: "",
        RunDays: [],
        RunTimes: [],
        Interval: ""
      },
      Storage: {
        StorageKind: "",
        FriendlyName: "",
        Path: "",
        ConnectionString: "",
        ContainerName: "",
        PrimaryUserName: "",
        PrimaryPassword: "",
        SecondaryUserName: "",
        SecondaryPassword: ""
      }
  };
  public date: string = "";
  public retentionPolicyRequired: boolean = false;
  public RetentionPolicy: IRawRetentionPolicy = {
    RetentionPolicyType: "",
    MinimumNumberOfBackups: 0,
    RetentionDuration: ""
  };
  public weekDay: string[]  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  public daySelectedMapping: Record<string, Boolean> = {};

  isUpdateOperation: boolean = false;

  constructor(public dialogRef: MatDialogRef<ActionCreateBackupPolicyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IRawBackupPolicy,
    private dataService: DataService) {
        this.isUpdateOperation = !!data;
        
    //   super(
    //       data.$uibModal,
    //       data.$q,
    //       "createBackupPolicy",
    //       "Create Backup Policy",
    //       "Creating",
    //       () => this.createBackupPolicy(data),
    //       () => true,
    //       <angular.ui.bootstrap.IModalSettings>{
    //           templateUrl: "partials/create-backup-policy-dialog.html",
    //           controller: ActionController,
    //           resolve: {
    //               action: () => this
    //           }
    //       },
    //       null);
  }

  public add(): void {
      if (this.backupPolicy.Schedule.RunTimes === null || this.backupPolicy.Schedule.RunTimes === undefined) {
          this.backupPolicy.Schedule.RunTimes = [];
      }
      this.backupPolicy.Schedule.RunTimes.push(this.date);
      this.date = "";
  }

  public deleteDate(index: number): void {
      this.backupPolicy.Schedule.RunTimes.splice(index, 1);
  }

  public saveBackupPolicy() {
    if (this.retentionPolicyRequired) {
        this.RetentionPolicy.RetentionPolicyType = "Basic";
        this.backupPolicy["RetentionPolicy"] = this.RetentionPolicy;
    } else {
        this.backupPolicy["RetentionPolicy"] = null;
    }

    if (this.backupPolicy.Schedule.ScheduleKind === "TimeBased" && this.backupPolicy.Schedule.ScheduleFrequencyType === "Weekly") {
        this.backupPolicy.Schedule.RunDays = [];
        for (let day of this.weekDay) {
            if (this.daySelectedMapping[day]) {
                this.backupPolicy.Schedule.RunDays.push(day);
            }
        }
    }
    (this.isUpdateOperation ? this.dataService.restClient.createBackupPolicy(this.backupPolicy) : 
                              this.dataService.restClient.updateBackupPolicy(this.backupPolicy)).subscribe();

    this.dialogRef.close();
    }
  ngOnInit() {
  }

}
