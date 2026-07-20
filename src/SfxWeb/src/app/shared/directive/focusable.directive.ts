import { Directive, ElementRef, inject } from '@angular/core';
import { FocusService } from 'src/app/services/focus.service';

@Directive({
    selector: '[appFocusable]',
    standalone: false
})
export class FocusableDirective {
  private focusService = inject(FocusService);
  elementRef = inject(ElementRef);


  constructor() {
    const elementRef = this.elementRef;
 
    this.focusService.setFocusElement(elementRef);
  }

}
