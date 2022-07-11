import { Component, OnInit } from '@angular/core';
import { ListColumnSetting, ListSettings } from 'src/app/Models/ListSettings';
import { DetailBaseComponent } from 'src/app/ViewModels/detail-table-base.component';

export interface IVisPres {
  visPresent: boolean;
}

@Component({
  selector: 'app-visualization-logo',
  templateUrl: './visualization-logo.component.html',
  styleUrls: ['./visualization-logo.component.scss']
})
export class VisualizationLogoComponent implements OnInit, DetailBaseComponent {

  item: IVisPres;
  listSetting: ListColumnSetting;
  imagePath: string;

  constructor() {
    this.imagePath = '/assets/vis-logo.png'
  }

  ngOnInit(): void {
    console.log("Visualization Logo Created!");
  }

}
