import { Component, OnInit, Input, AfterViewInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActionCollection } from 'src/app/Models/ActionCollection';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { RoutesService } from 'src/app/services/routes.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() type: string = "";
  @Input() name: string = "";
  @Input() tabs: ITab[] = [];
  @Input() actions: ActionCollection;

  sub: Subscription;

  constructor(private router: Router) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.setFocus();      

    this.sub = this.router.events.subscribe(event => {
      this.setFocus();      
    });
  }

  ngOnDestroy() {
    if(this.sub) {
      this.sub.unsubscribe();
    }
  }


  //specifically built for accessibility
  setFocus() {
    try {
      setTimeout( () => {
        document.getElementById("0").focus()
      }, 1)
    } catch (e) {

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