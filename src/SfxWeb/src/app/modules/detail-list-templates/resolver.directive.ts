import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({
    selector: '[appResolver]',
    standalone: false
})
export class ResolverDirective {  viewContainerRef = inject(ViewContainerRef);


}
