import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-candybar-compact',
    templateUrl: './candy-bar-compact.component.html',
    styleUrls: ['./candy-bar-compact.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CandyBarCompactComponent {

  @Input() item: any;
  @Input() viewPath = '';

  constructor() { }

}
