import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-essential-health-tile',
  templateUrl: './essential-health-tile.component.html',
  styleUrls: ['./essential-health-tile.component.scss']
})
export class EssentialHealthTileComponent implements OnInit {

  @Input() healthState;

  constructor() { }

  ngOnInit(): void {
  }

}
