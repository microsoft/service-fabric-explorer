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
            this.data.restClient.getChaosEvents(new Date(Date.now() - 1000 * 3600 * 24), new Date(Date.now())).then(events => {
                let filteredEvents = _.filter<IRawChaosEvent>(events, ev => ev.ChaosEvent.Kind !== "Waiting");
                this.chaosHistoryEvents = _.orderBy(_.map(filteredEvents, e => {
                    return new ChaosEvent(e.ChaosEvent.Kind, e.ChaosEvent.TimeStampUtc, e.ChaosEvent.Reason, e.ChaosEvent.Faults);
                }), ["TimeStampUtc"], ["desc"]);
            });

            return Utils.getHttpResponseData(this.data.restClient.getChaos());
        }

        protected updateInternal(): angular.IPromise<any> | void {
            this.clusterManifest.refresh().then(m => this.runScope.nodeTypes = _.map((<ClusterManifest>m).nodeTypes, t => new ChaosTargetFilter(t)));
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
                this.Reason = faults.join("\r\n");
            } else {
                this.Reason = reason ? reason : "";
            }
        }
    }

    export class ChaosRunScope {
        public nodeTypes: ChaosTargetFilter[];
        // TODO: Application types?
    }

    export class ChaosTargetFilter {
        public name: string;
        public isIncluded: boolean = true;

        constructor(name: string) {
            this.name = name;
        }
    }
}
