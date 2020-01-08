import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HyperLinkComponent } from './hyper-link/hyper-link.component';
import { PlainTextComponent } from './plain-text/plain-text.component';
import { ResolverDirective } from 'src/app/modules/detail-list-templates/resolver.directive';
import { DetailTableResolverComponent } from './detail-table-resolver/detail-table-resolver.component';
import { RouterModule } from '@angular/router';
import { CopyTextComponent } from './copy-text/copy-text.component';
import { DetailListComponent } from './detail-list/detail-list.component';
import { PagerComponent } from './pager/pager.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgbPaginationModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [HyperLinkComponent, PlainTextComponent, DetailTableResolverComponent, ResolverDirective, CopyTextComponent, ResolverDirective, DetailListComponent, PagerComponent],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    NgbPaginationModule,
    NgbDropdownModule,
    FormsModule
  ],
  exports: [PlainTextComponent, DetailTableResolverComponent, HyperLinkComponent, CopyTextComponent, DetailListComponent],
  entryComponents: [PlainTextComponent, HyperLinkComponent, CopyTextComponent]
})
export class DetailListTemplatesModule { }
