import { Component, ElementRef, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ITab } from 'src/app/shared/component/navbar/navbar.component';
import { TreeService } from 'src/app/services/tree.service';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { DataService } from 'src/app/services/data.service';
import { Constants } from 'src/app/Common/Constants';
import { IBaseView } from '../../BaseView';
import { ExperienceService } from 'src/app/services/experience.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-base',
    templateUrl: './base.component.html',
    styleUrls: ['./base.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    host: { '[class.cluster-modern]': 'experience.isNew()' }
})
export class BaseComponent implements OnInit, IBaseView {
  experience = inject(ExperienceService);
  private router = inject(Router);
  public get pageInfo(): { title: string; description: string } | undefined {
    const route = this.router.url.split(/[?#]/)[0].split('/').filter(Boolean).join('/');
    return ({
      '': { title: 'Cluster overview', description: 'Health, capacity, upgrades, and activity at a glance.' },
      details: { title: 'Cluster details', description: 'Upgrade state, node distribution, and cluster load.' },
      metrics: { title: 'Metrics', description: 'Explore resource capacity and load across your nodes.' },
      clustermap: { title: 'Cluster map', description: 'Explore node placement across fault and upgrade domains.' },
      imagestore: { title: 'Image store', description: 'Browse application packages and files stored in the cluster.' },
      manifest: { title: 'Cluster manifest', description: 'Inspect the cluster configuration. This viewer does not edit the manifest.' },
      commands: { title: 'PowerShell commands', description: 'Prepare commands for your cluster. Commands are generated here, not executed.' },
      orchestration: { title: 'Orchestration', description: 'Investigate placement, balancing, and constraint decisions for a partition.' },
      repairtasks: { title: 'Repair jobs', description: 'Track repair progress, duration, and completed work.' },
      infrastructure: { title: 'Infrastructure jobs', description: 'Review platform maintenance, active jobs, and coordination details.' }
    } as Record<string, { title: string; description: string }>)[route];
  }
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
