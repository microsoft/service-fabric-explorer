import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { EventsComponent } from './events/events.component';
import { NodeTypesComponent } from './node-types/node-types.component';

const routes: Routes = [{
  path: '', component: BaseComponent, children: [
    { path: '', component: NodeTypesComponent },
    { path: 'events', component: EventsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NodeTypeRoutingModule { }