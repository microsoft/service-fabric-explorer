import { Component, OnInit } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { ServiceType } from 'src/app/Models/DataModels/Service';
import { IsolatedAction } from 'src/app/Models/Action';
import { DataService } from 'src/app/services/data.service';
import { CreateServiceComponent } from '../create-service/create-service.component';

@Component({
  selector: 'app-action-row',
  templateUrl: './action-row.component.html',
  styleUrls: ['./action-row.component.scss']
})
export class ActionRowComponent implements DetailBaseComponent {

  item: ServiceType;
  listSetting: ListColumnSettingForApplicationServiceRow;

  constructor(private data: DataService) { }

  createService() {
    new IsolatedAction(
      this.data.dialog,
      '',
      '',
      '',
      this.item,
      CreateServiceComponent,
      () => true).run();
  }
}

export class ListColumnSettingForApplicationServiceRow extends ListColumnSetting {
  template = ActionRowComponent;
  public constructor() {
      super('actions', 'Actions', null, false);
  }
}
