import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { RepairTask } from 'src/app/Models/DataModels/repairTask';
import { ListColumnSetting } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';
import { ExperienceService } from 'src/app/services/experience.service';

@Component({
    selector: 'app-question-tool-tip',
    templateUrl: './question-tool-tip.component.html',
    styleUrls: ['./question-tool-tip.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class QuestionToolTipComponent implements  OnInit, DetailBaseComponent {
  public experience = inject(ExperienceService);

  item!: RepairTask;
  listSetting!: ListColumnSetting;

  tooltipText!: {tooltip: string, type: string};

  constructor() { }

  ngOnInit() {
    this.tooltipText = this.item.tooltipInfo();
  }

}
