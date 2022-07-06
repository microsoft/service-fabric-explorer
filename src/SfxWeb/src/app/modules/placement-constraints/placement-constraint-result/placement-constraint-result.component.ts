import { Component, OnInit } from '@angular/core';
import { ListColumnSetting, ListColumnSettingWithCustomComponent, ListSettings } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { IConstraint } from '../placement-constraint-viewer/placement-constraint-viewer.component';

@Component({
  selector: 'app-placement-constraint-result',
  templateUrl: './placement-constraint-result.component.html',
  styleUrls: ['./placement-constraint-result.component.scss']
})
export class PlacementConstraintResultComponent implements DetailBaseComponent, OnInit {

  item: IConstraint;
  listSetting: ListColumnSettingWithCustomComponent;

  items: any[] = [];
  settings: ListSettings;

  constructor(private listSettings: SettingsService) { }

  ngOnInit(): void {
    this.settings = this.listSettings.getNewOrExistingListSettings('constraintlist', [""],
    [
      new ListColumnSetting("name", "Constraint Name"),
      new ListColumnSetting("value", "Constraint Value")
    ])

    this.items = Object.entries(this.item.constraints).map(entry =>{
      return {
        name: entry[0],
        value: entry[1],
      }
    })
  }

}
