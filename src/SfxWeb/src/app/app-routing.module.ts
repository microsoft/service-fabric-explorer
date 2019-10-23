import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: 'nodes', loadChildren: () => import(`./views/nodes/nodes.module`).then(m => m.NodesModule) },
  { path: '', loadChildren: () => import(`./views/cluster/cluster.module`).then(m => m.ClusterModule) },
  { path: '**', loadChildren: () => import(`./views/cluster/cluster.module`).then(m => m.ClusterModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
