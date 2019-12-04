import { Component, OnInit } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent implements OnInit {

  tabs: ITab[] = [{
    name: "essentials",
    route: "./"
    },
    {
      name: "details",
      route: "./details"
    },
    {
      name: "events",
      route: "./events"
    }
  ];
  constructor() { }

  ngOnInit() {
  }

}
