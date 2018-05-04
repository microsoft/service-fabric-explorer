//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IAppsViewScope extends angular.IScope {
        apps: ApplicationCollection;
        actions: ActionCollection;
        listSettings: ListSettings;
        upgradeAppsListSettings: ListSettings;
        upgradeProgresses: ApplicationUpgradeProgress[];
        appEvents: ApplicationEventList;
    }

    export class AppsViewController extends MainViewController {
        constructor($injector: angular.auto.IInjectorService, public $scope: IAppsViewScope) {
            super($injector, {
                "applications": { name: "All Applications" },
                "upgrades": { name: "Upgrades in Progress", superscriptClass: "tab-superscript-number" },
                "events": { name: "Events" }
            });

            $scope.actions = new ActionCollection(this.data.telemetry, this.data.$q);

            if (this.data.actionsEnabled()) {
                this.setupActions(this.$scope.actions);
            }

            this.tabs["upgrades"].refresh = (messageHandler) => this.refreshUpgradesTab(messageHandler);
            this.tabs["events"].refresh = (messageHandler) => this.refreshEvents(messageHandler);

            this.selectTreeNode([
                IdGenerator.cluster(),
                IdGenerator.appGroup()
            ]);

            this.$scope.listSettings = this.settings.getNewOrExistingListSettings("apps", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("raw.TypeName", "Application Type"),
                new ListColumnSetting("raw.TypeVersion", "Version"),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.Status", "Status")
            ]);
            this.$scope.upgradeAppsListSettings = this.settings.getNewOrExistingListSettings("upgrades", ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSettingForLink("parent.raw.TypeName", "Application Type", item => item.parent.appTypeViewPath),
                new ListColumnSetting("parent.raw.TypeVersion", "Current Version"),
                new ListColumnSetting("raw.TargetApplicationTypeVersion", "Target Version"),
                new ListColumnSetting("upgrade", "Progress by Upgrade Domain", null, false, (item) => HtmlUtils.getUpgradeProgressHtml("item.upgradeDomains")),
                new ListColumnSettingWithFilter("raw.UpgradeState", "Upgrade State")
            ]);
            this.$scope.appEvents = this.data.createApplicationEventList(null);

            this.refresh();
        }

        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.data.getApps(true, messageHandler).then(apps => {
                this.$scope.apps = apps;

                if (this.$scope.apps.upgradingAppCount > 0) {
                    this.tabs["upgrades"].superscriptInHtml = () => this.$scope.apps.upgradingAppCount.toString();
                } else {
                    this.tabs["upgrades"].superscriptInHtml = null;
                }
            });
        }

        private refreshUpgradesTab(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            let promises = _.map(_.filter(this.$scope.apps.collection, app => app.isUpgrading), app => app.upgradeProgress.refresh(messageHandler));

            return this.$q.all(promises).then(() => {
                this.$scope.upgradeProgresses = _.map(_.filter(this.$scope.apps.collection, app => app.isUpgrading), app => app.upgradeProgress);
            });
        }

        private setupActions(actions: ActionCollection) {
            actions.add(new ActionCreateComposeApplication(this.data));
        }

        private refreshEvents(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$scope.appEvents.refresh(new EventsStoreResponseMessageHandler(messageHandler));
        }
    }

    export class ActionCreateComposeApplication extends ActionWithDialog {

        public applicationName: string;

        public composeFileContent: string;

        public hasRepositoryCredential: boolean;

        public repositoryUserName: string;

        public repositoryPassword: string;

        public passwordEncrypted: boolean;

        public composeFileName: string;

        public loadComposeFile($event: ng.IAngularEvent): void {
            console.log($event);
        }

        constructor(data: DataService) {

            super(
                data.$uibModal,
                data.$q,
                "createComposeApplication",
                "Create compose application",
                "Creating",
                () => data.restClient.createComposeDeployment(this.createComposeDeploymentDescription()),
                () => true,
                <angular.ui.bootstrap.IModalSettings>{
                    templateUrl: "partials/create-compose-application-dialog.html",
                    controller: ActionController,
                    resolve: {
                        action: () => this
                    }
                },
                null);

            this.reset();
        }

        private reset(): void {
            this.applicationName = "";
            this.composeFileContent = "";
            this.hasRepositoryCredential = false;
            this.repositoryUserName = "";
            this.repositoryPassword = "";
            this.passwordEncrypted = false;
        }

        private createComposeDeploymentDescription(): IRawCreateComposeDeploymentDescription {
            let description: IRawCreateComposeDeploymentDescription = {
                DeploymentName: this.applicationName,
                ComposeFileContent: this.composeFileContent
            };

            if (this.hasRepositoryCredential) {
                description.RepositoryCredential = {
                    RepositoryUserName: this.repositoryUserName,
                    RepositoryPassword: this.repositoryPassword,
                    PasswordEncrypted: this.passwordEncrypted
                };
            }

            return description;
        }
    }

    (function () {

        let module = angular.module("appsViewController", ["ngRoute", "dataService"]);

        module.controller("AppsViewController", ["$injector", "$scope", AppsViewController]);
    })();
}
