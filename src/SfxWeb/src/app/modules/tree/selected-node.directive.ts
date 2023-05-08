import { Directive, ElementRef, Input, OnChanges } from '@angular/core';
import { FocusService } from 'src/app/services/focus.service';
import { TreeService } from 'src/app/services/tree.service';

@Directive({
  selector: '[appSelectedNode]'
})
export class SeletedNodeDirective implements OnChanges {

  @Input() selected: boolean;
  constructor(private elementRef: ElementRef, private treeService: TreeService, private focusService: FocusService) { }

  ngOnChanges() {
    if (this.selected) {
      this.elementRef.nativeElement.tabIndex = 0;
      this.elementRef.nativeElement.focus();
      setTimeout(() => {
        try {
          if (Math.abs(this.elementRef.nativeElement.offsetTop - this.treeService.containerRef.nativeElement.scrollTop) > (this.treeService.containerRef.nativeElement.offsetHeight - 30)) {
            this.elementRef.nativeElement.scrollIntoView({behavior: 'smooth', block: 'center'});
          }
        } catch (e) {
          console.log('browser does not support scroll', e);
        }
    }, 50);
    }
    else{
      this.elementRef.nativeElement.tabIndex = -1;
    }
  }
}
