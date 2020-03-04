import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-collapse-container',
  templateUrl: './collapse-container.component.html',
  styleUrls: ['./collapse-container.component.scss']
})
export class CollapseContainerComponent {

  @Input() collapsed: boolean = false;
  @Input() disabled: boolean = false;

  changeCollapseState() {
    if(!this.disabled) {
      this.collapsed = !this.collapsed;
    }
  }

}
