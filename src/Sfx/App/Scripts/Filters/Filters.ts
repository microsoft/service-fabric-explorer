//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    (function () {

        let module = angular.module("filters", []);

        module.filter("trim", [function () {
            return function (str) {
                return (str || "").replace(/(^\s*|\s*$)/g, function (match, group) {
                    return "";
                });
            };
        }]);

    })();
}
