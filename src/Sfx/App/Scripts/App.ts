//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    (function () {

        angular.module("sfx", [
            "authenticationBootstrap",
            "routes",
            "messages",
            "filters",
            "directives",
            "authenticationService",
            "settingsService",
            "storageService",
            "clusterTreeService",
            "refreshService",
            "telemetryService",
            "themeService",
            "StatusWarningService",
            "dataService",
            "controllerManagerService",
            "authenticationController",
            "treeViewController",
            "navbarController",
            "clusterViewController",
            "nodeViewController",
            "nodesViewController",
            "networksViewController",
            "networkViewController",
            "appTypeViewController",
            "appsViewController",
            "appViewController",
            "actionController",
            "serviceViewController",
            "partitionViewController",
            "replicaViewController",
            "deployedAppViewController",
            "deployedServiceViewController",
            "deployedCodePackageViewController",
            "deployedReplicaViewController",
            "deployedServiceCodePackagesViewController",
            "deployedServiceReplicasViewController",
            "systemAppsViewController",
            "themeController",
            "settingsController",
            "headerAlertController",
            "templates", // Template cache module generated from partials by gulp-angular-templatecache plugin
            "responseHeadersService",
            "ngAria"
        ]).config(["$rootScopeProvider", function ($rootScopeProvider) {
            $rootScopeProvider.digestTtl(20);
        }]);
    })();
}

