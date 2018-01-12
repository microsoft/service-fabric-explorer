//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    // Mock the REST api calls here
    export class HttpBackendHelper {

        // Url matchers
        public static getClusterHealthUrl = /^\/\$\/GetClusterHealth\?.*/;
        public static getApplicationsUrl = /^\/Applications\/\?.*/;
        public static getApplicationsWithContinuationTokenUrl = /^\/Applications\/\?.*ContinuationToken=.*/;
        public static getApplicationTypesUrl = /^\/ApplicationTypes\/\?.*/;
        public static getSystemAppHealthUrl = /^\/Applications\/System\/\$\/GetHealth\?.*/;

        // The mocked request handlers, which can be used to change the response temporarily in tests
        public static getClusterHealth: ng.mock.IRequestHandler;
        public static getApplications: ng.mock.IRequestHandler;
        public static getApplicationTypes: ng.mock.IRequestHandler;

        private static getAppsResponse = {
            ContinuationToken: "",
            Items: [{
                "Id": "Application1",
                "Name": "fabric:/Application1",
                "TypeName": "Application1Type",
                "TypeVersion": "2.6.0",
                "Status": "Ready",
                "HealthState": "Ok"
            }, {
                "Id": "Application2",
                "Name": "fabric:/Application2",
                "TypeName": "Application2Type",
                "TypeVersion": "2.2.0",
                "Status": "Ready",
                "HealthState": "Ok"
            }, {
                "Id": "Application3",
                "Name": "fabric:/Application3",
                "TypeName": "Application3Type",
                "TypeVersion": "1.0.0",
                "Status": "Ready",
                "HealthState": "Ok"
            }, {
                "Id": "Application4",
                "Name": "fabric:/Application4",
                "TypeName": "Application4Type",
                "TypeVersion": "1.0.0",
                "Status": "Ready",
                "HealthState": "Ok"
            }, {
                "Id": "Application5",
                "Name": "fabric:/Application5",
                "TypeName": "Application5Type",
                "TypeVersion": "1.1.0",
                "Status": "Ready",
                "HealthState": "Ok"
            }, {
                "Id": "Application6",
                "Name": "fabric:/Application6",
                "TypeName": "Application6Type",
                "TypeVersion": "1.0.0",
                "Status": "Ready",
                "HealthState": "Ok"
            }]
        };

        private static continuationTokensToResponses = {
            "100": {
                Items: [{
                    "Id": "Application7",
                    "Name": "fabric:/Application7"
                }],
                ContinuationToken: "200"
            },

            "200": {
                Items: [{
                    "Id": "Application8",
                    "Name": "fabric:/Application8"
                }, {
                        "Id": "Application9",
                    "Name": "fabric:/Application9"
                }],
                ContinuationToken: "300"
            },

            "300": {
                Items: [{
                    "Id": "Application10",
                    "Name": "fabric:/Application10"
                }],
                ContinuationToken: "400"
            },

            "400": {
                Items: [{
                    "Id": "Application11",
                    "Name": "fabric:/Application11"
                }, {
                    "Id": "Application12",
                    "Name": "fabric:/Application12"
                }],
                ContinuationToken: "500"
            },

            "500": {
                Items: [{
                    "Id": "Application13",
                    "Name": "fabric:/Application13"
                }]
            }
        };

        public static turnOnGetApplicationsContinuationToken() {
            this.getAppsResponse.ContinuationToken = "100";
        }

        public static turnOffGetApplicationsContinuationToken() {
            this.getAppsResponse.ContinuationToken = "";
        }

        public static mockedHttpBackend($httpBackend: angular.IHttpBackendService): void {
            // Get Cluster Health
            this.getClusterHealth = $httpBackend.whenGET(HttpBackendHelper.getClusterHealthUrl).respond(function () {
                return [200,
                    {
                        "AggregatedHealthState": "Ok"
                    }
                ];
            });

            // Get applications with ContinuationToken
            $httpBackend.whenGET(HttpBackendHelper.getApplicationsWithContinuationTokenUrl).respond(function (method, url, data, headers, params) {
                return [200, HttpBackendHelper.continuationTokensToResponses[params.ContinuationToken]];
            });

            // Get applications
            // If you are editing the items below, be sure to update tests as well.
            this.getApplications = $httpBackend.whenGET(HttpBackendHelper.getApplicationsUrl).respond(function () {
                return [200, HttpBackendHelper.getAppsResponse];
            });

            // Get application types
            this.getApplicationTypes = $httpBackend.whenGET(HttpBackendHelper.getApplicationTypesUrl).respond(function () {
                return [200, [
                        {
                            "Name": "Application1Type",
                            "Version": "2.6.0"
                        },
                        {
                            "Name": "Application2Type",
                            "Version": "2.2.0"
                        }
                    ]
                ];
            });

            // Get system app health
            $httpBackend.whenGET(HttpBackendHelper.getSystemAppHealthUrl).respond(function () {
                return [200, {
                    "AggregatedHealthState": "Ok",
                    "Name": "fabric:/System"
                }];
            });
        }
    }
}


