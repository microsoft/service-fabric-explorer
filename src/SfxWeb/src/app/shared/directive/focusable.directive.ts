import { Directive, ElementRef } from '@angular/core';
import { FocusService } from 'src/app/services/focus.service';

@Directive({
  selector: '[appFocusable]'
})
export class FocusableDirective {

  constructor(private focusService: FocusService, public elementRef: ElementRef) { 
    this.focusService.setFocusElement(elementRef);
  }

}
