import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-text-tile',
  templateUrl: './dashboard-text-tile.component.html',
  styleUrls: ['./dashboard-text-tile.component.scss']
})
export class DashboardTextTileComponent implements OnInit {

  @Input() barClass: string = "";
  @Input() title: string;
  @Input() count: string | number;

  constructor() { }

  ngOnInit() {
  }

}
