import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[appDialogBody]',
    standalone: false
})
export class DialogBodyDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}