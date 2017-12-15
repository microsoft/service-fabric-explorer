//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export interface ISliderController {
        min: number;
        max: number;
        step: number;
        default: number;
        slide: (value: number) => void;
    }

    export class SliderDirective implements ng.IDirective {
        public restrict = "E";
        public require = "^^ngController";

        public link($scope: any, element: JQuery, attributes: any, ctrl: ISliderController) {

            $(element).slider({
                value: ctrl.default,
                min: ctrl.min,
                max: ctrl.max,
                step: ctrl.step,
                change: (event, ui) => ctrl.slide(ui.value)
            });

            $("#" + attributes.minLabelId).click(() => {
                $(element).slider("option", "value", ctrl.min);
            });

            $("#" + attributes.maxLabelId).click(() => {
                $(element).slider("option", "value", ctrl.max);
            });
        }
    }

    export class RefreshSliderController implements ISliderController {

        private static Stops: number[] = [
            0,
            300,
            60,
            30,
            15,
            10,
            5,
            2
        ];

        public min = 0;
        public max = RefreshSliderController.Stops.length - 1;
        public step = 1;
        public default = Constants.DefaultAutoRefreshInterval;
        public refreshRate: number;

        constructor(private storageService: StorageService, private $rootScope: angular.IRootScopeService) {

            let refreshInterval = this.storageService.getValueNumber(Constants.AutoRefreshIntervalStorageKey, this.default);
            let sliderValue = RefreshSliderController.Stops.indexOf(refreshInterval);
            if (sliderValue === -1) {
                sliderValue = this.min;
            }

            this.default = sliderValue;
            this.refreshRate = RefreshSliderController.Stops[sliderValue];
        }

        public slide(value: number): void {
            if (value < 0 || value >= RefreshSliderController.Stops.length) {
                value = 0;
            }
            this.refreshRate = RefreshSliderController.Stops[value];
            this.storageService.setValue(Constants.AutoRefreshIntervalStorageKey, this.refreshRate);

            if (!this.$rootScope.$$phase) {
                this.$rootScope.$apply();
            }
        }
    }
}
