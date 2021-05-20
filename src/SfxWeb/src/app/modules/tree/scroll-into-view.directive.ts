import { Directive, ElementRef, Input, OnChanges } from '@angular/core';
import { TreeService } from 'src/app/services/tree.service';

@Directive({
  selector: '[appScrollIntoView]'
})
export class ScrollIntoViewDirective implements OnChanges {

  @Input() selected: boolean;
  constructor(private elementRef: ElementRef, private treeService: TreeService) { }

  ngOnChanges() {
    if (this.selected) {
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
  }
}
