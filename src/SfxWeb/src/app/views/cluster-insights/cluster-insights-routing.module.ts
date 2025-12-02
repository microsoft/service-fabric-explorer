import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClusterInsightsComponent } from './cluster-insights.component';

const routes: Routes = [
  { path: '', component: ClusterInsightsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClusterInsightsRoutingModule {}