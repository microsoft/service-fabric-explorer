import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { EventsComponent } from './events/events.component';

const routes: Routes = [{
  path: '', component : BaseComponent, children : [
    {path: '', component : EventsComponent}
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CombinedEventsRoutingModule { }
