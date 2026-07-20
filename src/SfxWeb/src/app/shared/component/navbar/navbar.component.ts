import { Component, OnInit, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { Router } from '@angular/router';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class NavbarComponent {
  private router = inject(Router);


  @Input() type = '';
  @Input() name = '';
  @Input() tabs: ITab[] = [];
  @Input() actions: ActionCollection;
  @Input() showCopy = true;

  navigateBySpaceBar(route: string) {
    this.router.navigate([route]);
  }

}

export interface ITab {
  name: string;
  route: string;
}
