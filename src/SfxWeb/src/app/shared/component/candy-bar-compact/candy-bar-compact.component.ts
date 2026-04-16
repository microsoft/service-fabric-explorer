import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-candybar-compact',
    templateUrl: './candy-bar-compact.component.html',
    styleUrls: ['./candy-bar-compact.component.scss'],
    standalone: false
})
export class CandyBarCompactComponent {

  @Input() item: any;
  @Input() viewPath = '';

  constructor() { }

}
