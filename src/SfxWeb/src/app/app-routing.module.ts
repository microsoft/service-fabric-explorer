import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  // application section
  { path: 'apptype/:appTypeName/app/:appId/service/:serviceId/partition/:partitionId/replica/:replicaId', loadChildren: () => import(`./views/replica/replica.module`).then(m => m.ReplicaModule) },
  { path: 'apptype/:appTypeName/app/:appId/service/:serviceId/partition/:partitionId', loadChildren: () => import(`./views/partition/partition.module`).then(m => m.PartitionModule) },
  { path: 'apptype/:appTypeName/app/:appId/service/:serviceId', loadChildren: () => import(`./views/service/service.module`).then(m => m.ServiceModule) },
  { path: 'apptype/:appTypeName/app/:appId', loadChildren: () => import(`./views/application/application.module`).then(m => m.ApplicationModule) },
  { path: 'apptype/:appTypeName', loadChildren: () => import(`./views/application-type/application-type.module`).then(m => m.ApplicationTypeModule) },
  { path: 'app', loadChildren: () => import(`./views/application/application.module`).then(m => m.ApplicationModule) },
  { path: 'apps', loadChildren: () => import(`./views/applications/applications.module`).then(m => m.ApplicationsModule) },


  // node section
  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/activationid/:activationId/partition/:partitionId/replica/:replicaId', loadChildren: () => import(`./views/deployed-replica/deployed-replica.module`).then(m => m.DeployedReplicaModule) },
  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/partition/:partitionId/replica/:replicaId', loadChildren: () => import(`./views/deployed-replica/deployed-replica.module`).then(m => m.DeployedReplicaModule) },

  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/activationid/:activationId/replicas', loadChildren: () => import(`./views/deployed-replicas/deployed-replicas.module`).then(m => m.DeployedReplicasModule) },
  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/replicas', loadChildren: () => import(`./views/deployed-replicas/deployed-replicas.module`).then(m => m.DeployedReplicasModule) },

  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/activationid/:activationId/codepackage/:codePackageName', loadChildren: () => import(`./views/deployed-code-package/deployed-code-package.module`).then(m => m.DeployedCodePackageModule) },
  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/codepackage/:codePackageName', loadChildren: () => import(`./views/deployed-code-package/deployed-code-package.module`).then(m => m.DeployedCodePackageModule) },

  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/activationid/:activationId/codepackages', loadChildren: () => import(`./views/deployed-code-packages/deployed-code-packages.module`).then(m => m.DeployedCodePackagesModule) },
  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/codepackages', loadChildren: () => import(`./views/deployed-code-packages/deployed-code-packages.module`).then(m => m.DeployedCodePackagesModule) },

  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId/activationid/:activationId', loadChildren: () => import(`./views/deployed-service-package/deployed-service-package.module`).then(m => m.DeployedServicePackageModule) },
  { path: 'node/:nodeName/deployedapp/:appId/deployedservice/:serviceId', loadChildren: () => import(`./views/deployed-service-package/deployed-service-package.module`).then(m => m.DeployedServicePackageModule) },

  { path: 'node/:nodeName/deployedapp/:appId', loadChildren: () => import(`./views/deployed-application/deployed-application.module`).then(m => m.DeployedApplicationModule) },
  { path: 'node/:nodeName', loadChildren: () => import(`./views/node/node.module`).then(m => m.NodeModule) },
  { path: 'nodes', loadChildren: () => import(`./views/nodes/nodes.module`).then(m => m.NodesModule) },

  // system section(shares some routes with application)
  // { path: 'network/:networkName', loadChildren: () => import(`./views/node/node.module`).then(m => m.NodeModule) },
  // { path: 'networks', loadChildren: () => import(`./views/networks/networks.module`).then(m => m.NodeModule) },
  { path: 'system/apps', loadChildren: () => import(`./views/system-applications/system-applications.module`).then(m => m.SystemApplicationsModule) },

  { path: '', loadChildren: () => import(`./views/cluster/cluster.module`).then(m => m.ClusterModule) },
  { path: '**', loadChildren: () => import(`./views/cluster/cluster.module`).then(m => m.ClusterModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
