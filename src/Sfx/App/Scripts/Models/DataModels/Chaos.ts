//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export class Chaos extends DataModelBase<IRawChaos> {
        private chaosHistoryEvents: ChaosEvent[];

        public constructor(data: DataService, raw: IRawChaos) {
            super(data, raw);

        }

        public get status(): string {
            return this.raw.Status;
        }

        public get events(): ChaosEvent[] {
            return this.chaosHistoryEvents;
        }

        public start(timeToRunInSeconds: number): angular.IHttpPromise<any> {
            this.raw.Status = "Started";
            return this.data.restClient.startChaos(timeToRunInSeconds);
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
}
