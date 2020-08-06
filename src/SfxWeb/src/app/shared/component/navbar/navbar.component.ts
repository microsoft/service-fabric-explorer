import { Component, OnInit, Input, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnDestroy {

  @Input() type: string = "";
  @Input() name: string = "";
  @Input() tabs: ITab[] = [];
  @Input() actions: ActionCollection;

  sub: Subscription;

  constructor(private router: Router) { }

  ngOnDestroy() {
    if(this.sub) {
      this.sub.unsubscribe();
    }
  }

  navigateBySpaceBar(route: string) {
    this.router.navigate([route])
  }

}

export interface ITab {
  name: string;
  route: string;
}
