import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output, Type, ViewChild } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { DialogBodyDirective } from '../dialog-body.directive';
import { DialogBodyComponent } from '../DialogBodyComponent';
import { ActionDialogUtils } from '../utils';

@Component({
  selector: 'app-message-with-warning',
  templateUrl: './message-with-warning.component.html',
  styleUrls: ['./message-with-warning.component.scss']
})
export class MessageWithWarningComponent implements AfterViewInit, OnDestroy, DialogBodyComponent {

  @ViewChild(DialogBodyDirective) body: DialogBodyDirective;
  @Input() inputs: {description: string, link: string, linkText: string, template?: Type<DialogBodyComponent>};
  @Output() disableSubmit = new EventEmitter<boolean>();
  disableSubmitSubscription: Subscription = new Subscription();

  instance: DialogBodyComponent;

  ngAfterViewInit(): void {
    if (this.inputs.template) {
      this.instance = ActionDialogUtils.createChildComponent(this.body, this.inputs, this.inputs.template, (value) => { this.emitEvent(value) });
    }  
  }

  emitEvent(value) {
    this.disableSubmit.emit(value);
  }

  ok(): Observable<boolean> {
    if (this.instance?.ok) {
      return this.instance.ok();
    }
    else {
      return of(true);
    }
  }
  
  ngOnDestroy(): void { 
    this.disableSubmitSubscription.unsubscribe();
  }
}
