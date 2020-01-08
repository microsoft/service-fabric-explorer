import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { ImagestoreViewerComponent } from './imagestore-viewer/imagestore-viewer.component';
import { FormsModule } from '@angular/forms';
import { DisplaySizeColumnComponent } from './display-size-column/display-size-column.component';
import { DisplayNameColumnComponent } from './display-name-column/display-name-column.component';
import { FolderActionsComponent } from './folder-actions/folder-actions.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [ImagestoreViewerComponent, DisplaySizeColumnComponent, DisplayNameColumnComponent, FolderActionsComponent],
  imports: [
    CommonModule,
    DetailListTemplatesModule,
    FormsModule,
    NgbDropdownModule
  ],
  exports: [ImagestoreViewerComponent, FolderActionsComponent],
  entryComponents: [DisplaySizeColumnComponent, DisplayNameColumnComponent, FolderActionsComponent]
})
export class ImagestoreModule { }
