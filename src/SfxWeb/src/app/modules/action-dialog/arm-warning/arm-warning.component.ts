import { AfterViewInit, Component, EventEmitter, Input, Output, Type, ViewChild } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DialogBodyDirective } from '../dialog-body.directive';
import { DialogBodyComponent } from '../DialogBodyComponent';
import { ActionDialogUtils } from '../utils';

@Component({
  selector: 'app-arm-warning',
  templateUrl: './arm-warning.component.html',
  styleUrls: ['./arm-warning.component.scss']
})
export class ArmWarningComponent implements AfterViewInit {

  @ViewChild(DialogBodyDirective) body: DialogBodyDirective;
  @Input() inputs: {resourceId: string, template?: Type<DialogBodyComponent>};
  @Output() disableSubmit = new EventEmitter<boolean>();

  instance: DialogBodyComponent;

  ngAfterViewInit(): void {
    if (this.inputs.template) {
      this.instance = ActionDialogUtils.createChildComponent(this.body, this.instance, this.inputs, this.inputs.template, (value) => { this.emitEvent(value) });
    }  
  }

  emitEvent(value) {
    this.disableSubmit.emit(value);
  }

  ok(): Observable<boolean> {
    if (this.instance.ok) {
      return this.instance.ok();
    }
    else {
      return of(true);
    }
  }
}
