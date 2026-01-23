// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

import { IRawUnhealthyEvaluation, IRawHealthEvaluation, IRawNodeHealthEvluation, IRawApplicationHealthEvluation, IRawServiceHealthEvaluation,
         IRawPartitionHealthEvaluation, IRawReplicaHealthEvaluation, IRawDeployedServicePackageHealthEvaluation, IRawDeployedApplicationHealthEvaluation,
         IRawHealthStateCount, IRawApplicationHealth, IRawClusterHealth, IRawServiceHealth } from '../Models/RawDataTypes';
import { HealthEvaluation } from '../Models/DataModels/Shared';
import { DataService } from '../services/data.service';
import { RoutesService } from '../services/routes.service';
import { ITextAndBadge } from './ValueResolver';
import { BadgeConstants } from '../Common/Constants';

export enum HealthStatisticsEntityKind {
    Node,
    Application,
    Service,
    Partition,
    Replica,
    DeployedApplication,
    DeployedServicePackage
}


export interface IViewPathData {
    viewPathUrl: string;
    displayName: string;
}

export class HealthUtils {
    public static getParsedHealthEvaluations(rawUnhealthyEvals: IRawUnhealthyEvaluation[], level: number = 0, parent: HealthEvaluation = null, data: DataService): HealthEvaluation[] {
        let healthEvals: HealthEvaluation[] = new Array(0);
        const children: HealthEvaluation[] = new Array(0);
        if (rawUnhealthyEvals) {
            rawUnhealthyEvals.forEach(item => {
                const healthEval: IRawHealthEvaluation = item.HealthEvaluation;
                const health = new HealthEvaluation(healthEval, level, parent);
                if (healthEval) {

                    // the parent Url is either the parent healthEvaluation or the current locationUrl if its the first parent.
                    let parentUrl = '';
                    if (parent) {
                        parentUrl = parent.viewPathUrl;
                    }else {
                        parentUrl = `${location.pathname}`; // TODO CHECK THIS works?
                    }
                    const pathData = HealthUtils.getViewPathUrl(healthEval, data, parentUrl);
                    health.viewPathUrl = pathData.viewPathUrl;
                    health.displayName =  pathData.displayName;
                    healthEvals.push(health);
                    healthEvals = healthEvals.concat(HealthUtils.getParsedHealthEvaluations(healthEval.UnhealthyEvaluations, level + 1, health, data));
                    children.push(health);
                }
            });
        }
        if (parent) {
            parent.children = children;
        }
        return healthEvals;
    }

    /**
     * Generates the url for a healthEvaluation to be able to route to the proper page. Urls are built up by taking the parentUrl and adding the minimum needed to route to this event.
     * Make sure that the application collection is initialized before calling this because for application kinds they make calls to the collection on the dataservice to get apptype.
     */
    public static getViewPathUrl(healthEval: IRawHealthEvaluation, data: DataService, parentUrl: string = ''): IViewPathData {
        let viewPathUrl = '';
        let name = '';

        switch (healthEval.Kind) {
            case 'Nodes' : {
                viewPathUrl = RoutesService.getNodesViewPath();
                name = 'Nodes';
                break;
            }
            case 'Node' : {
                const nodeName = (healthEval as IRawNodeHealthEvluation).NodeName;
                name = nodeName;
                viewPathUrl = RoutesService.getNodeViewPath(nodeName);
                break;
            }
            case 'Applications' : {
                viewPathUrl = RoutesService.getAppsViewPath();
                name = 'applications';
                break;
            }
            case 'Application' : {
                const applicationName = (healthEval as IRawApplicationHealthEvluation).ApplicationName;
                const appName = applicationName.replace('fabric:/', ''); // remove fabric:/
                name = appName;

                const app = data.apps.find(appName);
                if (app) {
                    const appType = app.raw.TypeName;
                    viewPathUrl += `/apptype/${RoutesService.doubleEncode(appType)}/app/${RoutesService.doubleEncode(appName)}`;
                }
                break;
            }
            case 'Service' : {
                const exactServiceName = (healthEval as IRawServiceHealthEvaluation).ServiceName.replace('fabric:/', '');
                name = exactServiceName;

                // Handle system services slightly different by setting their exact path
                if ((healthEval as IRawServiceHealthEvaluation).ServiceName.startsWith('fabric:/System')) {
                    viewPathUrl = `/apptype/System/app/System/service/${RoutesService.doubleEncode(exactServiceName)}`;
                }else {
                    parentUrl += `/service/${RoutesService.doubleEncode(exactServiceName)}`;
                    viewPathUrl = parentUrl;
                }
                break;
            }
            case 'Partition' : {
                const partitionId = (healthEval as IRawPartitionHealthEvaluation).PartitionId;
                name = partitionId;
                parentUrl += `/partition/${RoutesService.doubleEncode(partitionId)}`;
                viewPathUrl = parentUrl;
                break;
            }
            case 'Replica' : {
                const replicaId = (healthEval as IRawReplicaHealthEvaluation).ReplicaOrInstanceId;
                name = replicaId;
                parentUrl += `/replica/${RoutesService.doubleEncode(replicaId)}`;
                viewPathUrl = parentUrl;
                break;
            }
            case 'Event' : {
                if (parentUrl) {
                    viewPathUrl = parentUrl;
                }
                name = 'Event';

                break;
            }

            case 'DeployedApplication' : {
                const nodeName = (healthEval as IRawDeployedApplicationHealthEvaluation).NodeName;
                const applicationName = (healthEval as IRawDeployedApplicationHealthEvaluation).NodeName;
                const appName = applicationName.replace('fabric:/', '');
                name = appName;

                viewPathUrl += `/node/${RoutesService.doubleEncode(nodeName)}/deployedapp/${RoutesService.doubleEncode(appName)}`;
                break;
            }

            case 'DeployedServicePackage' : {
                const serviceManifestName = (healthEval as IRawDeployedServicePackageHealthEvaluation).ServiceManifestName;
                const activationId = (healthEval as IRawDeployedServicePackageHealthEvaluation).ServicePackageActivationId;
                const activationIdUrlInfo =  activationId ? 'activationid/' + RoutesService.doubleEncode(activationId) : '';
                name = serviceManifestName;

                viewPathUrl = parentUrl + `/deployedservice/${activationIdUrlInfo}${serviceManifestName}`;
                break;
            }

            // case: "DeployedServicePackages"
            // case: "Services"
            // case: "Partitions"
            // case: "Replicas"
            default: {
                name = healthEval.Kind;
                viewPathUrl = parentUrl;
                break;
            }
        }

        return {viewPathUrl,
                displayName: name };
    }

    public static getHealthStateCount(data: IRawApplicationHealth | IRawClusterHealth | IRawServiceHealth, entityKind: HealthStatisticsEntityKind): IRawHealthStateCount {
        if (data && data.HealthStatistics) {
            const entityHealthCount = data.HealthStatistics.HealthStateCountList.find(item => item.EntityKind === HealthStatisticsEntityKind[entityKind]);
            if (entityHealthCount) {
                return entityHealthCount.HealthStateCount;
            }
        }
        return {
            OkCount: 0,
            ErrorCount: 0,
            WarningCount: 0
        };
    }

    public static resolveHealthStateToValue(badge: ITextAndBadge) {
        let value = 0;
        switch (badge.badgeClass) {
            case BadgeConstants.BadgeUnknown:
            case BadgeConstants.BadgeOK:
                value = 0;
                break;
            case BadgeConstants.BadgeWarning:
                value = 1;
                break;
            case BadgeConstants.BadgeError:
                value = 2;
                break;
            default:
                break;
        }
        return value;
    }
}

export function checkForJson(text: string) {
    try {
        return JSON.stringify(JSON.parse(text), null, 4);
    } catch (e) {
        return text;
    }
}
