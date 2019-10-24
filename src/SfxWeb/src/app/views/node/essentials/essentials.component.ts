import { Component, OnInit, OnDestroy } from '@angular/core';
import { switchMap, mergeMap, map } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { of, Subscription, Observable, forkJoin } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { Node } from 'src/app/Models/DataModels/Node';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DeployedApplicationCollection } from 'src/app/Models/DataModels/Collections';
import { ListSettings, ListColumnSetting, ListColumnSettingForLink, ListColumnSettingForBadge, ListColumnSettingWithFilter } from 'src/app/Models/ListSettings';
import { SettingsService } from 'src/app/services/settings.service';

@Component({
  selector: 'app-essentials',
  templateUrl: './essentials.component.html',
  styleUrls: ['./essentials.component.scss']
})
export class EssentialsComponent implements OnInit, OnDestroy {

  nodeName: string;
  node: Node;
  deployedApps: DeployedApplicationCollection;
  listSettings: ListSettings;
  unhealthyEvaluationsListSettings: ListSettings;
  r: Subscription;

  constructor(private data: DataService, private route: ActivatedRoute, private settings: SettingsService) { }

  ngOnInit() {

    this.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();


    this.r = this.route.paramMap.pipe(
      mergeMap((params: ParamMap) => {
        console.log(params)
        return of(IdUtils.getNodeName(params));
      }
    )).subscribe(d => {
      this.nodeName = d;
      this.refresh().subscribe();
      this.listSettings = this.settings.getNewOrExistingListSettings("apps", ["name"], [
        new ListColumnSettingForLink("name", "Name", item => item.viewPath),
        new ListColumnSetting("raw.TypeName", "Application Type"),
        new ListColumnSettingForBadge("health.healthState", "Health State"),
        new ListColumnSettingWithFilter("raw.Status", "Status"),
    ]);
    })
  }

  ngOnDestroy(): void {
    this.r.unsubscribe();
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any>{
    return forkJoin([
      this.data.getNode(this.nodeName).pipe(mergeMap( node => {
        this.node = node;
        return forkJoin([
          this.node.health.refresh(messageHandler),
          this.node.deployedApps.refresh(messageHandler).pipe(map(deployedApps => {
            this.deployedApps = deployedApps;
          }))
        ]) 
      })),
    ])
  }

}
