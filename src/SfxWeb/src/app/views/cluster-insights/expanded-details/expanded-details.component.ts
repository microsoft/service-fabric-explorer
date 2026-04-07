import { Component } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-expanded-details',
  templateUrl: './expanded-details.component.html',
  styleUrls: ['./expanded-details.component.scss']
})
export class ExpandedDetailsComponent implements DetailBaseComponent {
  item: any;
  listSetting: ListColumnSetting;
}

export class ListColumnSettingForExpandedDetails extends ListColumnSetting {
  template = ExpandedDetailsComponent;

  constructor(displayName: string, config?: any) {
    super('expandedDetails', displayName, config);
  }
}
