import { ElementRef, Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FocusService{

  focusObservable : Subject<ElementRef<any>> = new Subject<ElementRef<any>>();  
  focusElement : ElementRef<any>;  

  constructor() {
    this.focusObservable.subscribe((element) => {
        this.focusElement = element;
        this.focus();
      }, 
      (err)=>{console.log(err)}
    );
  }

  setFocusElement(element: ElementRef<any>) {
    this.focusObservable.next(element);
  }
  
  focus() {
    if(this.focusElement) {
      setTimeout(() => {
      this.focusElement.nativeElement.focus();
      },200);
    }
  }

}
