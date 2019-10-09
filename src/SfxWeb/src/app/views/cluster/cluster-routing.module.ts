import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EssentialsComponent } from './essentials/essentials.component';
import { DetailsComponent } from './details/details.component';
import { BaseComponent } from './base/base.component';


const routes: Routes = [{
  path: '', component: BaseComponent, children: [
    { path: '', component: EssentialsComponent },
    { path: 'details', component: DetailsComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClusterRoutingModule { }
