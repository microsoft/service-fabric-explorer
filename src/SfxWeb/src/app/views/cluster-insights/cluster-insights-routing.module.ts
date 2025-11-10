import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReplicaListComponent } from './replica-list/replica-list.component';

const routes: Routes = [
  { path: '', component: ReplicaListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class ClusterInsightsRoutingModule {}