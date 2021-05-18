import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {

  @Input() type = '';
  @Input() name = '';
  @Input() tabs: ITab[] = [];
  @Input() actions: ActionCollection;

  constructor(private router: Router) { }

  navigateBySpaceBar(route: string) {
    this.router.navigate([route]);
  }

  tabTracker(index: number, tab: ITab) {
    return tab.name;
  }

}

export interface ITab {
  name: string;
  route: string;
}
