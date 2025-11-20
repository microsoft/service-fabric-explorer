import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-replica-details-html',
  template: '<div [innerHTML]="safeHtml"></div>'
})
export class ReplicaDetailsHtmlComponent implements OnInit, DetailBaseComponent {
  item: any;
  listSetting: ListColumnSetting;
  safeHtml: SafeHtml;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    const htmlContent = this.item?.deployedReplicaDetailsHtml || '';
    this.safeHtml = this.sanitizer.sanitize(1, htmlContent) || '';
  }
}
