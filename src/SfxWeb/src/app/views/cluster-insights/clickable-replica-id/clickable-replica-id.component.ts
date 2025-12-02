import { Component } from '@angular/core';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

@Component({
  selector: 'app-clickable-replica-id',
  templateUrl: './clickable-replica-id.component.html',
  styleUrls: ['./clickable-replica-id.component.scss']
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
