import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
    selector: '[appVisualization]',
    standalone: false
})
export class VisualizationDirective {

  public name: string;

  constructor(public viewContainerRef: ViewContainerRef) { }

}
