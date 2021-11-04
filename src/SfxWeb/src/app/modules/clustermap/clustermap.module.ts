import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusTileComponent } from './status-tile/status-tile.component';
import { MapComponent } from './map/map.component';
import { SharedModule } from 'src/app/shared/shared.module';



@NgModule({
  declarations: [
    StatusTileComponent,
    MapComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    StatusTileComponent,
    MapComponent
  ]
})
export class ClustermapModule { }
