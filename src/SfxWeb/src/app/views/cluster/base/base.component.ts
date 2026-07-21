import { Component, ElementRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';
import { Constants } from 'src/app/Common/Constants';
import { IBaseView } from '../../BaseView';

@Component({
    selector: 'app-base',
    templateUrl: './base.component.html',
    styleUrls: ['./base.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BaseComponent implements OnInit, IBaseView {
  tree = inject(TreeService);
  dataService = inject(DataService);
  el = inject(ElementRef);


  SFXClusterName = '';

  tabs: ITab[] = [{
    name: 'essentials',
    route: ''
    },
    {
      name: 'details',
      route: '/details'
    },
    {
      name: 'metrics',
      route: '/metrics'
    },
    {
      name: 'cluster map',
      route: '/clustermap'
    },
    {
      name: 'image store',
      route: '/imagestore'
    },
    {
      name: 'manifest',
      route: '/manifest'
    },
    {
      name: 'commands',
      route: '/commands'
    }
  ];

  ngOnInit() {
    this.tree.selectTreeNode([
      IdGenerator.cluster()
    ], true);

    this.dataService.clusterManifest.ensureInitialized().subscribe(() => {
      if (this.dataService.clusterManifest.isEventStoreEnabled) {
        this.tabs = this.tabs.concat(Constants.EventsTab);
        this.tabs = this.tabs.concat({
          name: 'naming viewer',
          route: './naming'
          });
        this.tabs = this.tabs.concat({
          name: 'orchestration view',
          route: './orchestration'
          });
      }
      if (this.dataService.clusterManifest.isBackupRestoreEnabled) {
        this.tabs = this.tabs.concat({
          name: 'backups',
          route: '/backups'
        });
      }
      if (this.dataService.clusterManifest.isRepairManagerEnabled) {
        this.tabs = this.tabs.concat({
          name: 'repair jobs',
          route: '/repairtasks'
        });
      }

      if (this.dataService.clusterManifest.isRepairManagerEnabled) {
        this.tabs = this.tabs.concat({
          name: 'infrastructure jobs',
          route: '/infrastructure'
        });
      }
    });

    this.dataService.nodes.refresh().subscribe( () => {
      this.dataService.clusterManifest.ensureInitialized().subscribe( () => {
          // if < 5 seed nodes display warning for SFRP
          if (this.dataService.clusterManifest.isSfrpCluster && !this.dataService.clusterManifest.isSfmcCluster){
              this.dataService.nodes.checkSeedNodeCount(5);
          }
      });
  });

    this.SFXClusterName = this.dataService.clusterNameMetadata || (window.location.protocol + '//' + window.location.hostname);
  }

}
