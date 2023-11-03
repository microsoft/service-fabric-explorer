import { Component, OnInit, Inject, Input, EventEmitter, OnDestroy, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IsolatedAction } from 'src/app/Models/Action';
import { Service } from 'src/app/Models/DataModels/Service';
import { IRawStatelessServiceDescription, IRawUpdateServiceDescription } from 'src/app/Models/RawDataTypes';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DialogBodyComponent } from 'src/app/modules/action-dialog/DialogBodyComponent';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, defaultIfEmpty } from 'rxjs/operators';

@Component({
  selector: 'app-scale-service',
  templateUrl: './scale-service.component.html',
  styleUrls: ['./scale-service.component.scss']
})
export class ScaleServiceComponent implements OnInit, OnDestroy, DialogBodyComponent {

  @Input() inputs: { service: Service };
  count: number;

  updateServiceDescription: IRawUpdateServiceDescription;

  form: UntypedFormGroup;
  @Output() disableSubmit = new EventEmitter<boolean>();

  validityCheckerSubscription: Subscription;
  disableSubmitSubscription: Subscription = new Subscription();
  
  constructor(public dialogRef: MatDialogRef<ScaleServiceComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IsolatedAction,
              private formBuilder: UntypedFormBuilder) { }

  ngOnInit() {
    this.updateServiceDescription = {
      ServiceKind: this.inputs.service.serviceKindInNumber,
      Flags: 0x01, // Update InstanceCount flag
      InstanceCount: (this.inputs.service.description.raw as IRawStatelessServiceDescription).InstanceCount
    };

    this.form = this.formBuilder.group({
      count: [(this.inputs.service.description.raw as IRawStatelessServiceDescription).InstanceCount, [Validators.required, Validators.pattern('^(?:-1|[1-9]\\d*)$')]],
    });
    this.validityCheckerSubscription = this.form.valueChanges.subscribe(() => {
      this.checkFormValidity();
    })
  }

  ok(): Observable<boolean> {
    this.updateServiceDescription.InstanceCount = this.form.value.count;
    return this.inputs.service.updateService(this.updateServiceDescription).pipe(
      catchError((err) => {
        console.log(err)
        return of(false)
    })).pipe(defaultIfEmpty(true));
  }

  checkFormValidity() {
    this.disableSubmit.emit(!this.form.valid);
  }

  ngOnDestroy(): void {
    this.validityCheckerSubscription.unsubscribe();
    this.disableSubmitSubscription.unsubscribe();

  }

}
