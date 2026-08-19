import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({
    selector: '[appVisualization]',
    standalone: false
})
export class VisualizationDirective {
  viewContainerRef = inject(ViewContainerRef);


  public name: string;

}
