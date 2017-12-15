//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class ControllerManagerService {
        private currentControllers: IControllerBase[] = [];

        constructor(private $q: angular.IQService) {
        }

        registerMainController(controller: IControllerBase): void {
            this.currentControllers = [];
            this.registerController(controller);
        }

        registerController(controller: IControllerBase): void {
            this.currentControllers.push(controller);
        }

        refreshCurrentControllers(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let promises: angular.IPromise<void>[] = [];

            $.each(this.currentControllers, (_, ctrl: ControllerBase) => { promises.push(ctrl.refresh(messageHandler)); });
            return this.$q.all(promises);
        }
    }

    (function () {

        let module = angular.module("controllerManagerService", []);
        module.factory("controllerManager", ["$q", ($q) => new ControllerManagerService($q)]);

    })();
}
