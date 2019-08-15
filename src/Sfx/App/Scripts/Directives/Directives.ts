//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    (function () {
        let module = angular.module("directives", ["templates", "ngAnimate", "ngSanitize", "ui.bootstrap", "dataService"]);

        module.controller("RefreshSliderController", ["storage", "$rootScope", RefreshSliderController]);
        module.controller("SplitterController", ["storage", SplitterController]);
        module.controller("DetailListController", ["$filter", "$scope", DetailListController]);
        module.controller("StatusWarningsController", ["$scope", "data", StatusWarningController]);

        module.directive("sfxSplitter", () => new SplitterDirective());
        module.directive("sfxSlider", () => new SliderDirective());
        module.directive("sfxDetailViewPart", () => new DetailViewPartDirective());
        module.directive("sfxDetailList", () => new DetailListDirective());
        module.directive("sfxDetailListDetailsView", () => new DetailListDetailsViewDirective());
        module.directive("sfxMetricsBarChart", MetricsBarChartDirective.factory());
        module.directive("sfxDashboard", DashboardChartDirective.factory());
        module.directive("sfxImageStoreView", () => new ImageStoreViewDirective());
        module.directive("sfxImageStoreFileView", () => new ImageStoreOptionsViewDirective());
        module.directive("sfxStatusWarnings", () => new StatusWarningsDirective());

        module.directive("sfxThemeImport", ["theme", (themeService: ThemeService): angular.IDirective => {
            return {
                restrict: "A",
                link: function (scope: any, element, attributes: any) {
                    // Set initial theme name
                    $(element).attr("href", "css/" + themeService.getActiveThemeName() + ".min.css");

                    // Listen to theme name event and switch theme
                    themeService.subscribe((key, oldValue, newValue) => {
                        if (key === Constants.ThemeNameMonitorPropertyName) {
                            $(element).attr("href", "css/" + themeService.getActiveThemeName() + ".min.css");
                        }
                    });
                }
            };
        }]);

        // ng-include creates isolated scopes which can create uncessary troubles sometimes.
        // This custom include directive does not create isolated scopes.
        module.directive("sfxInclude", ["$http", "$templateCache", "$compile", function ($http, $templateCache, $compile) {
            return function (scope, element, attrs: any) {
                scope.$watch(attrs.src, function (templatePath) {
                    $http.get(templatePath, { cache: $templateCache }).success(function (response) {
                        let contents = element.html(response).contents();
                        $compile(contents)(scope);
                    });
                });
            };
        }]);

        // ng-bind-html does not work when there are directives in the html.
        // this directive will compile the html to make directive work again.
        module.directive("sfxBindHtmlCompile", ["$compile", function ($compile) {
            return {
                restrict: "A",
                link: function (scope, element, attrs: any) {
                    scope.$watch(function () {
                        return scope.$eval(attrs.sfxBindHtmlCompile);
                    }, function (value) {
                        element.html(value && value.toString());
                        let compileScope = scope;
                        if (attrs.bindHtmlScope) {
                            compileScope = scope.$eval(attrs.bindHtmlScope);
                        }
                        $compile(element.contents())(compileScope);
                    });
                }
            };
        }]);

        module.directive("sfxTreeScrollTo", (): angular.IDirective => {
            return {
                restrict: "A",
                link: function ($scope: any, $element: any, $attributes: any) {
                    $attributes.$observe("selected", function (selected) {
                        if (selected !== "true") {
                            return;
                        }

                        // Monitor the element until it is visible then scroll it into current view
                        let visibilityWatcher = $scope.$watch(function () {
                            return $($element).is(":visible");
                        }, function (isVisible: boolean) {
                            if (!isVisible) {
                                return;
                            }

                            let scrollParent = $("." + $attributes.scrollParent);
                            let nodePosition = $($element).offset().top - scrollParent.offset().top;
                            let treeScrollTop = scrollParent.scrollTop();
                            let treePanelHeight = scrollParent.innerHeight();

                            if ((nodePosition - 5) < 0) {
                                scrollParent.scrollTop(treeScrollTop + nodePosition - 5);
                            } else if (nodePosition + 30 > treePanelHeight) {
                                scrollParent.scrollTop(treeScrollTop + nodePosition - treePanelHeight + 30);
                            }

                            // Cancel the watch after scroll
                            visibilityWatcher();
                        });

                    });
                }
            };
        });

        // When navigating in the tree view through arrow keys, make sure the selected node also gets
        // the focus since it could have been set on some other elements by using the tab key.
        module.directive("sfxTreeSetFocus", ["$timeout", "clusterTree", function ($timeout, clusterTree: ClusterTreeService) {
            return {
                restrict: "A",
                link: function ($scope: any, $element: any, $attributes: any) {
                    $attributes.$observe("selected", function (selected) {
                        if (clusterTree.setFirstVisit()) {
                            return;
                        }

                        if (selected !== "true") {
                            return;
                        }

                        $timeout(function () {
                            $(".self:first", $element).focus();
                        });
                    });
                }
            };
        }]);

        module.directive("sfxTabSetFocus", ["$timeout", "controllerManager", function ($timeout, controllerManager: ControllerManagerService) {
            return {
                restrict: "A",
                link: function ($scope: any, $element: any, $attributes: any) {
                    $attributes.$observe("active", function (active) {
                        if (controllerManager.firstPageLoad) {
                            controllerManager.firstPageLoad = false;
                            return;
                        }
                        if (active !== "true") {
                            return;
                        }

                        $timeout(function () {
                            if ($(":focus").length === 0) {
                                $($element).focus();
                            }
                        }, 100);
                    });
                }
            };
        }]);

        module.directive("sfxTreeNode", (): angular.IDirective => {
            return {
                restrict: "A",
                replace: true,
                templateUrl: "partials/tree-node.html",
                scope: {
                    node: "="
                }
            };
        });

        module.directive("sfxReplicaAddress", (): angular.IDirective => {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "partials/replica-address.html",
                scope: {
                    address: "="
                },
                link: function ($scope: any, $element: any, $attributes: any) {
                    $scope.$watch("address", function () {
                        $scope.isString = _.isString($scope.address);
                    });
                }
            };
        });

        module.directive("sfxBadge", (): angular.IDirective => {
            return {
                restrict: "E",
                replace: true,
                templateUrl: "partials/badge.html",
                scope: {
                    badgeClass: "=",
                    text: "="
                }
            };
        });

        module.directive("sfxDetailViewNavbar", (): angular.IDirective => {
            return {
                restrict: "E",
                replace: true,
                scope: {
                    mainViewCtrl: "=ctrl",
                    actions: "=",
                    type: "@",
                    name: "@"
                },
                transclude: true,
                templateUrl: "partials/detail-view-navbar.html"
            };
        });

        module.directive("sfxCandybarCompact", (): angular.IDirective => {
            return {
                restrict: "E",
                replace: true,
                scope: {
                    viewPath: "@",
                    item: "="
                },
                templateUrl: "partials/candybar-compact.html"
            };
        });

        module.directive("sfxSearchBar", (): angular.IDirective => {
            return {
                restrict: "E",
                replace: true,
                scope: {
                    placeholder: "@",
                    reset: "&?",
                    model: "=",
                    customClass: "@"
                },
                templateUrl: "partials/search-bar.html",
                link: function ($scope: any, $element, $attributes: any) {
                    $scope.$watch("model", function (newValue, oldValue) {
                        // When search box is cleared, set focus back to the input
                        if (oldValue && !newValue) {
                            $($element).find("input").focus();
                        }
                    });
                }
            };
        });

        module.directive("sfxPager", (): angular.IDirective => {
            return {
                restrict: "AE",
                scope: {
                    list: "=",
                    listSettings: "="
                },
                templateUrl: "partials/pager.html",
                link: function ($scope: any, $element, $attributes: any) {
                    $scope.$watchGroup(["list", "list.length"], function (newValue, oldValue) {
                        if ($scope.list) {
                            $scope.listSettings.count = $scope.list.length;
                        }
                    });
                }
            };
        });

        module.directive(_.camelCase(Constants.DirectiveNameUpgradeProgress), (): angular.IDirective => {
            return {
                restrict: "E",
                scope: {
                    upgradeDomains: "="
                },
                templateUrl: "partials/upgrade-progress.html"
            };
        });

        module.directive("sfxUpgradeDomainProgress", (): angular.IDirective => {
            return {
                restrict: "E",
                scope: {
                    nodeUpgradeProgressList: "="
                },
                templateUrl: "partials/upgrade-domain-progress.html"
            };
        });

        module.directive(_.camelCase(Constants.DirectiveNameActionsRow), (): angular.IDirective => {
            return {
                restrict: "E",
                replace: true,
                scope: {
                    actions: "=",
                    source: "@"
                },
                templateUrl: "partials/actions-row.html"
            };
        });

        module.directive("sfxMetricsView", (): angular.IDirective => {
            return {
                restrict: "AE",
                replace: true,
                scope: {
                    metrics: "=",
                    listSettings: "="
                },
                templateUrl: "partials/metrics-view.html"
            };
        });

        module.directive("sfxEventsView", () => new EventsViewDirective());

        module.directive("sfxTextFileInput", () => new TextFileInputDirective());

        module.directive("sfxDatePicker", () => new DatePickerDirective());

        module.directive("sfxListShorten", (): angular.IDirective => {
            return {
                restrict: "E",
                replace: true,
                scope: {
                    list: "="
                },
                templateUrl: "partials/long-list-shorten.html",
                link: function ($scope: any, $element, $attributes: any) {
                    $scope.opened = false;
                    $scope.flip = (): void => {
                        $scope.opened  = !$scope.opened;
                    };
                }
            };
        });

        module.directive("sfxClipBoard", (): angular.IDirective => {
            return {
                restrict: "E",
                replace: true,
                scope: {
                    text: "=",
                    nestedText: "=",
                    nestedTextProperty: "="
                },
                templateUrl: "partials/copy-to-clipboard.html",
                link: function ($scope: any, $element, $attributes: any) {
                    $scope.copy = (): void => {
                        try {
                            let $temp_input = $("<textarea>");
                            $("body").append($temp_input);
                            $temp_input.val($scope.nestedTextProperty ? $scope.nestedText[$scope.nestedTextProperty] : $scope.text).select();
                            document.execCommand("copy");
                            $temp_input.remove();
                        } catch (e) {
                            console.log(e);
                        }

                    };
                }
            };
        });

    })();
}
