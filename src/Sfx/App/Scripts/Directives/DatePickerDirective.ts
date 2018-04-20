//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
//<sfx-date-picker ng-model="dtSelectedTime" min-date="'2018-01-01'" max-date="'2019-01-01'" datepicker-options="dateOptions"></sfx-date-picker>
    export class DatePickerDirective implements ng.IDirective {
        public restrict = "E";
        public controller = DatePickerController;
        public controllerAs = "ctrl";
        public templateUrl = "partials/date-picker.html";
        public scope = {
            ngModel: "=",
            minDate: "=?",
            maxDate: "=?",
            dtpRequired: "=?",
            dateOptions: "=?"
        };
        public require: "ngModel";

        public link($scope: any, element: JQuery) {
            $scope.dateOptions = $scope.dateOptions || {
                formatYear: "yy",
                startingDay: 1,
                showWeeks: false
            };

            $scope.formats = ["dd-MMMM-yyyy", "yyyy/MM/dd", "dd.MM.yyyy", "shortDate"];
            $scope.format = $scope.formats[0];
        }
    }

    export class DatePickerController {
        public static $inject = ["$scope"];

        public constructor(private $scope: any) {
        }

        public openPopup(event: any): void {
            event.stopPropagation();
            this.$scope.opened = !this.$scope.opened;
        }
    }
}
