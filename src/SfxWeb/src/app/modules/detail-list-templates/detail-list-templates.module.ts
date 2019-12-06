import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HyperLinkComponent } from './hyper-link/hyper-link.component';
import { PlainTextComponent } from './plain-text/plain-text.component';
import { ResolverDirective } from 'src/app/shared/directive/resolver.directive';
import { DetailTableResolverComponent } from './detail-table-resolver/detail-table-resolver.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [HyperLinkComponent, PlainTextComponent, DetailTableResolverComponent, ResolverDirective],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [PlainTextComponent, DetailTableResolverComponent, HyperLinkComponent],
  entryComponents: [PlainTextComponent, HyperLinkComponent]
})
export class DetailListTemplatesModule { }
