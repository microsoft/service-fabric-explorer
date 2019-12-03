import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { AllComponent } from './all/all.component';
import { EventsComponent } from './events/events.component';
import { UpgradingComponent } from './upgrading/upgrading.component';


const routes: Routes = [{
  path: '', component: BaseComponent, children: [
    { path: '', component: AllComponent },
    { path: 'upgrades', component: UpgradingComponent },
    { path: 'events', component: EventsComponent },
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApplicationsRoutingModule { }
