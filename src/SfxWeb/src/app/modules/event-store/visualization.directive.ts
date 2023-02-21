import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appVisualization]'
})
export class VisualizationDirective {

  public name: string;

  constructor(public viewContainerRef: ViewContainerRef) { }

}
