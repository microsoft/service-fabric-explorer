import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[appResolver]',
    standalone: false
})
export class ResolverDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
