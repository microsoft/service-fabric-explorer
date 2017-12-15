//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export class ApplicationType extends DataModelBase<IRawApplicationType> {
        public serviceTypes: ServiceTypeCollection;

        public constructor(data: DataService, raw?: IRawApplicationType) {
            super(data, raw);
            this.serviceTypes = new ServiceTypeCollection(this.data, this);

            if (this.data.actionsEnabled()) {
                this.setUpActions();
            }
        }

        public get id(): string {
            return this.raw.Name + " " + this.raw.Version;
        }

        public get viewPath(): string {
            return this.data.routes.getAppTypeViewPath(this.name);
        }

        public unprovision(): angular.IPromise<any> {
            return this.data.restClient.unprovisionApplicationType(this.name, this.raw.Version);
        }

        public createInstance(newInstanceUri: string): angular.IPromise<any> {
            return this.data.restClient.provisionApplication(newInstanceUri, this.raw.Name, this.raw.Version);
        }

        private setUpActions() {
            this.actions.add(new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "unprovisionAppType",
                "Unprovision",
                "Unprovisioning",
                () => this.unprovision(),
                () => true,
                "Confirm Type Unprovision",
                `Unprovision application type ${this.name}@${this.raw.Version} from cluster ${this.data.$location.host()}?`,
                `${this.name}@${this.raw.Version}`
            ));
            this.actions.add(new ActionCreateAppInstance(
                this.data.$uibModal,
                this.data.$q,
                this));
        }
    }

    // ApplicationTypes are organized in group indexed by type name.
    // In each group, there are different versions of the application types.
    export class ApplicationTypeGroup extends DataModelBase<IRawApplicationType> {
        public apps: Application[] = [];
        public appTypes: ApplicationType[] = [];
        public appsHealthState: ITextAndBadge;

        public constructor(data: DataService, appTypes: ApplicationType[]) {
            super(data, appTypes[0].raw);
            this.appTypes = appTypes;

            if (this.data.actionsEnabled()) {
                this.setUpActions();
            }
        }

        public get viewPath(): string {
            return this.data.routes.getAppTypeViewPath(this.name);
        }

        // Whenever the data.apps get refreshed, it will call this method to
        // update all applications for all application type group to keep the
        // applications in sync.
        public refreshAppTypeApps(apps: ApplicationCollection): void {
            this.apps = _.filter(apps.collection, app => app.raw.TypeName === this.name);

            if (this.apps.length > 0) {
                this.appsHealthState = this.valueResolver.resolveHealthStatus(_.max(_.map(this.apps, app => HealthStateConstants.Values[app.healthState.text])));
            } else {
                // When there are no apps in this apptype, treat it as healthy
                this.appsHealthState = ValueResolver.healthStatuses[1];
            }
        }

        protected retrieveNewData(messageHandler?: IResponseMessageHandler): angular.IPromise<IRawApplicationType> {
            return this.data.restClient.getApplicationTypes(this.name, messageHandler).then(response => {
                CollectionUtils.updateDataModelCollection(this.appTypes, _.map(response.data, rawAppType => new ApplicationType(this.data, rawAppType)));
                return _.first(response.data);
            });
        }

        private setUpActions() {
            this.actions.add(new ActionWithConfirmationDialog(
                this.data.$uibModal,
                this.data.$q,
                "unprovisionType",
                "Unprovision Type",
                "Unprovisioning",
                () => this.unprovision(),
                () => true,
                "Confirm Type Unprovision",
                `Unprovision all versions of application type ${this.name} from cluster ${this.data.$location.host()}?`,
                this.name
            ));
        }

        private unprovision(): angular.IPromise<any> {
            return this.data.getAppTypeGroup(this.name, true).then(appTypeGroup => {
                let unprovisonPromises = [];
                _.each(appTypeGroup.appTypes, applicationType => {
                    unprovisonPromises.push(applicationType.unprovision());
                });
                return this.data.$q.all(unprovisonPromises);
            });
        }
    }

    export class ActionCreateAppInstance extends ActionWithDialog {
        public get typeName(): string {
            return this.appType.raw.Name;
        }

        public get typeVersion(): string {
            return this.appType.raw.Version;
        }

        public newInstanceUri: string;

        constructor($uibModal: ng.ui.bootstrap.IModalService, $q: ng.IQService, private appType: ApplicationType) {
            super(
                $uibModal,
                $q,
                "createAppInstance",
                "Create app instance",
                "Creating",
                () => appType.createInstance(this.newInstanceUri),
                () => true,
                <angular.ui.bootstrap.IModalSettings>{
                    templateUrl: "partials/create-application-dialog.html",
                    controller: ActionController,
                    resolve: {
                        action: () => this
                    }
                },
                () => {
                    this.newInstanceUri = Constants.FabricPrefix + appType.name;
                    return $q.when(true);
                });
        }
    }
}
