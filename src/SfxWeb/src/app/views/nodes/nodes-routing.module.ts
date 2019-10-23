import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { AllNodesComponent } from './all-nodes/all-nodes.component';


const routes: Routes = [{
  path: '', component: BaseComponent, children: [
    { path: '', component: AllNodesComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NodesRoutingModule { }
