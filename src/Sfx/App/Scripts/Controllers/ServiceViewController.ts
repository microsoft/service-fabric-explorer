//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IServiceViewScope extends angular.IScope {
        service: Service;
        serviceManifest: string;
        listSettings: ListSettings;
        healthEventsListSettings: ListSettings;
        unhealthyEvaluationsListSettings: ListSettings;
        serviceEvents: ServiceEventList;
    }

    export class ServiceViewController extends MainViewController {
        public appTypeName: string;
        public appId: string;
        public serviceId: string;

        constructor($injector: angular.auto.IInjectorService, public $scope: IServiceViewScope) {
            super($injector, {
                "essentials": { name: "Essentials" },
                "details": { name: "Details" },
                "manifest": { name: "Manifest" },
                "events": { name: "Events" }
            });
            this.tabs["essentials"].refresh = (messageHandler) => this.refreshEssentials(messageHandler);
            this.tabs["manifest"].refresh = (messageHandler) => this.refreshManifest(messageHandler);
            this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);

            let routeParams = this.routeParams;
            this.appTypeName = IdUtils.getAppTypeName(routeParams);
            this.appId = IdUtils.getAppId(routeParams);
            this.serviceId = IdUtils.getServiceId(routeParams);

            if (this.appTypeName === Constants.SystemAppTypeName) {
                // remove manifest tab for system app service
                delete (this.tabs["manifest"]);

                this.selectTreeNode([
                    IdGenerator.cluster(),
                    IdGenerator.systemAppGroup(),
                    IdGenerator.service(this.serviceId)
                ]);
            } else {
                this.selectTreeNode([
                    IdGenerator.cluster(),
                    IdGenerator.appGroup(),
                    IdGenerator.appType(this.appTypeName),
                    IdGenerator.app(this.appId),
                    IdGenerator.service(this.serviceId)
                ]);
            }

            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("partitions", ["id"], [
                new ListColumnSettingForLink("id", "Id", item => item.viewPath),
                new ListColumnSettingWithFilter("partitionInformation.raw.ServicePartitionKind", "Partition Kind"),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.PartitionStatus", "Status"),
            ]);

            this.$scope.healthEventsListSettings = this.settings.getNewOrExistingHealthEventsListSettings();
            this.$scope.unhealthyEvaluationsListSettings = this.settings.getNewOrExistingUnhealthyEvaluationsListSettings();
            this.$scope.serviceEvents = this.data.createServiceEventList(this.serviceId);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getService(this.appId, this.serviceId, true, messageHandler)
                .then(service => {
                    this.$scope.service = service;

                    return this.$q.all([
                        this.$scope.service.health.refresh(messageHandler),
                        this.$scope.service.description.refresh(messageHandler)
                    ]);
                });
        }

        private refreshEssentials(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.service.partitions.refresh(messageHandler);
        }

        private refreshManifest(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let app = this.$scope.service.parent;
            return this.data.getServiceType(app.raw.TypeName, app.raw.TypeVersion, this.$scope.service.description.raw.ServiceTypeName, true, messageHandler)
                .then(serviceType => {
                    return serviceType.manifest.refresh(messageHandler).then(() => {
                        this.$scope.serviceManifest = serviceType.manifest.raw.Manifest;
                    });
                });
        }

        private refreshEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.serviceEvents.refresh(new EventsStoreResponseMessageHandler(messageHandler));
        }
    }

    (function () {

        let module = angular.module("serviceViewController", []);
        module.controller("ServiceViewController", ["$injector", "$scope", ServiceViewController]);

    })();
}
