//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    describe("Data Service", () => {
        var $httpBackend: angular.IHttpBackendService;
        var dataSvc: DataService;

        // Load modules for testing
        beforeEach(angular.mock.module("templates"));
        beforeEach(angular.mock.module("telemetryService"));
        beforeEach(angular.mock.module("dataService"));
        beforeEach(inject(function ($injector, data) {
            $httpBackend = $injector.get("$httpBackend");
            HttpBackendHelper.mockedHttpBackend($httpBackend);
            dataSvc = data;
        }));

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });


        it("Get cluster health", () => {
            let clusterHealth = dataSvc.getClusterHealth();
            clusterHealth.ensureInitialized();

            expect($httpBackend.flush).not.toThrow();
            expect(clusterHealth).toBeDefined();
            expect(clusterHealth.raw.AggregatedHealthState).toEqual("Ok");
        });


        it("Second call to the same data model object should return cached data", () => {
            let clusterHealth = dataSvc.getClusterHealth();
            clusterHealth.ensureInitialized();
            $httpBackend.flush();

            clusterHealth.ensureInitialized();
            expect($httpBackend.flush).toThrow();
        });


        it("Force refresh should refresh the data", () => {
            let clusterHealth: ClusterHealth = dataSvc.getClusterHealth();
            clusterHealth.ensureInitialized();

            $httpBackend.flush();

            // Temporary change the response
            HttpBackendHelper.getClusterHealth.respond(function () {
                return [200, {
                    AggregatedHealthState: "Warning"
                }];
            });

            // Force refresh the data
            clusterHealth.ensureInitialized(true).then(result => {
                clusterHealth = result;
            });
            // Verify the REST API was called
            expect($httpBackend.flush).not.toThrow();
            // Verify new data is returned
            expect(clusterHealth.raw.AggregatedHealthState).toEqual("Warning");

            // Verify calling refresh directly calls the REST API and return the same value
            clusterHealth.refresh();
            expect($httpBackend.flush).not.toThrow();
            expect(clusterHealth.raw.AggregatedHealthState).toEqual("Warning");
        });


        it("Get applications", () => {
            let apps: ApplicationCollection;

            dataSvc.getApps(true).then(result => {
                apps = result;
            });

            expect($httpBackend.flush).not.toThrow();
            expect(apps.length).toEqual(6);
        });


        it("Get applications should refresh applications in each application type group", () => {
            let apps: ApplicationCollection;
            let appTypeGroup: ApplicationTypeGroup;

            dataSvc.getAppTypeGroup("Application1Type").then(result => {
                appTypeGroup = result;
            });
            dataSvc.getApps(true).then(result => {
                apps = result;
            });
            $httpBackend.flush();

            // getApps should retrieve apps and assign apps to its proper app type group
            expect(appTypeGroup.apps.length).toEqual(1);
            expect(appTypeGroup.apps[0].id).toEqual("Application1");

            HttpBackendHelper.getApplications.respond(function () {
                return [200, {
                    Items: [{
                        "Id": "Application2",
                        "Name": "fabric:/Application2",
                        "TypeName": "Application1Type",
                        "TypeVersion": "2.6.0"
                    }]
                }];
            });
            dataSvc.getApps(true);
            $httpBackend.flush();

            // verify getApps should refresh apps collection inside app type group
            expect(appTypeGroup.apps[0].id).toEqual("Application2");
        });


        it("Get applications should retrieve all pages if continuation token exists", () => {
            let apps: ApplicationCollection;

            HttpBackendHelper.turnOnGetApplicationsContinuationToken();

            dataSvc.getApps(true).then(result => {
                apps = result;
            });

            $httpBackend.flush();

            HttpBackendHelper.turnOffGetApplicationsContinuationToken();

            expect(apps.length).toEqual(13);

            for (let i = 1; i <= apps.collection.length; i++) {
                expect(apps.collection[i - 1].id).toBe("Application" + i);
            }
        });

    });
}


