import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestLoggingComponent } from './request-logging/request-logging.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailListTemplatesModule } from 'src/app/modules/detail-list-templates/detail-list-templates.module';
import { NestedTableComponent } from './nested-table/nested-table.component';
import { FormsModule } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [RequestLoggingComponent, NestedTableComponent],
  imports: [
    CommonModule,
    SharedModule,
    DetailListTemplatesModule,
    FormsModule,
    NgbNavModule
  ],
  exports: [RequestLoggingComponent],
})
export class DebuggingModule { }
