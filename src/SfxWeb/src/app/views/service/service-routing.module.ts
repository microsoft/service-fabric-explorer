import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { EventsComponent } from './events/events.component';
import { ManifestComponent } from './manifest/manifest.component';
import { BackupComponent } from './backup/backup.component';
import { PlacementComponent } from './placementConstraints/placement.component';
import { CommandsComponent } from './commands/commands.component';

const routes: Routes = [{
  path: '', component: BaseComponent, children: [
    { path: '', component: EssentialsComponent },
    { path: 'details', component: DetailsComponent },
    { path: 'manifest', component: ManifestComponent },
    { path: 'events', component: EventsComponent },
    { path: 'backup', component: BackupComponent },
    { path: 'commands', component: CommandsComponent},
    { path : 'placement' , component: PlacementComponent}
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServiceRoutingModule { }
