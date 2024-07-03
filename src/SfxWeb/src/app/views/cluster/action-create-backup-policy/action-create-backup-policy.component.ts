import { Component, OnInit, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray, AbstractControl } from '@angular/forms';
import { IsolatedAction } from 'src/app/Models/Action';

@Component({
  selector: 'app-action-create-backup-policy',
  templateUrl: './action-create-backup-policy.component.html',
  styleUrls: ['./action-create-backup-policy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionCreateBackupPolicyComponent implements OnInit {

  form: UntypedFormGroup;

  public date = '';
  public weekDay: string[]  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  isUpdateOperation = false;

  constructor(public dialogRef: MatDialogRef<ActionCreateBackupPolicyComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction,
              private dataService: DataService,
              private formBuilder: UntypedFormBuilder,
              private cdr: ChangeDetectorRef) {
  }

  public saveBackupPolicy() {
    const data = this.form.getRawValue();

    data.RetentionPolicy.MinimumNumberOfBackups = data.RetentionPolicy.MinimumNumberOfBackups.toString();

    if (!data.retentionPolicyRequired) {
      delete data.RetentionPolicy;
    }
    delete data.retentionPolicyRequired;
    delete data.Storage.IsEmptyPrimaryCredential;
    delete data.Storage.IsEmptySecondaryCredential;

    if (data.Schedule.ScheduleKind === 'TimeBased' && data.Schedule.ScheduleFrequencyType === 'Weekly') {
      data.Schedule.RunDays = data.Schedule.RunDays.map( (status: boolean, index: number ) => status ? this.weekDay[index] : null).filter( day => day !== null);
    }else{
      data.Schedule.RunDays = [];
    }
    
    if(data.Storage.StorageKind === 'ManagedIdentityAzureBlobStore' && data.Storage.ManagedIdentityClientId === ""){
      delete data.Storage.ManagedIdentityClientId;
    }
    (this.isUpdateOperation ? this.dataService.restClient.updateBackupPolicy(data) :
                              this.dataService.restClient.createBackupPolicy(data)  ).subscribe( () => {
                                this.dialogRef.close();
                                this.data.data = data;
                              },
                              err => {
                                console.log(err);
                              });
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      Name: ['', [Validators.required]],
      AutoRestoreOnDataLoss: [false],
      MaxIncrementalBackups: [null, [Validators.required]],
      Schedule: this.formBuilder.group({
        ScheduleKind: ['FrequencyBased', [Validators.required]],
        ScheduleFrequencyType: [''],
        RunDays: this.getRunDaysControl(),
        RunTimes: this.formBuilder.array([]),
        Interval: ['']
      }),
      retentionPolicyRequired: [false],
      RetentionPolicy: this.formBuilder.group({
        RetentionPolicyType: ['Basic'],
        MinimumNumberOfBackups: [0],
        RetentionDuration: [null]
      })
    });

    this.form.get('retentionPolicyRequired').valueChanges.subscribe(required => {
      this.form.get('RetentionPolicy').get('RetentionDuration').setValidators(required ? [Validators.required, Validators.minLength(1)] : null);
      this.form.get('RetentionPolicy').get('RetentionDuration').updateValueAndValidity();
      this.cdr.detectChanges();
    });

    this.form.get('Schedule').get('ScheduleKind').valueChanges.subscribe(type => {
      this.updateSchedule(type);
    });

    if (this.data.data) {
        this.isUpdateOperation = true;
        this.form.patchValue(this.data.data);
        if (this.data.data.RetentionPolicy) {
          this.form.patchValue({retentionPolicyRequired : true});
        }

        this.form.get('Name').disable();
        if (this.data.data.Schedule.ScheduleFrequencyType === 'Weekly') {
          this.setDays(this.data.data.Schedule.RunDays);
        }
    }else {
      this.setDays([]);
    }

    this.updateSchedule(this.form.get('Schedule').get('ScheduleKind').value);

    this.cdr.detectChanges();
  }

  updateSchedule(state: string) {
    this.form.get('Schedule').get('ScheduleFrequencyType').setValidators(state === 'TimeBased' ? [Validators.required] : null);
    this.form.get('Schedule').get('Interval').setValidators(state === 'FrequencyBased' ? [Validators.required] : null);

    this.form.get('Schedule').get('ScheduleFrequencyType').updateValueAndValidity();
    this.form.get('Schedule').get('Interval').updateValueAndValidity();
    this.cdr.detectChanges();

  }

  get RunTimes() {
    return this.form.get('Schedule').get('RunTimes') as UntypedFormArray;
  }

  get RunDays() {
    return this.form.get('Schedule').get('RunDays') as UntypedFormArray;
  }

  addRunTime() {
    this.RunTimes.push(this.formBuilder.control([this.date]));
    this.date = '';
    this.cdr.detectChanges();

  }

  removeRunTime(index: number) {
    this.RunTimes.removeAt(index);
    this.cdr.detectChanges();

  }

  getRunDaysControl() {
    const arr = this.weekDay.map(day => this.formBuilder.control(false)); // TODO set this with initial data
    return this.formBuilder.array(arr);
  }

  setDays(days: string[]) {
    const runDays = this.form.get(['Schedule', 'RunDays']) as UntypedFormArray;
    this.weekDay.forEach( (day, i) => {
      runDays.at(i).setValue(days.includes(day));
    });
  }

}
