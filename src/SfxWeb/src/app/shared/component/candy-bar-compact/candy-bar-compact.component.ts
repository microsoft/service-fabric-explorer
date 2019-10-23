import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-candybar-compact',
  templateUrl: './candy-bar-compact.component.html',
  styleUrls: ['./candy-bar-compact.component.scss']
})
export class CandyBarCompactComponent implements OnInit {

  @Input() item: any;
  @Input() viewPath: string = "";

  constructor() { }

  ngOnInit() {
  }

}
