//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export class Chaos extends DataModelBase<IRawChaos> {
        private chaosHistoryEvents: ChaosEvent[];
        private runScope: ChaosRunScope = new ChaosRunScope();
        private clusterManifest: ClusterManifest = new ClusterManifest(this.data);

        public constructor(data: DataService, raw: IRawChaos) {
            super(data, raw);
        }

        public get status(): string {
            return this.raw.Status;
        }

        public get events(): ChaosEvent[] {
            return this.chaosHistoryEvents;
        }

        // Here we can pass an instance of IRawChaosParameters so that we don't have to use all these parameters
        public start(timeToRunInSeconds: number, waitTimeBetweenIterationsInSeconds: number, maxClusterStabilizationTimeoutInSeconds: number, maxConcurrentFaults: number, nodeTypeInclusionList: string[]): angular.IHttpPromise<any> {
            this.raw.Status = "Started";
            let parameter = <IRawChaosParameters>{};
            parameter.TimeToRunInSeconds = timeToRunInSeconds;
            parameter.WaitTimeBetweenIterationsInSeconds = waitTimeBetweenIterationsInSeconds;
            parameter.MaxConcurrentFaults = maxConcurrentFaults;
            parameter.MaxClusterStabilizationTimeoutInSeconds = maxClusterStabilizationTimeoutInSeconds;
            parameter.ChaosTargetFilter = <IRawChaosTargetFilter>{};
            parameter.ChaosTargetFilter.NodeTypeInclusionList = nodeTypeInclusionList;

            return this.data.restClient.startChaos(parameter);
        }

        public stop(): angular.IHttpPromise<any> {
            return this.data.restClient.stopChaos();
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawChaos> {
            Utils.getHttpResponseData(this.data.restClient.getChaosEvents()).then(events => {
                this.chaosHistoryEvents = _.orderBy(_.map(events.History, e => {
                    return new ChaosEvent(e.ChaosEvent.Kind, e.ChaosEvent.TimeStampUtc, e.ChaosEvent.Reason, e.ChaosEvent.Faults);
                }), [ "TimeStampUtc" ], [ "desc" ]);
            });

            return Utils.getHttpResponseData(this.data.restClient.getChaos());
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.clusterManifest.refresh().then(m => this.runScope.nodeTypes = m.nodeTypes);
        }
    }

    export class ChaosEvent {
        Kind: string;
        TimeStampUtc: string;
        Reason?: string;
        Faults?: string[];

        constructor(kind: string, timestampUtc: string, reason?: string, faults?: string[]) {
            this.Kind = kind;
            this.TimeStampUtc = timestampUtc;
            this.Faults = faults;
            if (faults && faults.length > 0) {
                this.Reason = faults[0];
            } else {
                this.Reason = reason;
            }
        }
    }

    export class ChaosRunScope {
        public nodeTypes: string[];
        // TODO: Application types?
    }
}
