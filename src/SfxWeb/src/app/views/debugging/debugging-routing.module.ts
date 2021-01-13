import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RequestLoggingComponent } from './request-logging/request-logging.component';

const routes: Routes = [{
  path: '', component: RequestLoggingComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DebuggingRoutingModule { }
