// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { BaseComponent } from './base/base.component';
import { MetricsComponent } from './metrics/metrics.component';
import { ClustermapComponent } from './clustermap/clustermap.component';
import { ImagestoreComponent } from './imagestore/imagestore.component';
import { ManifestComponent } from './manifest/manifest.component';
import { EventsComponent } from './events/events.component';
import { BackupsComponent } from './backups/backups.component';
import { RepairTasksComponent } from './repair-tasks/repair-tasks.component';
import { InfrastructureViewComponent } from './infrastructure-view/infrastructure-view.component';
import { CommandsComponent } from './commands/commands.component';
import { NamingViewerPageComponent } from './naming-viewer-page/naming-viewer-page.component';
import { OrchestrationViewComponent } from './orchestration-view/orchestration-view.component';

const routes: Routes = [{
  path: '', component: BaseComponent, children: [
    { path: 'details', component: DetailsComponent },
    { path: 'metrics', component: MetricsComponent },
    { path: 'clustermap', component: ClustermapComponent },
    { path: 'imagestore', component: ImagestoreComponent },
    { path: 'manifest', component: ManifestComponent },
    { path: 'events', component: EventsComponent },
    { path: 'backups', component: BackupsComponent },
    { path: 'repairtasks', component: RepairTasksComponent },
    { path: 'infrastructure', component: InfrastructureViewComponent },
    { path: 'naming', component: NamingViewerPageComponent },
    { path: 'orchestration', component: OrchestrationViewComponent},
    { path: 'commands', component: CommandsComponent },
    { path: '', component: EssentialsComponent },
  ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClusterRoutingModule { }
