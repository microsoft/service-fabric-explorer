import { Component, OnInit } from '@angular/core';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { PartitionCacheService } from '../partition-cache.service';
import { IPartitionData } from '../safety-checks/safety-checks.component';

@Component({
  selector: 'app-load-cell',
  templateUrl: './load-cell.component.html',
  styleUrls: ['./load-cell.component.scss']
})
export class LoadCellComponent implements OnInit {

  item: IPartitionData;
  listSetting: ListColumnSetting;

  constructor(public cacheService: PartitionCacheService) { }

  ngOnInit() {
  }

  load() {
    this.cacheService.getPartitionInfo(this.item.SafetyCheck.PartitionId, this.item);
  }

}
