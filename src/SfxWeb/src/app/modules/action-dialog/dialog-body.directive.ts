import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDialogBody]'
})
export class DialogBodyDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}