import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { BackupsComponent } from './backups/backups.component';
import { EventsComponent } from './events/events.component';
import { CommandsComponent } from './commands/commands.component';


const routes: Routes = [{
  path: '', component: BaseComponent, children: [
    { path: '', component: EssentialsComponent },
    { path: 'details', component: DetailsComponent },
    { path: 'backups', component: BackupsComponent },
    { path: 'events', component: EventsComponent },
    { path: 'commands', component: CommandsComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PartitionRoutingModule { }
