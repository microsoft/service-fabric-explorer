//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export class DatePickerDirective implements ng.IDirective {
        public restrict = "E";
        public controller = DatePickerController;
        public controllerAs = "ctrl";
        public templateUrl = "partials/date-picker.html";
        public scope = {
            ngModel: "=",
            minDate: "=?",
            maxDate: "=?",
            initDate: "=?",
            readOnly: "=?",
            placeHolderText: "=?",
        };

        public link($scope: any, element: JQuery, attributes: any) {
            $scope.initDate = $scope.initDate || new Date();
            $scope.readOnly = $scope.readOnly || true;
            $scope.placeHolderText = $scope.placeHolderText || "";
            $scope.formats = ["dd-MMMM-yyyy", "yyyy/MM/dd", "dd.MM.yyyy", "shortDate"];
            $scope.format = $scope.formats[0];
        }
    }

    export class DatePickerController {
        public static $inject = ["$scope"];

        public constructor(private $scope: any) {
        }

        public popupClick(event: any): void {
            event.stopPropagation();
            this.$scope.opened = !this.$scope.opened;
        }

        public popupFocus(event: any): void {
            if (!this.$scope.opened) {
                this.$scope.opened = true;
            }
        }
    }
}
