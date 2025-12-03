import { Component } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-clickable-replica-id',
  templateUrl: './clickable-replica-id.component.html',
  styleUrls: ['../replica-list/replica-list.component.scss']
})
export class ClickableReplicaIdComponent implements DetailBaseComponent {
  item: any;
  listSetting: any;

  getReplicaId(): string {
    return this.item?.id || '';
  }

  onClick(): void {
    if (this.listSetting?.clickHandler) {
      this.listSetting.clickHandler(this.item);
    }
  }
}

export class ListColumnSettingForClickableReplicaId extends ListColumnSetting {
  template = ClickableReplicaIdComponent;
  clickHandler: (item: any) => void;
  
  constructor(propertyPath: string, displayName: string, clickHandler?: (item: any) => void) {
    super(propertyPath, displayName);
    this.clickHandler = clickHandler;
  }
}
