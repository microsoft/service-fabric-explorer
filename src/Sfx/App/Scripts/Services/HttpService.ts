//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export class HttpClient {
        private httpClient: any;

        constructor(private $q: angular.IQService, private $http: angular.IHttpService) {
            if (StandaloneIntegration.isStandalone()) {
                this.httpClient = StandaloneIntegration.getHttpClient();
                this.httpClient.then((client) => client.setRequestTemplateAsync({
                    headers: [
                        {
                            name: Constants.SfxVersionMetadataName,
                            value: VersionInfo.Version
                        },
                        {
                            name: Constants.SfxBuildMetadataName,
                            value: VersionInfo.Build
                        }
                    ]
                }));
            }

            this.$http.defaults.headers.common[Constants.SfxVersionMetadataName] = VersionInfo.Version;
            this.$http.defaults.headers.common[Constants.SfxBuildMetadataName] = VersionInfo.Build;
        }

        public getAsync<T>(url: string): angular.IPromise<T> {
            return this.httpClient ? this.requestAsync({ method: "GET", url: url }) : this.$http.get(url);
        }

        public postAsync<T>(url: string, data: any): angular.IPromise<T> {
            return this.httpClient ? this.requestAsync({ method: "POST", url: url, body: data }) : this.$http.post(url, data);
        }

        public putAsync<T>(url: string, data: any): angular.IPromise<T> {
            return this.httpClient ? this.requestAsync({ method: "PUT", url: url, body: data }) : this.$http.put(url, data);
        }

        public patchAsync<T>(url: string, data: any): angular.IPromise<T> {
            return this.httpClient ? this.requestAsync({ method: "PATCH", url: url, body: data }) : this.$http.patch(url, data);
        }

        public deleteAsync<T>(url: string): angular.IPromise<T> {
            return this.httpClient ? this.requestAsync({ method: "DELETE", url: url }) : this.$http.delete(url);
        }

        public requestAsync<T>(request: { method: string, url: string, body?: any }): angular.IHttpPromise<T> {
            return this.httpClient
                .then((client) => client.requestAsync(request));
        }
    }

    (function () {
        const module = angular.module("httpService", []);

        module.factory("httpClient", ["$q", "$http", ($q, $http) => new HttpClient($q, $http)]);
    })();
}
