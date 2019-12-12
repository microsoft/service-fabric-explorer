import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-action-create-backup-policy',
  templateUrl: './action-create-backup-policy.component.html',
  styleUrls: ['./action-create-backup-policy.component.scss']
})
export class ActionCreateBackupPolicyComponent implements OnInit {

  public backupPolicy: IRawBackupPolicy;
  public date: string;
  public retentionPolicyRequired: boolean;
  public RetentionPolicy: IRawRetentionPolicy;
  public weekDay: string[];
  public daySelectedMapping: Record<string, Boolean>;

  constructor(data: DataService) {
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
      this.retentionPolicyRequired = false;
      this.date = "";
      this.weekDay = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      this.daySelectedMapping = {};
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

  private createBackupPolicy(data: DataService): angular.IPromise<any> {
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
      return data.restClient.createBackupPolicy(this.backupPolicy);
  }
  ngOnInit() {
  }

}
