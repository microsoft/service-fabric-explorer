//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export interface ITextFileInputScope extends ng.IScope {
        loading: boolean;
        ngModel: string;
        accept: string;
        required: boolean;
    }

    export class TextFileInputDirective implements ng.IDirective {
        public restrict = "E";

        public templateUrl = "partials/text-file-input.html";

        public scope = {
            ngModel: "=ngModel"
        };

        public link($scope: ITextFileInputScope, element: JQuery) {
            $scope.loading = false;
            $scope.required = element.attr("required") === "required";
            $scope.accept = element.attr("accept");

            $(element).find("input:file").on("change", ($event) => {
                $scope.loading = true;

                let textFileReader = new FileReader();

                textFileReader.onload = (event) => {
                    $scope.$apply(() => {
                        $scope.ngModel = event.target["result"];
                        $scope.loading = false;
                    });
                };

                textFileReader.readAsText($event.target["files"][0]);
            });
        }
    }
}
