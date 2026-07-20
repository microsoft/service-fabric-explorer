import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({
    selector: '[appDialogBody]',
    standalone: false
})
export class DialogBodyDirective {  viewContainerRef = inject(ViewContainerRef);


}