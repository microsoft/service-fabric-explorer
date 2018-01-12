//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface ITab {
        name: string;   // display name of the tab
        refresh?: (messageHandler?: IResponseMessageHandler) => angular.IPromise<any>;    // optional refresh method which update the data model required by current tab
        superscriptClass?: string;  // optional superscript custom class to define custom style
        superscriptInHtml?: () => string;   // optional method to return custom html for superscript of the tab
    }

    export interface ITabs {
        // key is the id of the tab, will be used as identifier in the format of "tab_[id]"
        [id: string]: ITab;
    }

    export interface IControllerBase {
        refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any>;
    }

    export class ControllerBase implements IControllerBase {
        public routes: RoutesService;
        public message: MessageService;
        public telemetry: TelemetryService;
        public authSvc: AuthenticationService;
        public settings: SettingsService;
        public data: DataService;
        public storage: StorageService;
        public $location: angular.ILocationService;
        public $q: angular.IQService;
        public $route: ng.route.IRouteService;

        constructor(protected $injector: angular.auto.IInjectorService) {
            this.routes = this.$injector.get<RoutesService>("routes");
            this.message = this.$injector.get<MessageService>("message");
            this.telemetry = this.$injector.get<TelemetryService>("telemetry");
            this.settings = this.$injector.get<SettingsService>("settings");
            this.data = this.$injector.get<DataService>("data");
            this.authSvc = this.$injector.get<AuthenticationService>("auth");
            this.storage = this.$injector.get<StorageService>("storage");
            this.$location = this.$injector.get<angular.ILocationService>("$location");
            this.$q = this.$injector.get<angular.IQService>("$q");
            this.$route = this.$injector.get<ng.route.IRouteService>("$route");

            let controllerManager = this.$injector.get<ControllerManagerService>("controllerManager");
            controllerManager.registerController(this);
        }

        public get routeParams(): any {
            return this.$route.current.params;
        }

        public refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$q.when(true);
        }
    }

    export class ControllerWithResolver extends ControllerBase {
        public valueResolver: ValueResolver = new ValueResolver();

        constructor($injector: angular.auto.IInjectorService) {
            super($injector);
        }
    }

    // Control tabs with deep link support
    export class TabController extends ControllerWithResolver {
        private static LastVisitedTabId: string;
        private static LastVisitedTemplateUrl: any;

        public activeTabId: string;
        public basePath: string;

        private refreshingPromise: angular.IPromise<any>;

        public get hasTabs(): boolean {
            return _.size(this.tabs) > 0;
        }

        private get firstTabId(): string {
            return _.keys(this.tabs)[0];
        }

        constructor($injector: angular.auto.IInjectorService, public tabs: ITabs = {}) {
            super($injector);

            this.setActiveTab();
        }

        public navigateToTab(tabId: string): void {
            // Clear the cache before explicitly navigate to a tab.
            TabController.LastVisitedTabId = null;
            TabController.LastVisitedTemplateUrl = null;

            this.$location.path(this.getTabViewPath(tabId));
        }

        public isActiveTab(tabId: string): boolean {
            return this.activeTabId === tabId;
        }

        // Defines general refresh logic, DO NOT override this method in derived class.
        // Override refreshCommon or define tab specific refresh methods for tabs.
        public refresh(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            if (!this.authSvc.isApplicationBootstrapped) {
                // Do not do any refresh until application is bootstrapped
                return this.$q.reject();
            }

            if (!this.refreshingPromise) {

                // refresh common data model first
                this.refreshingPromise = this.refreshCommon(messageHandler).then(() => {
                    if (this.hasTabs && this.tabs[this.activeTabId] && this.tabs[this.activeTabId].refresh) {
                        // refresh current active tab
                        return this.tabs[this.activeTabId].refresh(messageHandler);
                    }
                }).finally(() => {
                    this.refreshingPromise = null;
                });
            }
            return this.refreshingPromise;
        }

        // Override this method to refresh common data model shared by all tabs.
        // Define tab specifc refresh method to refresh tab specific data models when defining tabs.
        protected refreshCommon(messageHandler?: IResponseMessageHandler): angular.IPromise<any> {
            return this.$q.when(true);
        }

        private setActiveTab(): void {
            this.basePath = this.getBasePath();

            let tabId = this.routeParams.tabId;
            if (tabId) {
                this.activeTabId = tabId;
            } else if (this.hasTabs) {
                if (TabController.LastVisitedTabId
                    && TabController.LastVisitedTabId !== this.firstTabId
                    && this.$route.current.templateUrl === TabController.LastVisitedTemplateUrl
                    && this.tabs[TabController.LastVisitedTabId]) {
                    // If user switch to a different tab, then click on the same type of entity
                    // in the tree view, switch to the same tab user was viewing before.
                    //   e.g. If user is viewing Details pane of Node_1, then switch to Node_2
                    //        by clicking Node_2 in tree view, Details pane will be showed by default.
                    this.navigateToTab(TabController.LastVisitedTabId);
                } else {
                    // Default to first tab
                    this.activeTabId = this.firstTabId;
                }
            }

            // Remember current tab id, if user switch to another page which also has a tab
            // with the same tab id, switch to this tab automatically.
            TabController.LastVisitedTabId = this.activeTabId;
            TabController.LastVisitedTemplateUrl = this.$route.current.templateUrl;

            // track page view
            this.telemetry.trackPageView();
        }

        private getBasePath(): string {
            return _.trimEnd(this.$location.path().replace(/\/tab\/.*/, ""), "/");
        }

        private getTabViewPath(tabId: string): string {
            if (tabId === this.firstTabId) {
                // First tab does not need tab id
                return this.basePath;
            }
            return this.basePath + "/tab/" + tabId;
        }
    }

    export class MainViewController extends TabController {
        private clusterTree: ClusterTreeService;

        constructor($injector: angular.auto.IInjectorService, tabs?: ITabs) {
            super($injector, tabs);

            this.clusterTree = $injector.get<ClusterTreeService>("clusterTree");

            let controllerManager = $injector.get<ControllerManagerService>("controllerManager");
            controllerManager.registerMainController(this);

            this.switchThemeIfDetected();
        }

        protected selectTreeNode(path: string[]): angular.IPromise<any> {
            return this.clusterTree.selectTreeNode(path, true /* skip select action */);
        }

        private switchThemeIfDetected(): void {
            if (this.routeParams.theme_source && this.routeParams.theme_name) {

                // Report external theme source as telemetry data point
                this.telemetry.trackEvent("Theme external source: " + this.routeParams.theme_source + "/" + this.routeParams.theme_name);

                // The "theme_source" and "theme_name" are only effective when user
                // has never explicitly set a theme before. And this theme settings
                // only last for this session.
                if (!this.storage.isDefined(Constants.ThemeNameStorageKey)) {
                    let themeService = this.$injector.get<ThemeService>("theme");
                    themeService.resolveAndChangeToTheme(this.routeParams.theme_source, this.routeParams.theme_name);
                }

                // Clear theme query strings
                this.$location.search(Constants.ThemeSourceQueryStringName, null);
                this.$location.search(Constants.ThemeNameQueryStringName, null);
            }
        }
    }
}
