//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    describe("DetailListDirective", () => {
        var $compile: angular.ICompileService;
        var $rootScope: any;
        var data: DataService;
        var $httpBackend: angular.IHttpBackendService;

        // Load module for testing
        beforeEach(angular.mock.module("templates"));
        beforeEach(angular.mock.module("telemetryService"));
        beforeEach(angular.mock.module("dataService"));
        beforeEach(angular.mock.module("directives"));

        beforeEach(inject(function ($injector, _$compile_, _$rootScope_, _data_) {
            // The injector unwraps the underscores (_) from around the parameter names when matching
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            data = _data_;

            $httpBackend = $injector.get("$httpBackend");
            HttpBackendHelper.mockedHttpBackend($httpBackend);
        }));


        it("Ensures table and pager rendering/linking properly", function () {
            var applications;
            data.getApps().then(apps => {
                applications = apps;
            });
            $httpBackend.flush();

            $rootScope.list = applications;
            $rootScope.listSettings = new ListSettings(1, ["name"], [
                new ListColumnSettingForLink("name", "Name", item => item.viewPath),
                new ListColumnSetting("raw.TypeName", "Application Type"),
                new ListColumnSetting("raw.TypeVersion", "Version"),
                new ListColumnSettingForBadge("healthState", "Health State"),
                new ListColumnSettingWithFilter("raw.Status", "Status")
            ]);

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-list list='list' list-settings='listSettings'></sfx-detail-list>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            var sortedFilteredList = element.isolateScope()["sortedFilteredList"];

            // Check that the compiled element contains the templated content
            expect(element[0].querySelectorAll(".sort-filter-th").length).toBe(5);
            expect(element[0].querySelectorAll(".detail-list tbody tr").length).toBe(1);
            expect(element[0].querySelectorAll(".detail-list tbody tr td")[0].textContent).toContain(sortedFilteredList[0].name);
            expect(element[0].querySelectorAll(".pagination-page").length).toBe(Math.min(5, applications.length));
            expect($rootScope.listSettings.pageCount).toBe(applications.length);

            // Change page limit
            $rootScope.listSettings.limit = 2;
            $rootScope.$digest();
            expect(element[0].querySelectorAll(".detail-list tbody tr").length).toBe(2);
            expect($rootScope.listSettings.pageCount).toBe(Math.ceil(applications.length / 2));

            // Change current page
            $rootScope.listSettings.currentPage = 2;
            $rootScope.$digest();
            expect(element[0].querySelectorAll(".detail-list tbody tr td")[0].textContent).toContain(sortedFilteredList[2].name);

            // Ensure pager is hidden when there is only one page
            $rootScope.listSettings.limit = applications.length;
            $rootScope.$digest();
            expect(element[0].querySelectorAll(".detail-list-pager").length).toBe(0);
        });

    });
}


