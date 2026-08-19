import { Component, OnInit, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { ServiceApplicationsBaseControllerDirective } from '../SystemApplicationBase';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';
import { TreeService } from 'src/app/services/tree.service';
import { IBaseView } from '../../BaseView';

@Component({
    selector: 'app-base',
    templateUrl: './base.component.html',
    styleUrls: ['./base.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BaseComponent extends ServiceApplicationsBaseControllerDirective implements IBaseView{
  protected data: DataService = inject(DataService);
  private tree = inject(TreeService);
  el = inject(ElementRef);

  tabs: ITab[] = [{
    name: 'essentials',
    route: './'
    }
  ];

  setup() {
    this.tree.selectTreeNode([
      IdGenerator.cluster(),
      IdGenerator.systemAppGroup()
    ], true);
  }
}
