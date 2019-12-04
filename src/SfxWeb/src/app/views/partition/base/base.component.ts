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
      name: "backups",
      route: "./backups"
    },
    {
      name: "events",
      route: "./events"
    }
  ];
  constructor() { }

  ngOnInit() {
  }

  //TODO REMOVE TAB FOR BACKUPS
//   if (this.partition.isStatelessService || partition.parent.parent.raw.TypeName === "System") {
//     this.tabs = {
//         "essentials": { name: "Essentials" },
//         "details": { name: "Details" },
//         "events": { name: "Events" },
//     };
//     this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
//     this.tabs["details"].refresh = (messageHandler) => this.refreshDetails(messageHandler);
//     this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);
// }

}
