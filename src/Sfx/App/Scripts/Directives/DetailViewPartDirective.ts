//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    // Node the data passed to the directive MUST be an object (associative array).
    // If you need to visualize a simple array or a simple string, wrap
    // it in an object and pass the object to the directive.
    export class DetailViewPartDirective implements ng.IDirective {
        public restrict = "AE";
        public replace = true;
        public controller = DetailViewPartController;
        public controllerAs = "ctrl";
        public templateUrl = "partials/detail-view-part.html";
        public scope = {
            data: "="
        };

        public link($scope: any, element: JQuery, attributes: any, ctrl: DetailViewPartController) {
            $scope.noFixedLayout = false;
            attributes.$observe("noFixedLayout", function () {
                $scope.noFixedLayout = $scope.$eval(attributes.noFixedLayout);
            });
            $scope.$watchGroup(["data.raw", "data"], function (newValue, oldValue) {
                $scope.resolvedData = ctrl.getResolvedDataObject($scope.data);
            });
        }
    }

    export class ResolvedObject {
        [index: string]: any;
    }

    export class DetailViewPartController {

        public getResolvedObjectSize(object: any): number {
            return _.size(object);
        }

        public getResolvedPropertyType(value: any): string {
            if (this.isResolvedObject(value)) {
                return "Object";
            } else if (this.isArray(value)) {
                return "Array";
            } else if (this.isHtml(value)) {
                return "Html";
            } else {
                return "Value";
            }
        }

        public getResolvedDataObject(data: any, preserveEmptyProperties: boolean = false): any {
            if (!data) {
                return null;
            }

            if (data instanceof ResolvedObject) {
                return data;
            }

            if (data.hasOwnProperty("raw")) {
                if (_.isUndefined(data.raw) || _.isNull(data.raw)) {
                    return null;
                }
                return this.getResolvedDataObjectInternal(data.raw, data, preserveEmptyProperties);
            }

            return this.getResolvedDataObjectInternal(data, null, preserveEmptyProperties);
        }

        private isResolvedObject(value: any): boolean {
            return value instanceof ResolvedObject;
        }

        private isArray(value: any): boolean {
            return _.isArray(value);
        }

        private isHtml(value: string): boolean {
            return HtmlUtils.isHtml(value);
        }

        private getResolvedDataObjectInternal(data: any, parent: any, preserveEmptyProperties: boolean = false): ResolvedObject {
            let resolvedObject = new ResolvedObject();

            _.forOwn(data, (value, name) => {
                let resolvedName = _.startCase(name);
                let resolvedValue = null;

                // Use decorator to resolve value if defined
                if (parent && parent.decorators) {
                    if (parent.decorators.showList && !_.includes(parent.decorators.showList, name)) {
                        // If a showList is defined, use it to filter the object properties
                        return;
                    } else if (parent.decorators.hideList && _.includes(parent.decorators.hideList, name)) {
                        // If a hideList is defined, use it to filter the object properties
                        return;
                    }

                    // If a decorator is defined for current property, use it
                    if (parent.decorators.decorators && parent.decorators.decorators[name]) {
                        if (parent.decorators.decorators[name].displayName) {
                            resolvedName = parent.decorators.decorators[name].displayName(name);
                        }
                        if (parent.decorators.decorators[name].displayValueInHtml) {
                            resolvedValue = parent.decorators.decorators[name].displayValueInHtml(value);
                        }
                    }
                }

                if (!resolvedValue) {
                    // Try to look for the same property defined in parent object
                    if (parent) {
                        resolvedValue = parent[name] || parent[_.camelCase(name)];
                    }

                    // Fall back to the original value
                    if (!resolvedValue) {
                        resolvedValue = data[name];
                    }
                }

                if (_.isNumber(resolvedValue) || _.isBoolean(resolvedValue)) {
                    // Number and Boolean are always preserved
                } else if (_.isUndefined(resolvedValue) || _.isNull(resolvedValue) || _.isEmpty(resolvedValue)) {
                    if (preserveEmptyProperties) {
                        resolvedValue = Constants.Empty;
                    } else {
                        // Remove all empty/undefined/null value properties
                        resolvedValue = null;
                    }
                } else if (_.isArray(resolvedValue)) {
                    if (!_.isObject(_.first(resolvedValue))) {
                        // The first element in the array is not an object, assume all the elements are value types
                        resolvedValue = `[${_.map(resolvedValue, v => v.toString()).join(", ")}]`;
                    } else {
                        // Resolve sub-array, for array, all properties are preserved unless filtered by showList/hideList
                        resolvedValue = _.map(resolvedValue, v => this.getResolvedDataObject(v, true));
                    }
                } else if (_.isObject(resolvedValue)) {
                    // Deal with badge class as a special case
                    if (Utils.isBadge(resolvedValue)) {
                        if (resolvedValue.text && resolvedValue.badgeClass) {
                            resolvedValue = HtmlUtils.getBadgeHtml(resolvedValue);
                        } else {
                            resolvedValue = resolvedValue.text;
                        }
                    } else {
                        // Resolve sub-object
                        resolvedValue = this.getResolvedDataObject(resolvedValue);
                    }
                }

                if (_.isEmpty(resolvedName)) {
                    resolvedName = Constants.Empty;
                }

                if (resolvedValue !== null) {
                    resolvedObject[resolvedName] = resolvedValue;
                }
            });

            return _.size(resolvedObject) > 0 ? resolvedObject : null;
        }
    }
}
