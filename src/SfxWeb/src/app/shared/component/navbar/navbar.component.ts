import { Component, OnInit, Input } from '@angular/core';
import { ActionCollection } from 'src/app/Models/ActionCollection';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  @Input() type: string = "";
  @Input() name: string = "";
  @Input() tabs: ITab[] = [];
  @Input() actions: ActionCollection;
  constructor() { }

  ngOnInit() {
  }

}

export interface ITab {
  name: string;
  route: string;
}