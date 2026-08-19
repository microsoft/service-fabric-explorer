import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { PartitionCacheService } from '../partition-cache.service';
import { IPartitionData } from '../safety-checks/safety-checks.component';

@Component({
    selector: 'app-load-cell',
    templateUrl: './load-cell.component.html',
    styleUrls: ['./load-cell.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoadCellComponent {
  cacheService = inject(PartitionCacheService);


  item: IPartitionData;
  listSetting: ListColumnSetting;

  load() {
    this.cacheService.getPartitionInfo(this.item.SafetyCheck.PartitionId, this.item);
  }

}
