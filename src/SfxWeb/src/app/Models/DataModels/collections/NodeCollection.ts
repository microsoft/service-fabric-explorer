import { ITextAndBadge } from 'src/app/Utils/ValueResolver';
import { DataService } from 'src/app/services/data.service';
import { Node } from '../Node';
import { IClusterHealthChunk } from '../../HealthChunkRawDataTypes';
import { IdGenerator } from 'src/app/Utils/IdGenerator';
import { map } from 'rxjs/operators';
import { INodesStatusDetails, NodeStatusDetails } from '../../RawDataTypes';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { Observable, of } from 'rxjs';
import { Utils } from 'src/app/Utils/Utils';
import { HealthStateConstants, NodeStatusConstants, StatusWarningLevel, BannerWarningID } from 'src/app/Common/Constants';
import { DataModelCollectionBase } from './CollectionBase';
import { RoutesService } from 'src/app/services/routes.service';

export class NodeCollection extends DataModelCollectionBase<Node> {
    // make sure we only check once per session and this object will get destroyed/recreated
    private static checkedOneNodeScenario = false;
    public healthState: ITextAndBadge;
    public upgradeDomains: string[];
    public faultDomains: string[];
    public healthySeedNodes: string;
    public seedNodeCount: number;
    public disabledAndDisablingCount: number;
    public disabledAndDisablingNodes: Node[];

    public constructor(data: DataService) {
        super(data);
    }

    public get viewPath(): string {
        return RoutesService.getNodesViewPath();
    }

    public mergeClusterHealthStateChunk(clusterHealthChunk: IClusterHealthChunk): Observable<any> {
        return this.updateCollectionFromHealthChunkList(clusterHealthChunk.NodeHealthStateChunks, item => IdGenerator.node(item.NodeName)).pipe(map(() => {
            this.updateNodesHealthState();
        }));
    }

    public getNodeStateCounts(includeAllNodes: boolean = true, includeSeedNoddes: boolean = true): INodesStatusDetails[] {
        const counts = {};
        const allNodes = new NodeStatusDetails(NodeStatusDetails.allNodeText);
        const seedNodes = new NodeStatusDetails(NodeStatusDetails.allSeedNodesText);

        this.collection.forEach(node => {
            if (node.raw.IsSeedNode) {
                seedNodes.add(node);
            }
            if (!(node.raw.Type in counts)) {
                counts[node.raw.Type] = new NodeStatusDetails(node.raw.Type);
            }
            counts[node.raw.Type].add(node);
            allNodes.add(node);
        });

        const resultList = [];

        if (includeAllNodes) {
            resultList.push(allNodes);
        }

        if (includeSeedNoddes) {
            resultList.push(seedNodes);
        }
        return resultList.concat(Object.keys(counts).map(key => counts[key]));
    }

    protected get indexPropery(): string {
        // node should be indexed by name
        return 'name';
    }

    protected retrieveNewCollection(messageHandler?: IResponseMessageHandler): Observable<any> {
        return this.data.restClient.getNodes(messageHandler).pipe(map(items => {
            return items.map(raw => new Node(this.data, raw));
        }));
    }

    protected updateInternal(): Observable<any> {
        this.updateNodesHealthState();

        this.faultDomains = this.collection.map(node => node.raw.FaultDomain);
        this.faultDomains = Utils.unique(this.faultDomains).sort();

        this.upgradeDomains = this.collection.map(node => node.raw.UpgradeDomain);
        this.upgradeDomains = Utils.unique(this.upgradeDomains).sort();

        const seedNodes = this.collection.filter(node => node.raw.IsSeedNode);
        const healthyNodes = seedNodes.filter(node => node.healthState.text === HealthStateConstants.OK);

        let disabledNodes = 0;
        let disablingNodes = 0;

        const disabled = [];
        const disabling = [];
        this.collection.forEach(node => {
            if (node.raw.NodeStatus === NodeStatusConstants.Disabled) {
                disabledNodes++;
                disabled.push(node);
            }
            if (node.raw.NodeStatus === NodeStatusConstants.Disabling) {
                disablingNodes++;
                disabling.push(node);
            }
        });

        this.disabledAndDisablingNodes = disabling.concat(disabled);

        this.seedNodeCount = seedNodes.length;
        this.disabledAndDisablingCount = disabledNodes + disablingNodes;

        this.checkOneNodeScenario();

        this.healthySeedNodes = seedNodes.length.toString() + ' (' +
            Math.round(healthyNodes.length / seedNodes.length * 100).toString() + '%)';

        return of(true);
    }

    public checkSeedNodeCount(expected: number) {
        // if there are no seed nodes, then something would have gone wrong loading the node data
        if (this.seedNodeCount === 0) {
            return;
        }
        if (this.seedNodeCount < expected && this.seedNodeCount !== 1) {
            this.data.warnings.addOrUpdateNotification({
                message: `This cluster is currently running on the bronze reliability tier. For production workloads, only a reliability level of silver or greater is supported `,
                level: StatusWarningLevel.Warning,
                priority: 2,
                id: BannerWarningID.ClusterDegradedState,
                link: 'https://aka.ms/servicefabric/reliability',
                linkText: 'Read here for more guidance',
                confirmText: `This cluster is currently running on the bronze reliability tier which indicates a test/staging environment. For production workloads, only a reliability
                level of silver or greater is supported. For more information on the reliability characteristics of a cluster, please see https://aka.ms/sfreliabilitytiers`
            });
        }else {
            this.data.warnings.removeNotificationById(BannerWarningID.ClusterDegradedState);
        }
    }


    private checkOneNodeScenario(): void {
        if ( !NodeCollection.checkedOneNodeScenario && this.collection.length === 1) {
            this.data.warnings.addOrUpdateNotification({
                message: 'One node cluster is considered a test cluster and cannot perform cluster upgrades.',
                level: StatusWarningLevel.Info,
                priority: 1,
                id: BannerWarningID.OneNodeCluster,
                link: 'https://aka.ms/servicefabric/durability'
            });
        }
        NodeCollection.checkedOneNodeScenario = true;
    }

    private updateNodesHealthState(): void {
        // calculates the nodes health state which is the max state value of all nodes
        this.healthState = this.valueResolver.resolveHealthStatus(Utils.max(this.collection.map(node => HealthStateConstants.Values[node.healthState.text])).toString());
    }
}
