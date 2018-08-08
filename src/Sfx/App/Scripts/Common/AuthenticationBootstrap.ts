//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    (function () {

        // When AAD login failed with error, it will post back by setting error and error_description parameters as segments. e.g.
        //   https://[cluster]:19080/Explorer/Index.html#error=access_denied&error_description=Foo
        // When this happens, we do not want to bootstrap angular at all because that will trigger another login redirect and user
        // will never see these errors.
        let match = /[&?#](error=.*)/i.exec(window.location.href);
        if (match && match[1]) {
            console.log("Error post back url: " + window.location.href);
            // Use top level window to redirect because this error postpack could happen in an iframe created by ADAL
            window.top.location.href = "/Explorer/error.html?" + match[1];
            return;
        }

        // Query cluster for ADAL before everything else.
        // Since we need to do this before any other services or providers are loaded, manually initalize and find Angular's $http service.
        let initInjector: any = angular.injector(["ng"]);
        let $http: angular.IHttpService = initInjector.get("$http");

        $http.get(StandaloneIntegration.clusterUrl + AuthenticationBootstrapConstants.GetAadMetadataUriPart)
            .success((data: IRawAadMetadata) => {

                let authBootstrap = angular.module("authenticationBootstrap", ["AdalAngular"]);

                authBootstrap.constant("authenticationData", new AadMetadata(data));

                // Provide the config for the Authentication Bootstrap module, to ensure initialization of the $httpProvider.
                authBootstrap.config(["$httpProvider", "adalAuthenticationServiceProvider", "authenticationData",
                    function ($httpProvider: ng.IHttpProvider, adalAuthenticationServiceProvider: any, authenticationData: AadMetadata) {

                        // We check for the empty string upon tenant here due to a potential bug in the cluster.  We expect that an empty object is returned if there is no authentication, but that is not currently the case.
                        if (authenticationData.metadata && authenticationData.isAadAuthType && authenticationData.metadata.tenant !== "") {
                            let adalData = authenticationData.metadata;

                            let aadConfigOptions: any = {
                                clientId: adalData.cluster, // NOTE: The AAD Metadata has both a client and a cluster.  We use cluster here, as the metadata for 'client' is intended for client applications, NOT the web client.
                                tenant: adalData.tenant,
                                cacheLocation: AuthenticationBootstrapConstants.AdalCacheType
                            };

                            if (StandaloneIntegration.clusterUrl !== "") {
                                aadConfigOptions.redirectUri = StandaloneIntegration.clusterUrl + "/Explorer/index.html";
                                aadConfigOptions.postLogoutRedirectUri = StandaloneIntegration.clusterUrl + "/Explorer/index.html";
                            }

                            if (adalData.login) {
                                // Set AAD instance URL (only available in service fabric 5.3 CU1 or later)
                                // The AAD login instance URL must ends with "/"
                                aadConfigOptions.instance = StringUtils.EnsureEndsWith(adalData.login, "/");
                            } else if (adalData.authority) {
                                // If login is not set, fall back to parse authority property value.
                                // Authority is usually in the format of https://{{Azure AD instance URL}}/{{Tenant ID}}/
                                // Assume the the host part is always the AAD instance URL.
                                let parser = document.createElement("a");
                                parser.href = adalData.authority;
                                aadConfigOptions.instance = parser.protocol + "//" + parser.host + "/";
                            }

                            // If the cluster has AADMetadata, hook into the $httpProvider.
                            adalAuthenticationServiceProvider.init(
                                aadConfigOptions,
                                $httpProvider  // The $httpProvider is what lets us intercept the requests.
                            );
                        }
                    }]);

            }).error(() => {

                let authBootstrap = angular.module("authenticationBootstrap", ["AdalAngular"]);
                authBootstrap.constant("authenticationData", new AadMetadata(null));

            }).finally(() => {

                // Wait for document to finish loading before starting the bootstrap process.
                angular.element(document).ready(() => {
                    angular.bootstrap(document, [Constants.sfxAppName], { strictDi: true });
                });
            });
    })();
}
