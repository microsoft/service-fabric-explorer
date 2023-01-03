import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { AllNodesComponent } from './all-nodes/all-nodes.component';
import { EventsComponent } from './events/events.component';
import { CommandsComponent } from './commands/commands.component';


const routes: Routes = [{
  path: '', component: BaseComponent, children: [
    { path: '', component: AllNodesComponent },
    { path: 'events', component: EventsComponent },
    { path: 'commands', component: CommandsComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NodesRoutingModule { }
