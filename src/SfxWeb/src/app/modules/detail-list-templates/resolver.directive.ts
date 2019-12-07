import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appResolver]'
})
export class ResolverDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
