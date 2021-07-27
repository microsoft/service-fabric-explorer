import { Component, Input, OnInit } from '@angular/core';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';

@Component({
  selector: 'app-essential-item',
  templateUrl: './essential-item.component.html',
  styleUrls: ['./essential-item.component.scss']
})
export class EssentialItemComponent implements OnInit {

  @Input() item: IEssentialListItem;
  @Input() underline: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
