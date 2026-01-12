import {
    IRawStatefulService,
    IRawStatelessService,
    IRawSelfReconfiguringService,
    isStatefulService,
    isStatelessService,
    isSelfReconfiguringService,
    IRawPartition,
    IRawReplicaOnPartition
} from './RawDataTypes';

describe('ServiceKind Type Guards', () => {

    describe('isStatefulService', () => {

        it('should return true for Stateful service', () => {
            const service: IRawStatefulService = {
                Id: 'test-service-1',
                ServiceKind: 'Stateful',
                Name: 'fabric:/App/StatefulService',
                TypeName: 'StatefulServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false,
                HasPersistedState: true
            };
            expect(isStatefulService(service)).toBe(true);
        });

        it('should return false for Stateless service', () => {
            const service: IRawStatelessService = {
                Id: 'test-service-2',
                ServiceKind: 'Stateless',
                Name: 'fabric:/App/StatelessService',
                TypeName: 'StatelessServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false
            };
            expect(isStatefulService(service)).toBe(false);
        });

        it('should return false for SelfReconfiguring service', () => {
            const service: IRawSelfReconfiguringService = {
                Id: 'test-service-3',
                ServiceKind: 'SelfReconfiguring',
                Name: 'fabric:/App/SelfReconfiguringService',
                TypeName: 'SelfReconfiguringServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false
            };
            expect(isStatefulService(service)).toBe(false);
        });
    });

    describe('isStatelessService', () => {

        it('should return false for Stateful service', () => {
            const service: IRawStatefulService = {
                Id: 'test-service-1',
                ServiceKind: 'Stateful',
                Name: 'fabric:/App/StatefulService',
                TypeName: 'StatefulServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false,
                HasPersistedState: true
            };
            expect(isStatelessService(service)).toBe(false);
        });

        it('should return true for Stateless service', () => {
            const service: IRawStatelessService = {
                Id: 'test-service-2',
                ServiceKind: 'Stateless',
                Name: 'fabric:/App/StatelessService',
                TypeName: 'StatelessServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false
            };
            expect(isStatelessService(service)).toBe(true);
        });

        it('should return false for SelfReconfiguring service', () => {
            const service: IRawSelfReconfiguringService = {
                Id: 'test-service-3',
                ServiceKind: 'SelfReconfiguring',
                Name: 'fabric:/App/SelfReconfiguringService',
                TypeName: 'SelfReconfiguringServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false
            };
            expect(isStatelessService(service)).toBe(false);
        });
    });

    describe('isSelfReconfiguringService', () => {

        it('should return false for Stateful service', () => {
            const service: IRawStatefulService = {
                Id: 'test-service-1',
                ServiceKind: 'Stateful',
                Name: 'fabric:/App/StatefulService',
                TypeName: 'StatefulServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false,
                HasPersistedState: true
            };
            expect(isSelfReconfiguringService(service)).toBe(false);
        });

        it('should return false for Stateless service', () => {
            const service: IRawStatelessService = {
                Id: 'test-service-2',
                ServiceKind: 'Stateless',
                Name: 'fabric:/App/StatelessService',
                TypeName: 'StatelessServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false
            };
            expect(isSelfReconfiguringService(service)).toBe(false);
        });

        it('should return true for SelfReconfiguring service', () => {
            const service: IRawSelfReconfiguringService = {
                Id: 'test-service-3',
                ServiceKind: 'SelfReconfiguring',
                Name: 'fabric:/App/SelfReconfiguringService',
                TypeName: 'SelfReconfiguringServiceType',
                ManifestVersion: '1.0.0',
                ServiceStatus: 'Active',
                HealthState: 'Ok',
                IsServiceGroup: false
            };
            expect(isSelfReconfiguringService(service)).toBe(true);
        });
    });

    describe('Type guards work with IRawPartition', () => {

        it('should correctly identify stateful partition', () => {
            const partition: IRawPartition = {
                ServiceKind: 'Stateful',
                PartitionInformation: {
                    Id: 'partition-1',
                    ServicePartitionKind: 'Singleton',
                    HighKey: '',
                    LowKey: '',
                    Name: ''
                },
                TargetReplicaSetSize: 3,
                MinReplicaSetSize: 2,
                AuxiliaryReplicaCount: 0,
                InstanceCount: 0,
                HealthState: 'Ok',
                PartitionStatus: 'Ready',
                CurrentConfigurationEpoch: {
                    ConfigurationVersion: 1,
                    DataLossVersion: 1
                },
                MinInstanceCount: 0,
                SelfReconfiguringInstanceCount: 0,
                SelfReconfiguringMinInstanceCount: 0
            };
            expect(isStatefulService(partition)).toBe(true);
            expect(isStatelessService(partition)).toBe(false);
            expect(isSelfReconfiguringService(partition)).toBe(false);
        });

        it('should correctly identify stateless partition', () => {
            const partition: IRawPartition = {
                ServiceKind: 'Stateless',
                PartitionInformation: {
                    Id: 'partition-2',
                    ServicePartitionKind: 'Singleton',
                    HighKey: '',
                    LowKey: '',
                    Name: ''
                },
                TargetReplicaSetSize: 0,
                MinReplicaSetSize: 0,
                AuxiliaryReplicaCount: 0,
                InstanceCount: 3,
                HealthState: 'Ok',
                PartitionStatus: 'Ready',
                CurrentConfigurationEpoch: {
                    ConfigurationVersion: 1,
                    DataLossVersion: 1
                },
                MinInstanceCount: 1,
                SelfReconfiguringInstanceCount: 0,
                SelfReconfiguringMinInstanceCount: 0
            };
            expect(isStatefulService(partition)).toBe(false);
            expect(isStatelessService(partition)).toBe(true);
            expect(isSelfReconfiguringService(partition)).toBe(false);
        });
    });

    describe('Type guards work with IRawReplicaOnPartition', () => {

        it('should correctly identify stateful replica', () => {
            const replica: IRawReplicaOnPartition = {
                ServiceKind: 'Stateful',
                Address: '',
                HealthState: 'Ok',
                ReplicaId: 'replica-1',
                ReplicaRole: 'Primary',
                PreviousReplicaRole: 'None',
                InstanceId: '',
                LastInBuildDurationInSeconds: '0',
                NodeName: 'Node1',
                ReplicaStatus: 'Ready',
                ToBeRemovedReplicaExpirationTimeUtc: '',
                InstanceRole: '',
                PreviousSelfReconfiguringInstanceRole: '',
                SelfReconfiguringInstanceActivationState: '',
                PreviousSelfReconfiguringInstanceActivationState: ''
            };
            expect(isStatefulService(replica)).toBe(true);
            expect(isStatelessService(replica)).toBe(false);
        });
    });
});
