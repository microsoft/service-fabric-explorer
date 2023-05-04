import { ElementRef, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FocusService {

  focusElement : ElementRef<any>;
  
  setFocusElement(element: ElementRef<any>) {
    this.focusElement = element;
  }

  focus() {
    if(this.focusElement) {
      this.focusElement.nativeElement.focus();
    }
  }

}
