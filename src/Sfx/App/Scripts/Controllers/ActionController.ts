//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IActionScope extends angular.IScope {
        action: Action;
        ok: () => void;
        cancel: () => void;
    }

    export class ActionController {
        static $inject = ["$scope", "$uibModalInstance", "action"];

        constructor($scope: IActionScope, $uibModalInstance: angular.ui.bootstrap.IModalServiceInstance, action: Action) {
            $scope.action = action;
            $scope.ok = () => {
                $uibModalInstance.close();
            };
            $scope.cancel = () => {
                $uibModalInstance.dismiss();
            };
        }
    }

    (function () {

        let module = angular.module("actionController", []);
        module.controller("ActionController", ["$scope", "$uibModalInstance", "action", ActionController]);

    })();
}
