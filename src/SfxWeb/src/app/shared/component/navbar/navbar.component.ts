import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  @Input() type: string = "";
  @Input() name: string = "";
  @Input() tabs: ITab[] = [];

  constructor() { }

  ngOnInit() {
  }

}

export interface ITab {
  name: string;
  route: string;
}