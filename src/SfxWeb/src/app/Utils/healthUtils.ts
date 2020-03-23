import { IRawUnhealthyEvaluation, IRawHealthEvaluation } from '../Models/RawDataTypes';
import { HealthEvaluation } from '../Models/DataModels/Shared';
import { DataService } from '../services/data.service';

export class HealthUtils {
    public static getParsedHealthEvaluations(rawUnhealthyEvals: IRawUnhealthyEvaluation[], level: number = 0, parent: HealthEvaluation = null, data: DataService): HealthEvaluation[] {
        let healthEvals: HealthEvaluation[] = new Array(0);
        let children: HealthEvaluation[] = new Array(0);
        if (rawUnhealthyEvals) {
            rawUnhealthyEvals.forEach(item => {
                let healthEval: IRawHealthEvaluation = item.HealthEvaluation;
                let health = new HealthEvaluation(healthEval, level, parent);
                if (healthEval) {

                    //the parent Url is either the parent healthEvaluation or the current locationUrl if its the first parent.
                    let parentUrl = "";
                    if (parent) {
                        parentUrl = parent.viewPathUrl;
                    }else {
                        parentUrl = `${location.pathname}`; // TODO CHECK THIS works?
                    }
                    const pathData = HealthUtils.getViewPathUrl(healthEval, data, parentUrl);
                    health.viewPathUrl = pathData.viewPathUrl;
                    health.displayName =  pathData.displayName;
                    health.treeName = pathData.name;
                    health.uniqueId = pathData.uniqueId;
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
     * @param healthEval
     * @param data
     * @param parentUrl
     */
    public static getViewPathUrl(healthEval: IRawHealthEvaluation, data: DataService, parentUrl: string = ""): {viewPathUrl: string, displayName: string, name: string, uniqueId: string } {
        let viewPathUrl = "";
        let name = "";
        let uniqueId = "";
        switch (healthEval.Kind) {
            case "Nodes" : {
                viewPathUrl = data.routes.getNodesViewPath();
                name = "Nodes";
                uniqueId = name;
                break;
            }
            case "Node" : {
                let nodeName = healthEval["NodeName"];
                name = nodeName;
                uniqueId = name;
                viewPathUrl = data.routes.getNodeViewPath(nodeName);
                break;
            }
            case "Applications" : {
                viewPathUrl = data.routes.getAppsViewPath();
                name = "applications"
                uniqueId = name;
                break;
            }
            case "Application" : {
                let applicationName = healthEval["ApplicationName"];
                let appName = applicationName.replace("fabric:/", ""); //remove fabric:/
                name = appName;
                uniqueId = applicationName;

                let app = data.apps.find(appName);
                if (app) {
                    let appType = app.raw.TypeName;
                    viewPathUrl += `/apptype/${data.routes.doubleEncode(appType)}/app/${data.routes.doubleEncode(appName)}`;
                }
                break;
            }
            case "Service" : {
                let exactServiceName = healthEval["ServiceName"].replace("fabric:/", "");

                name = exactServiceName;
                uniqueId = exactServiceName;

                //Handle system services slightly different by setting their exact path
                if (healthEval["ServiceName"].startsWith("fabric:/System")) {
                    viewPathUrl = `/apptype/System/app/System/service/${data.routes.doubleEncode(exactServiceName)}`;
                }else {
                    parentUrl += `/service/${data.routes.doubleEncode(exactServiceName)}`;
                    viewPathUrl = parentUrl;
                }
                break;
            }
            case "Partition" : {
                let partitionId = healthEval["PartitionId"];

                name = partitionId;
                uniqueId = partitionId;

                parentUrl += `/partition/${data.routes.doubleEncode(partitionId)}`;
                viewPathUrl = parentUrl;
                break;
            }
            case "Replica" : {
                let replicaId = healthEval["ReplicaOrInstanceId"];
                name = replicaId;
                uniqueId = replicaId;

                parentUrl += `/replica/${data.routes.doubleEncode(replicaId)}`;
                viewPathUrl = parentUrl;
                break;
            }
            case "Event" : {
                const source = healthEval['SourceId'];
                const property = healthEval['Property'];
                uniqueId = source + property;

                if (parentUrl) {
                    viewPathUrl = parentUrl;
                    uniqueId += parentUrl;
                }
                name = "Event";

                break;
            }

            case "DeployedApplication" : {
                const nodeName = healthEval["UnhealthyEvent"]["NodeName"];
                const applicationName = healthEval["UnhealthyEvent"]["Name"];
                const appName = applicationName.replace("fabric:/", "");
                name = appName;
                uniqueId = name;
                viewPathUrl += `/node/${data.routes.doubleEncode(nodeName)}/deployedapp/${data.routes.doubleEncode(appName)}`;
                break;
            }

            case "DeployedServicePackage" : {
                const serviceManifestName = healthEval["ServiceManifestName"];
                name = serviceManifestName;
                const activationId = healthEval["ServicePackageActivationId"];
                const activationIdUrlInfo =  activationId ? "activationid/" + data.routes.doubleEncode(activationId) : "";
                viewPathUrl = parentUrl + `/deployedservice/${activationIdUrlInfo}${serviceManifestName}`;
                name = serviceManifestName;
                break;
            }

            case "DeployedServicePackages" : {
                uniqueId = "DSP" + parentUrl;
            }
            case "Services" : {
                uniqueId = "SS" + healthEval["ServiceTypeName"]
            }
            case "Partitions" : {
                uniqueId = "PP" + parentUrl;
            }
            case "Replicas" : {
                uniqueId = "RR" + parentUrl;
            }

            default: {
                viewPathUrl = parentUrl;
                name = healthEval.Kind;
                break;
            }
        }
        // if (replaceText.length > 0) {
        //     healthEval.Description = Utils.injectLink(healthEval.Description, replaceText, viewPathUrl, replaceText);
        // }
        return {viewPathUrl, 
                displayName: "",
                name,
                uniqueId
               };
    }
}