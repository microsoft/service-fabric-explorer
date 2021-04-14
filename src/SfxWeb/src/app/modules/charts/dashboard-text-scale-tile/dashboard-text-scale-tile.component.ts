import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard-text-scale-tile',
  templateUrl: './dashboard-text-scale-tile.component.html',
  styleUrls: ['./dashboard-text-scale-tile.component.scss']
})
export class DashboardTextScaleTileComponent implements OnInit {

  @Input() barClass = '';
  @Input() title: string;
  @Input() link: string;
  @Input() text: string[] = [];

  constructor() { }

  ngOnInit(): void {
  }

}
