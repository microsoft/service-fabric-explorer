//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class HealthEvent extends DataModelBase<IRawHealthEvent> {
        public constructor(data: DataService, raw: IRawHealthEvent) {
            super(data, raw);
        }

        public get uniqueId(): string {
            return `${this.raw.SourceId}_${this.raw.Property}_${this.raw.SequenceNumber}`;
        }

        public get description(): string {
            return this.raw.Description.trim();
        }

        public get sourceUtcTimestamp(): string {
            return TimeUtils.timestampToUTCString(this.raw.SourceUtcTimestamp);
        }

        public get TTL(): string {
            return TimeUtils.getDuration(this.raw.TimeToLiveInMilliSeconds);
        }
    }

    export class HealthEvaluation extends DataModelBase<IRawHealthEvaluation> {
        public viewPathUrl: string = "";

        public constructor(raw: IRawHealthEvaluation, public level: number = 0, parent: HealthEvaluation = null, viewPathUrl: string = "") {
            super(null, raw, parent);
            this.viewPathUrl = viewPathUrl;
        }

        public get viewPath(): string {
            return this.viewPathUrl;
        }

        public get kind(): string {
            if (this.level > 0) {
                return _.repeat(" ", this.level * 4) + this.raw.Kind;
            } else {
                return this.raw.Kind;
            }
        }

        public get uniqueId(): string {
            // Explicitly set this to null to allow detail-list directive to use angular build-in parameter $id to track the list.
            return null;
        }

        public get description(): string {
            let description = "";
            if (this.raw.UnhealthyEvent) {
                description =  (this.raw.Description + "\n" + this.raw.UnhealthyEvent.Description).trim();
            } else {
                description = this.raw.Description.trim();
            }

            // Temp solution for rendering a link instead of plain text
            // Long term solution would be an independent service which provides troubleshooting tips based on health report
            return description.replace("http://aka.ms/sfhealth", "<a href='https://aka.ms/sfhealth' target='_blank'>https://aka.ms/sfhealth</a>");
        }
    }

    export class LoadMetricInformation extends DataModelBase<IRawLoadMetricInformation> {
        public decorators: IDecorators = {
            showList: [
                "Name",
                "BalancingThreshold",
                "Action",
                "IsBalancedBefore",
                "DeviationBefore",
                "IsBalancedAfter",
                "DeviationAfter"
            ]
        };

        public selected: boolean;

        public get minNodeLoadId(): string {
            return this.raw.MinNodeLoadId.Id;
        }

        public get maxNodeLoadId(): string {
            return this.raw.MaxNodeLoadId.Id;
        }

        public get hasCapacity(): boolean {
            return this.raw.ClusterCapacity && +this.raw.ClusterCapacity > 0;
        }

        public get isResourceGovernanceMetric(): boolean {
            return _.startsWith(this.raw.Name, "servicefabric:/_");
        }

        public get isSystemMetric(): boolean {
            return _.startsWith(this.raw.Name, "__") && _.endsWith(this.raw.Name, "__");
        }

        public get isLoadMetric(): boolean {
            return !(this.isResourceGovernanceMetric || this.isSystemMetric);
        }

        public get loadCapacityRatio(): number {
            return this.hasCapacity ? this.raw.CurrentClusterLoad / this.raw.ClusterCapacity : 0;
        }

        public get loadCapacityRatioString(): string {
            return (this.loadCapacityRatio * 100).toFixed(1) + "%";
        }

        public get displayName(): string {
            return this.name.replace(/^servicefabric:\/_/, "Reserved ");
        }

        public constructor(data: DataService, raw: IRawLoadMetricInformation) {
            super(data, raw);
        }
    }

    export class UpgradeDescription extends DataModelBase<IRawUpgradeDescription> {
        public monitoringPolicy: MonitoringPolicy;

        public constructor(data: DataService, raw: IRawUpgradeDescription) {
            super(data, raw);

            this.monitoringPolicy = new MonitoringPolicy(this.data, raw.MonitoringPolicy);
        }
    }

    export class MonitoringPolicy extends DataModelBase<IRawMonitoringPolicy> {
        public decorators: IDecorators = {
            decorators: {
                "HealthCheckWaitDurationInMilliseconds": {
                    displayName: (name) => "Health Check Wait Duration",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                },
                "HealthCheckStableDurationInMilliseconds": {
                    displayName: (name) => "Health Check Stable Duration",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                },
                "HealthCheckRetryTimeoutInMilliseconds": {
                    displayName: (name) => "Health Check Retry Timeout",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                },
                "UpgradeTimeoutInMilliseconds": {
                    displayName: (name) => "Upgrade Timeout",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                },
                "UpgradeDomainTimeoutInMilliseconds": {
                    displayName: (name) => "Upgrade Domain Timeout",
                    displayValueInHtml: (value) => TimeUtils.getDuration(value)
                }
            }
        };

        public constructor(data: DataService, raw: IRawMonitoringPolicy) {
            super(data, raw);
        }
    }

    export class UpgradeDomain extends DataModelBase<IRawUpgradeDomain> {
        public constructor(data: DataService, raw: IRawUpgradeDomain) {
            super(data, raw);
        }

        public get badgeClass(): string {
            if (UpgradeDomainStateRegexes.Completed.test(this.raw.State)) {
                return BadgeConstants.BadgeOK;
            } else if (UpgradeDomainStateRegexes.InProgress.test(this.raw.State)) {
                return BadgeConstants.BadgeWarning;
            }
            return BadgeConstants.BadgeUnknown;
        }
    }
}

