//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export interface IEventsViewScope extends angular.IScope {
        eventsList: EventListBase<any>;
        timelineGenerator?: ITimelineDataGenerator<FabricEventBase>;
    }

    export class EventsViewDirective implements ng.IDirective {
        public restrict = "E";
        public templateUrl = "partials/events-view.html";
        public scope = {
            eventsList: "=",
            timelineGenerator: "=?",
        };

        public link($scope: any, element: JQuery, attributes: any) {
            $scope.dwSelector = new DateWindowSelector($scope.eventsList, $scope.timelineGenerator);
            $scope.resetClick = () => {
                $scope.dwSelector.reset();
            };
        }
    }

    // Wrapper for datepickers models.
    class DateWindowSelector {
        public static MaxWindowInDays: number = 7;
        public startDateMin: Date;
        public endDateMin: Date;
        public startDateMax: Date;
        public endDateMax: Date;
        public startDateInit: Date;
        public endDateInit: Date;
        public isResetEnabled: boolean = false;
        public timeLineEventsData: ITimelineData;

        private eventsList: EventListBase<any>;
        private isStartSelected: boolean;
        private isEndSelected: boolean;
        private _startDate: Date = null;
        private _endDate: Date = null;

        private _timelineGenerator: ITimelineDataGenerator<FabricEventBase>;

        public constructor(eventsList: EventListBase<any>, timelineGenerator?: ITimelineDataGenerator<FabricEventBase>) {
            this.eventsList = eventsList;
            if (timelineGenerator) {
                this._timelineGenerator = timelineGenerator;
            }
            this.resetSelectionProperties();
            this.setTimelineData();
        }

        public get startDate() { return this._startDate; }
        public get endDate() { return this._endDate; }
        public set startDate(value: Date) {
            this._startDate = value;
            if (!this.isEndSelected) {
                this.endDateMin = this._startDate;
                this.endDateMax = TimeUtils.AddDays(
                    this._startDate,
                    DateWindowSelector.MaxWindowInDays);
                if (this.endDateMax > new Date()) {
                    this.endDateMax = new Date();
                }
                this.endDateInit = this._startDate;
                this.isStartSelected = true;
            }
                this.setNewDateWindow();
        }
        public set endDate(value: Date) {
            this._endDate = value;
            if (!this.isStartSelected) {
                this.startDateMax = this._endDate;
                this.startDateMin = TimeUtils.AddDays(
                    this._endDate,
                    (-7 * DateWindowSelector.MaxWindowInDays));
                this.startDateInit = this._endDate;
                this.isEndSelected = true;
            }
                this.setNewDateWindow();
        }

        public reset(): void {
            this.isResetEnabled = false;
            if (this.eventsList.resetDateWindow()) {
                this.resetSelectionProperties();
                this.eventsList.reload().then( data => {
                    this.setTimelineData();
                });
            } else {
                this.resetSelectionProperties();
            }
        }

        private resetSelectionProperties(): void {
            this._startDate = this.eventsList.startDate;
            this._endDate = this.eventsList.endDate;
            this.startDateMin = this.endDateMin = TimeUtils.AddDays(new Date(),-30);
            this.startDateMax = this.endDateMax = new Date(); //Today
            this.startDateInit = this.endDateInit = new Date(); //Today
            this.isStartSelected = this.isEndSelected = false;
        }

        private setNewDateWindow(): void {
            if (this.eventsList.setDateWindow(this._startDate, this._endDate)) {
                this.resetSelectionProperties();
                this.isResetEnabled = true;
                this.eventsList.reload().then( data => {
                    this.setTimelineData();
                });
            } else {
                this.resetSelectionProperties();
            }
        }

        private setTimelineData(): void {
            if (this._timelineGenerator ){
                this.eventsList.ensureInitialized().then( () => {
                    const d = this._timelineGenerator.consume(this.eventsList.collection.map(event => event.raw), this.startDate, this.endDate);
                    this.timeLineEventsData = {
                        groups: d.groups,
                        items: d.items,
                        start: this.startDate,
                        end: this.endDate
                    };
                });             
            }
        }
    }
}
