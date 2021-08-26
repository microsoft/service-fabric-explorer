import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { DataService } from 'src/app/services/data.service';
import { IdUtils } from 'src/app/Utils/IdUtils';
import { BaseControllerDirective } from 'src/app/ViewModels/BaseController';
import { ListSettings, ListColumnSettingForLink, ListColumnSetting, ListColumnSettingWithFilter, ListColumnSettingForBadge } from 'src/app/Models/ListSettings';
import { NodeCollection } from 'src/app/Models/DataModels/collections/NodeCollection';
import { map, mergeMap } from 'rxjs/operators';
import { SettingsService } from 'src/app/services/settings.service';
import { Node } from 'src/app/Models/DataModels/Node';
import { IEssentialListItem } from 'src/app/modules/charts/essential-health-tile/essential-health-tile.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';

@Component({
  selector: 'app-essential',
  templateUrl: './essential.component.html',
  styleUrls: ['./essential.component.scss']
})
export class EssentialComponent extends BaseControllerDirective {
  nodeType: string;
  nodes: NodeCollection;
  listSettings: ListSettings;
  nodess: Node[] = [];
  repairJobs = [];
  repairJobSettings: ListSettings;

  certEssentialItems: {
    container: IEssentialListItem,
    items: IEssentialListItem[]
  }[] = [];

  endPoints: {
    container: IEssentialListItem,
    items: IEssentialListItem[]
  }[] = [];

  placementConstraints: {
    container: IEssentialListItem,
    items: IEssentialListItem[]
  }[] = [];

  constructor(private data: DataService, private settings: SettingsService, injector: Injector, private tree: TreeService) {
    super(injector);
  }

  setup() {
    this.nodes = this.data.nodes;
    this.repairJobSettings = this.settings.getNewOrExistingPendingRepairTaskListSettings();

    this.listSettings = this.settings.getNewOrExistingListSettings('nodes', ['name'], [
      new ListColumnSettingForLink('name', 'Name', item => item.viewPath),
      new ListColumnSetting('raw.IpAddressOrFQDN', 'Address'),
      new ListColumnSettingWithFilter('raw.UpgradeDomain', 'Upgrade Domain'),
      new ListColumnSettingWithFilter('raw.FaultDomain', 'Fault Domain'),
      new ListColumnSettingWithFilter('raw.IsSeedNode', 'Is Seed Node'),
      new ListColumnSettingForBadge('healthState', 'Health State'),
      new ListColumnSettingWithFilter('nodeStatus', 'Status'),
      new ListColumnSettingWithFilter('raw.Id.Id', 'Node Id'),
      new ListColumnSettingWithFilter('raw.CodeVersion', 'Code Version'),
  ]);

    this.tree.selectTreeNode([
    IdGenerator.cluster(),
    IdGenerator.nodeGroup(),
    IdGenerator.node(this.nodeType)
  ]);
  }

  refresh(messageHandler?: IResponseMessageHandler): Observable<any> {
    this.data.clusterManifest.ensureInitialized().pipe(mergeMap(() => {
      const info = this.data.clusterManifest.getNodeTypeInformation(this.nodeType);

      this.certEssentialItems = info.certificates.map(certInfo => {
        const items = certInfo.values.map(i => {
          return {
          descriptionName: i.name,
          copyTextValue: i.value,
          displayText: i.value,
          };
        });
        return {
          container: {
            descriptionName: certInfo.name,
            displaySelector: true
          },
          items
        }
      });

      this.endPoints = info.endpoints.sort((a,b) => a.name.localeCompare(b.name)).map(endPoint => {
        const items = endPoint.values.map(i => {
          return {
          descriptionName: i.name,
          copyTextValue: i.value,
          displayText: i.value,
          };
        });

        return {
          container:  {
            descriptionName: endPoint.name,
            displaySelector: true
          },
          items
        };
      });

      this.placementConstraints = info.PlacementProperties.sort((a,b) => a.name.localeCompare(b.name)).map(endPoint => {
        const items = endPoint.values.map(i => {
          return {
          descriptionName: i.name,
          copyTextValue: i.value,
          displayText: i.value,
          };
        });

        return {
          container:  {
            descriptionName: endPoint.name,
            displaySelector: true
          },
          items
        };
      });


      if (this.data.clusterManifest.isRepairManagerEnabled) {
        return this.data.repairCollection.refresh().pipe(map(() => {
          this.repairJobs = this.data.repairCollection.getRepairJobsForANode(this.nodess.map(node => node.name));
        }));
      }else {
        return of(null);
      }
    })).subscribe();

    return this.nodes.refresh(messageHandler).pipe(map(() => {
      // this.tiles = [];

      this.nodes.getNodeStateCounts(false, false).forEach(type => {
        if (type.nodeType === this.nodeType) {
          this.nodess = type.nodes;
        }
      });
    }));
  }

  getParams(route: ActivatedRouteSnapshot): void {
      this.nodeType = IdUtils.getNodeType(route);
  }
}
