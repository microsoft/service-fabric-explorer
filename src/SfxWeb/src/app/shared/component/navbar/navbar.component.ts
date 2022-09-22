import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { Router } from '@angular/router';
import { PowershellScript } from 'src/app/Models/RawDataTypes';

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
  @Input() showCopy = true;
  @Input() scripts: PowershellScript[];
  constructor(private router: Router) { }

  navigateBySpaceBar(route: string) {
    this.router.navigate([route]);
  }

}

export interface ITab {
  name: string;
  route: string;
}
