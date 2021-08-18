import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EssentialComponent } from './essential/essential.component';

const routes: Routes = [
  {path: '', component: EssentialComponent}
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NodeTypeRoutingModule { }
