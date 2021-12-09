import { DataModelBase } from './Base';
import { DataService } from 'src/app/services/data.service';
import { ClusterManifest, ClusterUpgradeProgress } from './Cluster';
import { IResponseMessageHandler } from 'src/app/Common/ResponseMessageHandlers';
import { of, Observable } from 'rxjs';
import { IRawClusterManifest, IRawClusterUpgradeProgress } from '../RawDataTypes';
import { RestClientService } from 'src/app/services/rest-client.service';


describe('Cluster', () => {

    const restClientMock: RestClientService = {} as RestClientService;

    const mockDataService: DataService = {
        restClient: restClientMock,
        apps: {
            ensureInitialized: () => of(null)
        }
    } as DataService;

    describe('manifest', () => {

        let clusterManifest: ClusterManifest;

        beforeEach((() => {
            clusterManifest = new ClusterManifest(mockDataService);
        }));

        fit('validate no services', async () => {
            restClientMock.getClusterManifest = (messageHandler?: IResponseMessageHandler): Observable<IRawClusterManifest> =>
            of({
                Manifest: `<ClusterManifest xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                Name="WRP_Generated_ClusterManifest" Version="37" Description="This is a generated file. Do not modify."
                xmlns="http://schemas.microsoft.com/2011/01/fabric">
                <FabricSettings>

                </FabricSettings>
            </ClusterManifest>
                `
            });

            await clusterManifest.ensureInitialized().toPromise();

            expect(clusterManifest.imageStoreConnectionString).toBe('');
            expect(clusterManifest.isBackupRestoreEnabled).toBe(false);
            expect(clusterManifest.isRepairManagerEnabled).toBe(false);
            expect(clusterManifest.isSfrpCluster).toBe(false);
            expect(clusterManifest.isEventStoreEnabled).toBe(false);
        });

        fit('back up service enabled', async () => {
            restClientMock.getClusterManifest = (messageHandler?: IResponseMessageHandler): Observable<IRawClusterManifest> =>
            of({
                Manifest: `<ClusterManifest xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                Name="WRP_Generated_ClusterManifest" Version="37" Description="This is a generated file. Do not modify."
                xmlns="http://schemas.microsoft.com/2011/01/fabric">
                <FabricSettings>
                    <Section Name="BackupRestoreService">
                        <Parameter Name="MinReplicaSetSize" Value="3" />
                        <Parameter Name="PlacementConstraints" Value="(NodeTypeName==bkaad)" />
                        <Parameter Name="TargetReplicaSetSize" Value="3" />
                    </Section>
                </FabricSettings>
            </ClusterManifest>
                `
            });

            await clusterManifest.ensureInitialized().toPromise();

            expect(clusterManifest.imageStoreConnectionString).toBe('');
            expect(clusterManifest.isBackupRestoreEnabled).toBe(true);
            expect(clusterManifest.isRepairManagerEnabled).toBe(false);
            expect(clusterManifest.isSfrpCluster).toBe(false);
        });

        fit('native image store', async () => {
            restClientMock.getClusterManifest = (messageHandler?: IResponseMessageHandler): Observable<IRawClusterManifest> =>
            of({
                Manifest: `<ClusterManifest xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                Name="WRP_Generated_ClusterManifest" Version="37" Description="This is a generated file. Do not modify."
                xmlns="http://schemas.microsoft.com/2011/01/fabric">
                <FabricSettings>
                    <Section Name="Management">
                        <Parameter Name="EnableDeploymentAtDataRoot" Value="true" />
                        <Parameter Name="ImageStoreConnectionString" Value="fabric:ImageStore" />
                    </Section>
                </FabricSettings>
            </ClusterManifest>
                `
            });

            await clusterManifest.ensureInitialized().toPromise();

            expect(clusterManifest.imageStoreConnectionString).toBe('fabric:ImageStore');
            expect(clusterManifest.isBackupRestoreEnabled).toBe(false);
            expect(clusterManifest.isRepairManagerEnabled).toBe(false);
            expect(clusterManifest.isSfrpCluster).toBe(false);
        });

        fit('back up service enabled', async () => {
            restClientMock.getClusterManifest = (messageHandler?: IResponseMessageHandler): Observable<IRawClusterManifest> =>
            of({
                Manifest: `<ClusterManifest xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                Name="WRP_Generated_ClusterManifest" Version="37" Description="This is a generated file. Do not modify."
                xmlns="http://schemas.microsoft.com/2011/01/fabric">
                <FabricSettings>
                    <Section Name="RepairManager">
                        <Parameter Name="EnableHealthChecks" Value="True" />
                        <Parameter Name="MinReplicaSetSize" Value="3" />
                        <Parameter Name="PlacementConstraints" Value="(NodeTypeName==bkaad)" />
                        <Parameter Name="TargetReplicaSetSize" Value="3" />
                    </Section>
                </FabricSettings>
            </ClusterManifest>
                `
            });

            await clusterManifest.ensureInitialized().toPromise();

            expect(clusterManifest.imageStoreConnectionString).toBe('');
            expect(clusterManifest.isBackupRestoreEnabled).toBe(false);
            expect(clusterManifest.isRepairManagerEnabled).toBe(true);
            expect(clusterManifest.isSfrpCluster).toBe(false);
        });

        fit('Repair manager enabled', async () => {
            restClientMock.getClusterManifest = (messageHandler?: IResponseMessageHandler): Observable<IRawClusterManifest> =>
            of({
                Manifest: `<ClusterManifest xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                Name="WRP_Generated_ClusterManifest" Version="37" Description="This is a generated file. Do not modify."
                xmlns="http://schemas.microsoft.com/2011/01/fabric">
                <FabricSettings>
                    <Section Name="UpgradeService">
                        <Parameter Name="CoordinatorType" Value="Paas" />
                        <Parameter Name="MinReplicaSetSize" Value="3" />
                        <Parameter Name="PlacementConstraints" Value="(NodeTypeName==test)" />
                        <Parameter Name="TargetReplicaSetSize" Value="3" />
                    </Section>
                </FabricSettings>
            </ClusterManifest>
                `
            });

            await clusterManifest.ensureInitialized().toPromise();

            expect(clusterManifest.imageStoreConnectionString).toBe('');
            expect(clusterManifest.isBackupRestoreEnabled).toBe(false);
            expect(clusterManifest.isRepairManagerEnabled).toBe(false);
            expect(clusterManifest.isSfrpCluster).toBe(true);
        });

        fit('Event store enabled', async () => {
            restClientMock.getClusterManifest = (messageHandler?: IResponseMessageHandler): Observable<IRawClusterManifest> =>
            of({
                Manifest: `<ClusterManifest xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                Name="WRP_Generated_ClusterManifest" Version="37" Description="This is a generated file. Do not modify."
                xmlns="http://schemas.microsoft.com/2011/01/fabric">
                <FabricSettings>
                    <Section Name="EventStoreService">
                        <Parameter Name="MinReplicaSetSize" Value="3" />
                        <Parameter Name="PlacementConstraints" Value="(NodeTypeName==nt)" />
                        <Parameter Name="TargetReplicaSetSize" Value="5" />
                    </Section>
                </FabricSettings>
            </ClusterManifest>
                `
            });

            await clusterManifest.ensureInitialized().toPromise();

            expect(clusterManifest.isEventStoreEnabled).toBeTruthy();
        });
    });

    describe('upgrade progress', () => {

        let clusterUpgrade: ClusterUpgradeProgress;

        beforeEach((() => {
            clusterUpgrade = new ClusterUpgradeProgress(mockDataService);
        }));

        fit('completed upgrade', async () => {
            restClientMock.getClusterUpgradeProgress = (messageHandler?: IResponseMessageHandler): Observable<IRawClusterUpgradeProgress> =>
            of({
                CodeVersion: '7.0.457.9590',
                ConfigVersion: '37',
                UpgradeDomains: [
                    {
                        Name: '0',
                        State: 'Completed'
                    },
                    {
                        Name: '1',
                        State: 'Completed'
                    },
                    {
                        Name: '2',
                        State: 'Completed'
                    },
                    {
                        Name: '3',
                        State: 'Completed'
                    },
                    {
                        Name: '4',
                        State: 'Completed'
                    }
                ],
                UpgradeState: 'RollingForwardCompleted',
                NextUpgradeDomain: '',
                RollingUpgradeMode: 'Monitored',
                UpgradeDescription: {
                    CodeVersion: '7.0.457.9590',
                    ConfigVersion: '37',
                    UpgradeKind: 'Rolling',
                    RollingUpgradeMode: 'Monitored',
                    UpgradeReplicaSetCheckTimeoutInSeconds: 4294967295,
                    ForceRestart: true,
                    MonitoringPolicy: {
                        FailureAction: 'Rollback',
                        HealthCheckWaitDurationInMilliseconds: 'PT0H0M30S',
                        HealthCheckStableDurationInMilliseconds: 'PT0H1M0S',
                        HealthCheckRetryTimeoutInMilliseconds: 'PT0H45M0S',
                        UpgradeTimeoutInMilliseconds: 'PT12H0M0S',
                        UpgradeDomainTimeoutInMilliseconds: 'PT2H0M0S'
                    },
                    ClusterHealthPolicy: {
                        ConsiderWarningAsError: false,
                        MaxPercentUnhealthyNodes: 0,
                        MaxPercentUnhealthyApplications: 0
                    },
                    EnableDeltaHealthEvaluation: false,
                    SortOrder: 'Default'
                },
                UpgradeDurationInMilliseconds: 'PT0H19M2.21122S',
                UpgradeDomainDurationInMilliseconds: 'PT0H0M0.0469861S',
                UnhealthyEvaluations: [],
                CurrentUpgradeDomainProgress: {
                    DomainName: '',
                    NodeUpgradeProgressList: []
                },
                StartTimestampUtc: '2020-03-02T23:23:20.669Z',
                FailureTimestampUtc: '0001-01-01T00:00:00.000Z',
                FailureReason: 'None',
                UpgradeDomainProgressAtFailure: {
                    DomainName: '',
                    NodeUpgradeProgressList: []
                },
                IsNodeByNode: false,
                UpgradeUnits: [],
                CurrentUpgradeUnitsProgress: {
                  NodeUpgradeProgressList: []
                }
            });

            await clusterUpgrade.ensureInitialized().toPromise();

            expect(clusterUpgrade.isUpgrading).toBe(false);
            expect(clusterUpgrade.startTimestampUtc).toBe('2020-03-02T23:23:20.669Z');
            expect(clusterUpgrade.failureTimestampUtc).toBe('0001-01-01T00:00:00.000Z');
            expect(clusterUpgrade.getCompletedUpgradeDomains()).toBe(5);
        });

        fit('completed upgrade', async () => {
            restClientMock.getClusterUpgradeProgress = (messageHandler?: IResponseMessageHandler): Observable<IRawClusterUpgradeProgress> =>
            of({
                CodeVersion: '7.0.457.9590',
                ConfigVersion: '37',
                UpgradeDomains: [
                    {
                        Name: '0',
                        State: 'Completed'
                    },
                    {
                        Name: '1',
                        State: 'Completed'
                    },
                    {
                        Name: '2',
                        State: 'InProgress '
                    },
                    {
                        Name: '3',
                        State: 'Pending '
                    },
                    {
                        Name: '4',
                        State: 'Pending '
                    }
                ],
                UpgradeState: 'RollingForwardInProgress ',
                NextUpgradeDomain: '3',
                RollingUpgradeMode: 'Monitored',
                UpgradeDescription: {
                    CodeVersion: '7.0.457.9590',
                    ConfigVersion: '37',
                    UpgradeKind: 'Rolling',
                    RollingUpgradeMode: 'Monitored',
                    UpgradeReplicaSetCheckTimeoutInSeconds: 4294967295,
                    ForceRestart: true,
                    MonitoringPolicy: {
                        FailureAction: 'Rollback',
                        HealthCheckWaitDurationInMilliseconds: 'PT0H0M30S',
                        HealthCheckStableDurationInMilliseconds: 'PT0H1M0S',
                        HealthCheckRetryTimeoutInMilliseconds: 'PT0H45M0S',
                        UpgradeTimeoutInMilliseconds: 'PT12H0M0S',
                        UpgradeDomainTimeoutInMilliseconds: 'PT2H0M0S'
                    },
                    ClusterHealthPolicy: {
                        ConsiderWarningAsError: false,
                        MaxPercentUnhealthyNodes: 0,
                        MaxPercentUnhealthyApplications: 0
                    },
                    EnableDeltaHealthEvaluation: false,
                    SortOrder: 'Default'
                },
                UpgradeDurationInMilliseconds: 'PT0H19M2.21122S',
                UpgradeDomainDurationInMilliseconds: 'PT0H0M0.0469861S',
                UnhealthyEvaluations: [],
                CurrentUpgradeDomainProgress: {
                    DomainName: '2',
                    NodeUpgradeProgressList: []
                },
                StartTimestampUtc: '2020-03-02T23:23:20.669Z',
                FailureTimestampUtc: '0001-01-01T00:00:00.000Z',
                FailureReason: 'None',
                UpgradeDomainProgressAtFailure: {
                    DomainName: '',
                    NodeUpgradeProgressList: []
                },
                IsNodeByNode: false,
                UpgradeUnits: [],
                CurrentUpgradeUnitsProgress: {
                  NodeUpgradeProgressList: []
                }
            });

            await clusterUpgrade.ensureInitialized().toPromise();

            expect(clusterUpgrade.isUpgrading).toBe(true);
            expect(clusterUpgrade.startTimestampUtc).toBe('2020-03-02T23:23:20.669Z');
            expect(clusterUpgrade.failureTimestampUtc).toBe('0001-01-01T00:00:00.000Z');
            expect(clusterUpgrade.getCompletedUpgradeDomains()).toBe(2);
        });
    });

  });

