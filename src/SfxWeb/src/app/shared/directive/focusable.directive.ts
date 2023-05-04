import { Directive, ElementRef } from '@angular/core';
import { FocusService } from 'src/app/services/focus.service';

@Directive({
  selector: '[appFocusable]'
})
export class FocusableDirective {

  constructor(focusService: FocusService, public elementRef: ElementRef) { 
    focusService.setFocusElement(elementRef);
  }

}
