import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { ListSettings } from 'src/app/Models/ListSettings';
import { DataService } from 'src/app/services/data.service';
import { Subscription, Observable, of, forkJoin } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { ParamMap, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { mergeMap } from 'rxjs/operators';
import { SettingsService } from 'src/app/services/settings.service';
import { Node } from 'src/app/Models/DataModels/Node';
import { BaseController } from 'src/app/ViewModels/BaseController';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent extends BaseController {
  node: Node;
  nodeName: string;
  healthEventsListSettings: ListSettings;


  constructor(private data: DataService, injector: Injector, private settings: SettingsService) { 
    super(injector);
  }

  setup() {
    this.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return this.data.getNode(this.nodeName).pipe(mergeMap( node => {
        this.node = node;
        return forkJoin([
          this.node.loadInformation.refresh(messageHandler),
          this.node.health.refresh(messageHandler)
        ]);
      }))
  }

  getParams(route: ActivatedRouteSnapshot): void {
    this.nodeName = IdUtils.getNodeName(route);
  }
}
