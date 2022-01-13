import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appChartRef]'
})
export class ChartRefDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
