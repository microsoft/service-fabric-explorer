import { Directive, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  selector: '[appDrag]'
})
export class DragDirective {

  down: boolean = false;

  @Output() onDrag = new EventEmitter();

  @HostListener('mousemove', ['$event'])
  handleDrag($event: MouseEvent){
    if(this.down){
      console.log($event);
      this.onDrag.emit($event.screenX - 4);
    }
  }

  @HostListener('mousedown', ['$event'])
  startDrag($event:any){
    this.down = true;
    $event.preventDefault();
  }

  @HostListener('mouseleave', ['$event'])
  @HostListener('mouseup', ['$event'])
  endDrag($event:any){
    this.down = false;
    console.log($event);
  }

  constructor(){
    console.log("wait")
  }
}
