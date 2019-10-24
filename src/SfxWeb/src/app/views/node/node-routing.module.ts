import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './base/base.component';
import { EssentialsComponent } from './essentials/essentials.component';


const routes: Routes = [{
  path: '**', component: BaseComponent, children: [
    { path: '', component: EssentialsComponent }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NodeRoutingModule { }
