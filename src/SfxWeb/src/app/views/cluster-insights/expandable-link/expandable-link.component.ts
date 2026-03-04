import { Component } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ListColumnSetting } from 'src/app/Models/ListSettings';

@Component({
  selector: 'app-expandable-link',
  templateUrl: './expandable-link.component.html',
  styleUrls: ['./expandable-link.component.scss']
})
export class ExpandableLinkComponent implements DetailBaseComponent {
  item: any;
  listSetting: any;

  getDisplayText(): string {
    return this.listSetting?.getValue(this.item) || this.item?.id || '';
  }

  getColor(): string {
    return this.item?.color ?? 'var(--accent-lightblue)';
  }

  onClick(): void {
    if (this.listSetting?.clickHandler) {
      this.listSetting.clickHandler(this.item);
    }
  }
}

export class ListColumnSettingWithExpandableLink extends ListColumnSetting {
  template = ExpandableLinkComponent;
  clickHandler: (item: any) => void;

  constructor(propertyPath: string, displayName: string, clickHandler?: (item: any) => void) {
    super(propertyPath, displayName);
    this.clickHandler = clickHandler;
  }
}