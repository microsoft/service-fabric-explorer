import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailListTemplatesModule } from '../detail-list-templates/detail-list-templates.module';
import { ImagestoreViewerComponent } from './imagestore-viewer/imagestore-viewer.component';
import { FormsModule } from '@angular/forms';
import { DisplaySizeColumnComponent } from './display-size-column/display-size-column.component';
import { DisplayNameColumnComponent } from './display-name-column/display-name-column.component';



@NgModule({
  declarations: [ImagestoreViewerComponent, DisplaySizeColumnComponent, DisplayNameColumnComponent],
  imports: [
    CommonModule,
    DetailListTemplatesModule,
    FormsModule
  ],
  exports: [ImagestoreViewerComponent],
  entryComponents: [DisplaySizeColumnComponent, DisplayNameColumnComponent]
})
export class ImagestoreModule { }
