import { IRawUnhealthyEvaluation, IRawHealthEvaluation } from '../Models/RawDataTypes';
import { HealthEvaluation } from '../Models/DataModels/Shared';
import { DataService } from '../services/data.service';
import { RoutesService } from '../services/routes.service';

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
                    } else {
                        parentUrl = `${location.pathname}`; // TODO CHECK THIS works?
                    }
                    const pathData = HealthUtils.getViewPathUrl(healthEval, data, parentUrl);
                    health.viewPathUrl = pathData.viewPathUrl;
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
    public static getViewPathUrl(healthEval: IRawHealthEvaluation, data: DataService, parentUrl: string = ""): { viewPathUrl: string, name: string, uniqueId: string } {
        let viewPathUrl = "";
        let name = "";
        let uniqueId = "";
        switch (healthEval.Kind) {
            case "Nodes": {
                viewPathUrl = RoutesService.getNodesViewPath();
                name = "Nodes";
                uniqueId = name;
                break;
            }
            case "Node": {
                let nodeName = healthEval["NodeName"];
                name = nodeName;
                uniqueId = name;
                viewPathUrl = RoutesService.getNodeViewPath(nodeName);
                break;
            }
            case "Applications": {
                viewPathUrl = RoutesService.getAppsViewPath();
                name = "applications"
                uniqueId = name;
                break;
            }
            case "Application": {
                let applicationName = healthEval["ApplicationName"];
                let appName = applicationName.replace("fabric:/", ""); //remove fabric:/
                name = appName;
                uniqueId = applicationName;

                let app = data.apps.find(appName);
                if (app) {
                    let appType = app.raw.TypeName;
                    viewPathUrl += `/apptype/${RoutesService.doubleEncode(appType)}/app/${RoutesService.doubleEncode(appName)}`;
                }
                break;
            }
            case "Service": {
                let exactServiceName = healthEval["ServiceName"].replace("fabric:/", "");

                name = exactServiceName;
                uniqueId = exactServiceName;

                //Handle system services slightly different by setting their exact path
                if (healthEval["ServiceName"].startsWith("fabric:/System")) {
                    viewPathUrl = `/apptype/System/app/System/service/${RoutesService.doubleEncode(exactServiceName)}`;
                } else {
                    parentUrl += `/service/${RoutesService.doubleEncode(exactServiceName)}`;
                    viewPathUrl = parentUrl;
                }
                break;
            }
            case "Partition": {
                let partitionId = healthEval["PartitionId"];

                name = partitionId;
                uniqueId = partitionId;

                parentUrl += `/partition/${RoutesService.doubleEncode(partitionId)}`;
                viewPathUrl = parentUrl;
                break;
            }
            case "Replica": {
                let replicaId = healthEval["ReplicaOrInstanceId"];
                name = replicaId;
                uniqueId = replicaId;

                parentUrl += `/replica/${RoutesService.doubleEncode(replicaId)}`;
                viewPathUrl = parentUrl;
                break;
            }
            case "Event": {
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

            case "DeployedApplication": {
                const nodeName = healthEval["UnhealthyEvent"]["NodeName"];
                const applicationName = healthEval["UnhealthyEvent"]["Name"];
                const appName = applicationName.replace("fabric:/", "");
                name = appName;
                uniqueId = name;
                viewPathUrl += `/node/${RoutesService.doubleEncode(nodeName)}/deployedapp/${RoutesService.doubleEncode(appName)}`;
                break;
            }

            case "DeployedServicePackage": {
                const serviceManifestName = healthEval["ServiceManifestName"];
                name = serviceManifestName;
                const activationId = healthEval["ServicePackageActivationId"];
                const activationIdUrlInfo = activationId ? "activationid/" + RoutesService.doubleEncode(activationId) : "";
                viewPathUrl = parentUrl + `/deployedservice/${activationIdUrlInfo}${serviceManifestName}`;
                name = serviceManifestName;
                uniqueId = name;
                break;
            }

            case "DeployedServicePackages": {
                uniqueId = "DSP" + parentUrl;
                viewPathUrl = parentUrl;
                name = healthEval.Kind;
                break;
            }
            case "Services": {
                uniqueId = "SS" + healthEval["ServiceTypeName"];
                viewPathUrl = parentUrl;
                name = healthEval.Kind;
                break;
            }
            case "Partitions": {
                uniqueId = "PP" + parentUrl;
                viewPathUrl = parentUrl;
                name = healthEval.Kind;
                break;
            }
            case "Replicas": {
                uniqueId = "RR" + parentUrl;
                viewPathUrl = parentUrl;
                name = healthEval.Kind;
                break;
            }

            default: {
                viewPathUrl = parentUrl;
                name = healthEval.Kind;
                break;
            }
        }

        return {
            viewPathUrl,
            name,
            uniqueId
        };
    }
}

export interface IDisplayname {
    text: string;
    link: string;
    badge: string;
    node: IUnhealthyEvaluationNode //used to set an anchor, the "current" node will have a circular relationship
}

export interface IUnhealthyEvaluationNode {
    healthEvaluation: HealthEvaluation;
    children: IUnhealthyEvaluationNode[];
    parent: IUnhealthyEvaluationNode;
    containsErrorInPath: boolean;
    displayNames: IDisplayname[];
    id: string;
}

/*
Get a specific node by iterating over children at each node to find one that matches the id at
that index of the array and if at any point it can not find that id returns back null.
path does not include the id of the starting node.
*/
export const getNestedNode = (path: string[], root: IUnhealthyEvaluationNode): IUnhealthyEvaluationNode => {
    if (path.length >= 1) {
        const id = path.shift();
        const pathNode = root.children.find(node => node.id === id);
        if (pathNode) { //having found a matching child node we can continue down.

            if (path.length === 0) { //we find the node we're looking for
                return pathNode
            } else {
                return getNestedNode(path, pathNode);
            }
        } else { //there isnt any valid node at this depth.
            return null;
        }

    } else if (path.length === 0) {
        return root;
    }
}

/*
return a list of the parents in the order of farthest parent back to the parent of the node.
*/
export const getParentPath = (node: IUnhealthyEvaluationNode): IUnhealthyEvaluationNode[] => {
    let parents = [];

    let nodeRef = node;
    while (nodeRef.parent !== null) {
        parents.push(nodeRef.parent);
        nodeRef = nodeRef.parent;
    }
    return parents.reverse();
}

/*
Get leaf nodes, which should only end up being event health events.
*/
export const getLeafNodes = (root: IUnhealthyEvaluationNode, skipRootPath: boolean = true): IUnhealthyEvaluationNode[] => {
    if (root.children.length == 0) {
        const parent = getParentPath(root).slice(skipRootPath ? 1 : 0).map(node => {
            return {
                text: node.healthEvaluation.treeName,
                link: node.healthEvaluation.viewPathUrl,
                badge: node.healthEvaluation.healthState.badgeClass,
                node
            }
        });
        let copy = Object.assign({}, root); //make copy to not mutate original
        copy.displayNames = parent;
        return [copy];
    } else {
        let nodes = [];
        root.children.forEach(node => { nodes = nodes.concat(getLeafNodes(node, skipRootPath)) });
        return nodes;
    }
}

/*
This will attempt to join any nodes that only have 1 child into a single node, except for the
condition when one child is an event. That will always be treated as a seperate node.
*/
export const condenseTree = (root: IUnhealthyEvaluationNode): IUnhealthyEvaluationNode => {
    let displayNames = [];
    let current = root;
    let children = root.children;
    if (root.children.length === 1) {
        while (current.children.length === 1 && current.children[0].healthEvaluation.raw.Kind !== "Event") {
            current = current.children[0];

            displayNames.push({
                text: current.healthEvaluation.treeName,
                link: current.healthEvaluation.viewPath,
                badge: current.healthEvaluation.healthState.badgeClass,
                node: current
            })
        }

        children = current.children;
    } else {
        children = root.children.map(child => condenseTree(child));
    }
    const d = Object.assign({}, root);
    d.displayNames = d.displayNames.concat(displayNames);
    d.children = children;
    return d
}

export const recursivelyBuildTree = (healthEvaluation: HealthEvaluation, parent: IUnhealthyEvaluationNode = null): IUnhealthyEvaluationNode => {
    let curretNode: any = {};
    const children = [];
    let containsErrorInPath = healthEvaluation.healthState.text === "Error";
    let displayNames = [{
        text: healthEvaluation.treeName,
        link: healthEvaluation.viewPathUrl,
        badge: healthEvaluation.healthState.badgeClass,
        node: curretNode
    }]

    healthEvaluation.children.forEach(child => {
        const newNode = recursivelyBuildTree(child, curretNode);
        children.push(newNode)
        if (newNode.containsErrorInPath) {
            containsErrorInPath = true;
        }
    })

    //we use assign here so that we can pass the right reference above and then update the object back and still get proper type checking
    Object.assign(curretNode, <IUnhealthyEvaluationNode>{
        healthEvaluation,
        children,
        parent,
        containsErrorInPath : containsErrorInPath,
        displayNames,
        id: healthEvaluation.uniqueId
    })
    return curretNode
}