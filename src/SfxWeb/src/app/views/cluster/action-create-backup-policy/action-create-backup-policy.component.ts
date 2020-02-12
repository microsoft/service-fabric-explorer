import { Component, OnInit, Inject } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { IRawBackupPolicy, IRawRetentionPolicy } from 'src/app/Models/RawDataTypes';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-action-create-backup-policy',
  templateUrl: './action-create-backup-policy.component.html',
  styleUrls: ['./action-create-backup-policy.component.scss']
})
export class ActionCreateBackupPolicyComponent implements OnInit {

  form: FormGroup

  // public backupPolicy: IRawBackupPolicy = {
  //     Name: "",
  //     AutoRestoreOnDataLoss: false,
  //     MaxIncrementalBackups: 0,
  //     Schedule: {
  //       ScheduleKind: "",
  //       ScheduleFrequencyType: "",
  //       RunDays: [],
  //       RunTimes: [],
  //       Interval: ""
  //     },
  //     Storage: {
  //       StorageKind: "",
  //       FriendlyName: "",
  //       Path: "",
  //       ConnectionString: "",
  //       ContainerName: "",
  //       PrimaryUserName: "",
  //       PrimaryPassword: "",
  //       SecondaryUserName: "",
  //       SecondaryPassword: ""
  //     }
  // };

  public date: string = "";
  public weekDay: string[]  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  isUpdateOperation: boolean = false;

  constructor(public dialogRef: MatDialogRef<ActionCreateBackupPolicyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IRawBackupPolicy,
    private dataService: DataService,
    private formBuilder: FormBuilder) {
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

  public saveBackupPolicy() {
    let data = this.form.value;

    console.log(data);

    // data.MaxIncrementalBackups = data.MaxIncrementalBackups.toString();
    data.RetentionPolicy.MinimumNumberOfBackups = data.RetentionPolicy.MinimumNumberOfBackups.toString();

    if(!data.retentionPolicyRequired) {
      delete data.RetentionPolicy
    }
    delete data.retentionPolicyRequired;


    if(data.Schedule.ScheduleKind === "TimeBased" && data.Schedule.ScheduleFrequencyType === "Weekly") {
      data.Schedule.RunDays = data.Schedule.RunDays.map( (status: boolean, index: number ) => status ? this.weekDay[index] : null).filter( day => day !== null);
    }else{
      data.Schedule.RunDays = [];
    }

    console.log(data);
    // if (this.retentionPolicyRequired) {
    //     this.RetentionPolicy.RetentionPolicyType = "Basic";
    //     this.backupPolicy["RetentionPolicy"] = this.RetentionPolicy;
    // } else {
    //     this.backupPolicy["RetentionPolicy"] = null;
    // }

    // if (this.backupPolicy.Schedule.ScheduleKind === "TimeBased" && this.backupPolicy.Schedule.ScheduleFrequencyType === "Weekly") {
    //     this.backupPolicy.Schedule.RunDays = [];
    //     for (let day of this.weekDay) {
    //         if (this.daySelectedMapping[day]) {
    //             this.backupPolicy.Schedule.RunDays.push(day);
    //         }
    //     }
    // }
    (this.isUpdateOperation ? this.dataService.restClient.createBackupPolicy(data) : 
                              this.dataService.restClient.updateBackupPolicy(data)  ).subscribe( () => {
                                this.dialogRef.close();
                              },
                              err => {
                                console.log(err)
                              });

    // this.dialogRef.close();
    }

  ngOnInit() {
    this.form = this.formBuilder.group({
      Name: ["", [Validators.required]],
      AutoRestoreOnDataLoss: [false],
      MaxIncrementalBackups: [null, [Validators.required]],
      Schedule: this.formBuilder.group({
        ScheduleKind: ["FrequencyBased", [Validators.required]],
        ScheduleFrequencyType: [""],
        RunDays: this.getRunDaysControl(),
        RunTimes: this.formBuilder.array([]),
        Interval: [""]
      }),
      Storage: this.formBuilder.group({
        StorageKind: ["AzureBlobStore", [Validators.required]],
        FriendlyName: [""],
        Path: [""],
        ConnectionString: [""],
        ContainerName: [""],
        PrimaryUserName: [""],
        PrimaryPassword: [""],
        SecondaryUserName: [""],
        SecondaryPassword: [""]
      }),
      retentionPolicyRequired: [false],
      RetentionPolicy: this.formBuilder.group({
        RetentionPolicyType: ["Basic"],
        MinimumNumberOfBackups: [0],
        RetentionDuration: [""]
      })

    })
    console.log(this.form)
    const storage = this.form.get('Storage');
    this.updateStorageKindValidators(storage, this.form.get('Storage').get('StorageKind').value);
    this.updateSchedule(this.form.get('Schedule').get('ScheduleKind').value);

    storage.get('StorageKind').valueChanges.subscribe(storageKind => {
      console.log(storageKind)
      this.updateStorageKindValidators(storage, storageKind);
    })

    this.form.get('retentionPolicyRequired').valueChanges.subscribe(required => {
      this.form.get('RetentionPolicy').get('RetentionDuration').setValidators(required ? [Validators.required] : null);
    })

    this.form.get('Schedule').get('ScheduleKind').valueChanges.subscribe(type => {
      this.updateSchedule(type);
    })


    this.form.valueChanges.subscribe(data => console.log(data))
  }

  updateSchedule(state: string) {
    this.form.get('Schedule').get('ScheduleFrequencyType').setValidators(state === 'TimeBased' ? [Validators.required] : null);
    this.form.get('Schedule').get('Interval').setValidators(state === 'FrequencyBased' ? [Validators.required] : null);
  }

  updateStorageKindValidators(storage: AbstractControl, storageKind: string) {
    if(storageKind === 'AzureBlobStore') {
      storage.get('ContainerName').setValidators([Validators.required]);
      storage.get('ConnectionString').setValidators([Validators.required]);

      storage.get('Path').setValidators(null);
    }

    if(storageKind === 'FileShare') {
      storage.get('ContainerName').setValidators(null);
      storage.get('ConnectionString').setValidators(null);

      storage.get('Path').setValidators([Validators.required]);
    }
  }

  get RunTimes() {
    return this.form.get(['Schedule', 'RunTimes']) as FormArray;
  }

  addRunTime() {
    this.RunTimes.push(this.formBuilder.control([this.date]))
    this.date = "";
  }

  removeRunTime(index: number) {
    this.RunTimes.removeAt(index);
  }

  getRunDaysControl() {
    const arr = this.weekDay.map(day => this.formBuilder.control(false)) // TODO set this with initial data
    return this.formBuilder.array(arr);
  }

}
