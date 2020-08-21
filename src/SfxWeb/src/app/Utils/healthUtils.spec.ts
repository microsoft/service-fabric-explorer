import { HealthUtils } from "./healthUtils";
import { IRawHealthEvaluation, IRawDeployedServicePackageHealthEvaluation, IRawNodeHealthEvluation, IRawApplicationHealthEvluation, IRawServiceHealthEvaluation, IRawPartitionHealthEvaluation, IRawReplicaHealthEvaluation } from "../Models/RawDataTypes";
import { DataService } from "../services/data.service";
import { ApplicationCollection } from "../Models/DataModels/collections/Collections";


describe('Health Utils', () => {
    describe('parsing health events', () => {

        let dataService: DataService;

        beforeEach((() => {
            dataService = {} as DataService;
        }))

        describe('getViewPathUrl', () => {
            fit('Nodes', () => {
                let health = {
                    Kind: "Nodes"
                } as IRawHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService);

                expect(data).toEqual({
                    viewPathUrl: "/nodes",
                    displayName: "Nodes",
                });
            });

            fit('Node', () => {
                let health = {
                    Kind: "Node",
                    NodeName: "test"
                } as IRawNodeHealthEvluation;
            
                let data = HealthUtils.getViewPathUrl(health, dataService);

                expect(data).toEqual({
                    viewPathUrl: "/node/test",
                    displayName: "test",
                });
            });

            fit('Applications', () => {
                let health = {
                    Kind: "Applications",
                } as IRawHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService);

                expect(data).toEqual({
                    viewPathUrl: "/apps",
                    displayName: "applications",
                });
            });

            fit('Application', () => {
                let health = {
                    Kind: "Application",
                    ApplicationName: "fabric:/test"
                } as IRawApplicationHealthEvluation;

                let apps = {
                    find: (name: string) => {
                        return {
                            raw: {TypeName: "someType"}
                        }
                    }
                }
                dataService.apps = apps as ApplicationCollection;

                let data = HealthUtils.getViewPathUrl(health, dataService);

                expect(data).toEqual({
                    viewPathUrl: "/apptype/someType/app/test",
                    displayName: "test",
                });
            });

            fit('Service user app', () => {
                let health = {
                    Kind: "Service",
                    Description: "Service 'fabric:/WordCountV1/WordCountWebService' is in Warning.",
                    AggregatedHealthState: "Warning",
                    ServiceName: "fabric:/WordCountV1/WordCountWebService"
                } as IRawServiceHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");

                expect(data).toEqual({
                    viewPathUrl: "/parent/service/WordCountV1%2FWordCountWebService",
                    displayName: "WordCountV1/WordCountWebService",
                });
            });

            fit('Service system app', () => {
                let health = {
                    Kind: "Service",
                    AggregatedHealthState: "Warning",
                    ServiceName: "fabric:/System%2FClusterManagerService"
                } as IRawServiceHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");

                expect(data).toEqual({
                    viewPathUrl: "/apptype/System/app/System/service/System%252FClusterManagerService",
                    displayName: "System%2FClusterManagerService",
                });
            });

            fit('Partition', () => {
                let health = {
                    Kind: "Partition",
                    PartitionId: "512361234123465"
                } as IRawPartitionHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");

                expect(data).toEqual({
                    viewPathUrl: "/parent/partition/512361234123465",
                    displayName: "512361234123465",
                });
            });

            fit('Replica', () => {
                let health = {
                    Kind: "Replica",
                    ReplicaOrInstanceId: "512361234123465"
                } as IRawReplicaHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");

                expect(data).toEqual({
                    viewPathUrl: "/parent/replica/512361234123465",
                    displayName: "512361234123465",
                });
            });

            fit('Event', () => {
                let health = {
                    Kind: "Event",
                } as IRawHealthEvaluation;
                health["SourceId"] = "someId"
                health["Property"] = "Ok"
                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");

                expect(data).toEqual({
                    viewPathUrl: "/parent",
                    displayName: "Event",
                });
            });

            fit('DeployedServicePackage', () => {
                let health = {
                    Kind: "DeployedServicePackage",
                    ServiceManifestName: "manifest"
                } as IRawDeployedServicePackageHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");

                expect(data).toEqual({
                    viewPathUrl: "/parent/deployedservice/manifest",
                    displayName: "manifest",
                });

                health["ServicePackageActivationId"] = "1234"
                data = HealthUtils.getViewPathUrl(health, dataService, "/parent");

                expect(data).toEqual({
                    viewPathUrl: "/parent/deployedservice/activationid/1234manifest",
                    displayName: "manifest",
                });

            });

            fit('DeployedServicePackages', () => {
                let health = {
                    Kind: "DeployedServicePackages",
                } as IRawHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");
                expect(data).toEqual({
                    viewPathUrl: "/parent",
                    displayName: "DeployedServicePackages",
                });
            });
            fit('Partitions', () => {
                let health = {
                    Kind: "Partitions",
                } as IRawHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");
                expect(data).toEqual({
                    viewPathUrl: "/parent",
                    displayName: "Partitions",
                });
            });

            fit('Replicas', () => {
                let health = {
                    Kind: "Replicas",
                } as IRawHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");
                expect(data).toEqual({
                    viewPathUrl: "/parent",
                    displayName: "Replicas",
                });
            });

            fit('Services', () => {
                let health = {
                    Kind: "Services",
                } as IRawHealthEvaluation;

                let data = HealthUtils.getViewPathUrl(health, dataService, "/parent");
                expect(data).toEqual({
                    viewPathUrl: "/parent",
                    displayName: "Services",
                });
            });
        })
    });
})