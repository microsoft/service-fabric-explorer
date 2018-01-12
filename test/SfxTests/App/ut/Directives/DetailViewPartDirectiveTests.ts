//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    describe("DetailViewPartDirective", () => {
        var $compile: angular.ICompileService;
        var $rootScope;

        // Load module for testing
        beforeEach(angular.mock.module("directives"));

        // Store references to $rootScope and $compile
        // so they are available to all tests in this describe block
        beforeEach(inject(function (_$compile_, _$rootScope_) {
            // The injector unwraps the underscores (_) from around the parameter names when matching
            $compile = _$compile_;
            $rootScope = _$rootScope_;
        }));


        it("Should render simple properties in simple rows", function () {
            $rootScope.obj = {
                "Sfx Test Property A": "Foo",
                "SfxTestPropertyB": "Bar",
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            // Sfx Test Property A        Foo
            // Sfx Test Property B        Bar
            expect(element[0].querySelectorAll("th")[0].textContent).toContain("Sfx Test Property A");
            expect(element[0].querySelectorAll("th")[1].textContent).toContain("Sfx Test Property B");
            expect(element[0].querySelectorAll("td")[0].textContent).toContain("Foo");
            expect(element[0].querySelectorAll("td")[1].textContent).toContain("Bar");
        });


        it("Should render array property in nested table", function () {
            $rootScope.obj = {
                "Sfx Test Array Foo": [{
                    "PropA": "FooA",
                    "Prop B": "FooB"
                }, {
                        "PropA": "BarA",
                        "Prop B": "BarB"
                    }]
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            // Sfx Test Array Foo
            // Prop A        Prop B
            // FooA          FooB
            // BarA          BarB
            expect(element[0].querySelectorAll("table").length).toBe(2);
            expect(element[0].querySelectorAll("table")[0].querySelector("tr th").textContent).toContain("Sfx Test Array Foo");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[0].querySelectorAll("th")[0].textContent).toContain("Prop A");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[0].querySelectorAll("th")[1].textContent).toContain("Prop B");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[1].querySelectorAll("td")[0].textContent).toContain("FooA");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[1].querySelectorAll("td")[1].textContent).toContain("FooB");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[2].querySelectorAll("td")[0].textContent).toContain("BarA");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[2].querySelectorAll("td")[1].textContent).toContain("BarB");
        });


        it("Should render nested array in array", function () {
            $rootScope.obj = {
                "Array Foo": [
                    {
                        "PropA": "FooA",
                        "Prop B": [
                            {
                                "PropC": "FooC",
                                "PropD": "FooD"
                            }, {
                                "PropC": "FooE",
                                "PropD": "FooF"
                            }
                        ],
                        "Prop C": [1, 2]
                    }, {
                        "PropA": "BarA",
                        "Prop B": [
                            {
                                "PropC": "BarC",
                                "PropD": "BarD"
                            }, {
                                "PropC": "BarE",
                                "PropD": "BarF"
                            }
                        ],
                        "Prop C": ["Foo", "Bar"]
                    }
                ]
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            // Array Foo
            // Prop A        Prop B                 Prop C
            // FooA          Prop C       Prop D    [1, 2]
            //               FooC         FooD
            //               FooE         FooF
            // BarA          Prop C       Prop D    [Foo, Bar]
            //               BarC         BarD
            //               BarE         BarF
            expect(element[0].querySelectorAll("table").length).toBe(4);
            expect(element[0].querySelectorAll("table")[1].innerHTML).toContain("[1, 2]");
            expect(element[0].querySelectorAll("table")[1].innerHTML).toContain("[Foo, Bar]");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[0].querySelectorAll("th")[0].textContent).toContain("Prop C");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[0].querySelectorAll("th")[1].textContent).toContain("Prop D");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[1].querySelectorAll("td")[0].textContent).toContain("FooC");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[1].querySelectorAll("td")[1].textContent).toContain("FooD");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[2].querySelectorAll("td")[0].textContent).toContain("FooE");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[2].querySelectorAll("td")[1].textContent).toContain("FooF");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[0].querySelectorAll("th")[0].textContent).toContain("Prop C");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[0].querySelectorAll("th")[1].textContent).toContain("Prop D");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[1].querySelectorAll("td")[0].textContent).toContain("BarC");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[1].querySelectorAll("td")[1].textContent).toContain("BarD");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[2].querySelectorAll("td")[0].textContent).toContain("BarE");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[2].querySelectorAll("td")[1].textContent).toContain("BarF");
        });


        it("Should render nested object in array", function () {
            $rootScope.obj = {
                "Array Foo": [
                    {
                        "PropA": "FooA",
                        "Prop B": {
                            "PropC": "FooC",
                            "PropD": "FooD"
                        }
                    }, {
                        "PropA": "BarA",
                        "Prop B": {
                            "PropC": "BarC",
                            "PropD": "BarD"
                        }
                    }
                ]
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            // Array Foo
            // Prop A        Prop B
            // FooA          PropC         FooC
            //               PropD         FooD
            // BarA          PropC         BarC
            //               PropD         BarD
            expect(element[0].querySelectorAll("table").length).toBe(4);
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[0].querySelectorAll("th")[0].textContent).toContain("Prop C");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[0].querySelectorAll("td")[0].textContent).toContain("FooC");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[1].querySelectorAll("th")[0].textContent).toContain("Prop D");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[1].querySelectorAll("td")[0].textContent).toContain("FooD");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[0].querySelectorAll("th")[0].textContent).toContain("Prop C");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[0].querySelectorAll("td")[0].textContent).toContain("BarC");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[1].querySelectorAll("th")[0].textContent).toContain("Prop D");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[1].querySelectorAll("td")[0].textContent).toContain("BarD");
        });

        it("Should render JSON property in nested table", function () {
            $rootScope.obj = {
                "Sfx Test JSON Foo": {
                    "Sfx Test Property A": "Foo",
                    "SfxTestPropertyB": "Bar",
                }
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            // Sfx Test JSON Foo
            // Sfx Test Property A        Foo
            // Sfx Test Property B        Bar
            expect(element[0].querySelectorAll("table").length).toBe(2);
            expect(element[0].querySelectorAll("table")[0].querySelector("tr th").textContent).toContain("Sfx Test JSON Foo");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[0].querySelector("th").textContent).toContain("Sfx Test Property A");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[0].querySelector("td").textContent).toContain("Foo");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[1].querySelector("th").textContent).toContain("Sfx Test Property B");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[1].querySelector("td").textContent).toContain("Bar");
        });


        it("Should handle badge properly", function () {
            $rootScope.obj = {
                "Sfx Test Badge": {
                    badgeId: "OK",
                    text: "OK",
                    badgeClass: "badge-ok"
                }
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            expect(element[0].querySelector(".badge-container span").textContent).toContain("OK");
        });


        it("Should hornor the hide list defined in decorators", function () {
            $rootScope.obj = {
                decorators: {
                    hideList: [
                        "Test Prop A"
                    ]
                },

                raw: {
                    "Test Prop A": "Foo",
                    "Test Prop B": "Bar"
                }
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            expect(element.html()).not.toContain("Test Prop A");
            expect(element.html()).not.toContain("Foo");
            expect(element.html()).toContain("Test Prop B");
            expect(element.html()).toContain("Bar");
        });


        it("Should hornor the show list defined in decorators", function () {
            $rootScope.obj = {
                decorators: {
                    showList: [
                        "Test Prop A"
                    ]
                },

                raw: {
                    "Test Prop A": "Foo",
                    "Test Prop B": "Bar"
                }
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            expect(element.html()).toContain("Test Prop A");
            expect(element.html()).toContain("Foo");
            expect(element.html()).not.toContain("Test Prop B");
            expect(element.html()).not.toContain("Bar");
        });


        it("Should hornor the decorators for properties", function () {
            $rootScope.obj = {
                decorators: {
                    decorators: {
                        "Test Prop A": {
                            displayName: value => "Test Prop Foo",
                            displayValueInHtml: value => "Test Prop Foo Value"
                        }
                    }
                },

                raw: {
                    "Test Prop A": "Test Prop A Value"
                }
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            expect(element.html()).not.toContain("Test Prop A");
            expect(element.html()).not.toContain("Test Prop A Value");
            expect(element.html()).toContain("Test Prop Foo");
            expect(element.html()).toContain("Test Prop Foo Value");
        });


        it("Should render object returned from decorator perperly", function () {
            $rootScope.obj = {
                decorators: {
                    decorators: {
                        "Test Prop A": {
                            displayName: value => "Test Prop Foo",
                            displayValueInHtml: value => {
                                return {
                                    "Sfx Test Property A": "Foo",
                                    "SfxTestPropertyB": "Bar",
                                };
                            }
                        }
                    }
                },

                raw: {
                    "Test Prop A": "Any value"
                }
            }

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the templated content
            expect(element[0].querySelectorAll("table").length).toBe(2);
            expect(element[0].querySelectorAll("table")[0].querySelector("tr th").textContent).toContain("Test Prop Foo");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[0].querySelector("th").textContent).toContain("Sfx Test Property A");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[0].querySelector("td").textContent).toContain("Foo");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[1].querySelector("th").textContent).toContain("Sfx Test Property B");
            expect(element[0].querySelectorAll("table")[1].querySelectorAll("tr")[1].querySelector("td").textContent).toContain("Bar");
        });


        it("Should update properties values when object changed", function () {
            $rootScope.obj = {
                "Sfx Test Property A": "Foo",
                "SfxTestPropertyB": "Bar",
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Update model
            // Only update PropX values does NOT refresh the view because the directive only watches the object
            // itself or object.raw, which are sufficient because when refreshing the data model, only the raw 
            // or itself get updated.
            $rootScope.obj = {
                "Sfx Test Property A": "Foo",
                "SfxTestPropertyB": "BarB",
            };

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the updated values
            expect(element[0].querySelectorAll("td")[1].textContent).toContain("BarB");
        });


        it("Should update nested properties values when nested properties changed", function () {
            $rootScope.obj = {
                "Array Foo": [
                    {
                        "PropA": "FooA",
                        "Prop B": [
                            {
                                "PropC": "FooC",
                                "PropD": "FooD"
                            }, {
                                "PropC": "FooE",
                                "PropD": "FooF"
                            }
                        ]
                    }, {
                        "PropA": "BarA",
                        "Prop B": [
                            {
                                "PropC": "BarC",
                                "PropD": "BarD"
                            }, {
                                "PropC": "BarE",
                                "PropD": "BarF"
                            }
                        ]
                    }
                ]
            };

            // Compile a piece of HTML containing the directive
            var element = $compile("<sfx-detail-view-part data=\"obj\"></sfx-detail-view-part>")($rootScope);

            // fire all the watches
            $rootScope.$digest();

            // Update model
            // Only update PropX values does NOT refresh the view because the directive only watches the object
            // itself or object.raw, which are sufficient because when refreshing the data model, only the raw 
            // or itself get updated.
            $rootScope.obj = {
                "Array Foo": [
                    {
                        "PropA": "FooA",
                        "Prop B": [
                            {
                                "PropC": "FooG",
                                "PropD": "FooH"
                            }
                        ]
                    }, {
                        "PropA": "BarA",
                        "Prop B": [
                            {
                                "PropC": "BarG",
                                "PropD": "BarH"
                            }
                        ]
                    }
                ]
            };

            // fire all the watches
            $rootScope.$digest();

            // Check that the compiled element contains the updated values
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr").length).toBe(2);
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[1].querySelectorAll("td")[0].textContent).toContain("FooG");
            expect(element[0].querySelectorAll("table")[2].querySelectorAll("tr")[1].querySelectorAll("td")[1].textContent).toContain("FooH");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[1].querySelectorAll("td")[0].textContent).toContain("BarG");
            expect(element[0].querySelectorAll("table")[3].querySelectorAll("tr")[1].querySelectorAll("td")[1].textContent).toContain("BarH");
        });
    });
}


