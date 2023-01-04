import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appVisualization]'
})
export class VisualizationDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
