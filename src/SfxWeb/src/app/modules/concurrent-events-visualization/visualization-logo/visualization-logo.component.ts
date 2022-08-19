import { Component } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { environment } from 'src/environments/environment';

export interface INodeEventItem {
  visPresent: boolean;
}

@Component({
  selector: 'app-visualization-logo',
  templateUrl: './visualization-logo.component.html',
  styleUrls: ['./visualization-logo.component.scss']
})
export class VisualizationLogoComponent implements DetailBaseComponent {

  item: INodeEventItem;
  listSetting: ListColumnSetting;

  public assetBase = environment.assetBase;

}
