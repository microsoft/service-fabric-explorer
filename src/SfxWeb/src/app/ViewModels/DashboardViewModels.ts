import { IRawHealthStateCount } from '../Models/RawDataTypes';
import { RoutesService } from '../services/routes.service';
import { ValueResolver, ITextAndBadge } from '../Utils/ValueResolver';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export interface IDashboardViewModel {
    displayTitle: string;
    largeTile: boolean;
    count: number;
    viewPath: string;
    dataPoints: IDashboardDataPointViewModel[];
    onClick(): void;
    getDataPointTooltip(dp: IDashboardDataPointViewModel): string;
}

export interface IDashboardDataPointViewModel {
    state: ITextAndBadge;
    title: string;
    count: number;
    // To prevent the generated ring chart with very small section which is too
    // hard to see, adjust the count to create a section with minimal width.
    adjustedCount: number;
}

export class DashboardViewModel implements IDashboardViewModel {
    public count = 0;
    public viewPath: string;

    public static fromHealthStateCount(
        title: string,
        titleInSingular: string,
        largeTile: boolean,
        healthStateCount: IRawHealthStateCount,
        routes?: RoutesService,
        viewPath?: string) {

        const dps: DashboardDataPointViewModel[] = [];
        dps.push(new DashboardDataPointViewModel('Error', healthStateCount.ErrorCount, ValueResolver.healthStatuses[3]));
        dps.push(new DashboardDataPointViewModel('Warning', healthStateCount.WarningCount, ValueResolver.healthStatuses[2]));
        dps.push(new DashboardDataPointViewModel('Healthy', healthStateCount.OkCount, ValueResolver.healthStatuses[1]));

        const data = new DashboardViewModel(title, titleInSingular, dps, largeTile, routes, viewPath);

        return data;
    }

    constructor(
        private title: string,
        private titleInSingular: string,
        public dataPoints: IDashboardDataPointViewModel[] = [],
        public largeTile: boolean,
        private routes?: RoutesService,
        viewPath?: string) {

        this.viewPath = viewPath;
        this.count = dataPoints.reduce((sum, d) => sum + d.count, 0);
        this.adjustCount();
    }

    public get displayTitle(): string {
        return this.count === 1 ? this.titleInSingular : this.title;
    }

    public getDataPointTooltip(dp: IDashboardDataPointViewModel): string {
        return `${dp.title}: ${((dp.count / this.count) * 100).toFixed(1)}%`;
    }

    public onClick() {
        if (this.viewPath && this.routes) {
            this.routes.navigate(() => this.viewPath);
        }
    }

    private adjustCount(): void {
        this.dataPoints.forEach(dp => {
            if (dp.count === 0) {
                dp.adjustedCount = 0;
            } else {
                // To prevent the generated ring chart with too small section to see, adjust the count
                // to create a section with minimal 2% section.
                dp.adjustedCount = Math.max(this.count * 0.02, dp.count);
            }
        });
    }
}

export class DashboardDataPointViewModel implements IDashboardDataPointViewModel {
    public adjustedCount = 0;

    constructor(public title: string, public count: number, public state: ITextAndBadge) {
    }
}

