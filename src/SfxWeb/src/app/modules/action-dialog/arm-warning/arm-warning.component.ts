import { AfterViewInit, Component, EventEmitter, Input, Output, Type, ViewChild } from '@angular/core';
import { DialogBodyDirective } from '../dialog-body.directive';
import { DialogBodyComponent } from '../DialogBodyComponent';

@Component({
  selector: 'app-arm-warning',
  templateUrl: './arm-warning.component.html',
  styleUrls: ['./arm-warning.component.scss']
})
export class ArmWarningComponent implements AfterViewInit {

  @ViewChild(DialogBodyDirective) body: DialogBodyDirective;
  @Input() inputs: { resourceId: string, message?: string, confirmationKeyword?: string , template?: Type<DialogBodyComponent>};
  @Output() disableSubmit = new EventEmitter<boolean>();
  constructor() { }

  ngAfterViewInit(): void {
    if (this.inputs.template) {
      let instance = this.body.viewContainerRef.createComponent(this.inputs.template).instance;
      instance.inputs = this.inputs;    
      if (instance.disableSubmit) {
        instance.disableSubmit.subscribe((value) => this.emitEvent(value));
      }
    }  
  }

  emitEvent(value) {
    this.disableSubmit.emit(value);
  }

}
