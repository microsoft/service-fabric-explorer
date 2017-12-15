//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
//-----------------------------------------------------------------------------

module Sfx {

    export interface ITextAndBadge {
        text: string;
        badgeId: string;
        badgeClass?: string;
    }

    export class ValueResolver {
        public static unknown: ITextAndBadge = {
            badgeId: "Unknown", text: "Unknown"
        };

        public static get healthStatuses(): ITextAndBadge[] {
            return ValueResolver.healthStatus;
        }

        private static healthStatus: ITextAndBadge[] = [
            { badgeId: HealthStateConstants.Invalid, text: HealthStateConstants.Invalid, badgeClass: "badge-unknown" },
            { badgeId: HealthStateConstants.OK, text: HealthStateConstants.OK, badgeClass: "badge-ok" },
            { badgeId: HealthStateConstants.Warning, text: HealthStateConstants.Warning, badgeClass: "badge-warning" },
            { badgeId: HealthStateConstants.Error, text: HealthStateConstants.Error, badgeClass: "badge-error" },
            { badgeId: HealthStateConstants.Unknown, text: HealthStateConstants.Unknown, badgeClass: "badge-unknown" }];

        public resolveHealthStatus(value: string): ITextAndBadge {
            // Default to Unknown health state if resolve failed
            return this.resolve(value, ValueResolver.healthStatus, _.last(ValueResolver.healthStatus));
        }

        public resolve(value: string, options: ITextAndBadge[], defaultValue: ITextAndBadge = null): ITextAndBadge {

            if (Utils.isNumeric(value)) {
                let enumValue = _.parseInt(value);
                if (enumValue >= 0 && enumValue < options.length) {
                    return options[enumValue];
                }
            }

            return this.resolveEnumValue(value, options) || defaultValue || {
                badgeId: value,
                text: value
            };
        }

        private resolveEnumValue(value: string, options: ITextAndBadge[]) {
            if (!_.isString(value)) {
                return null;
            }

            return _.find(options, opt => opt.text.toLowerCase() === value.toLowerCase() || opt.badgeId.toLowerCase() === value.toLowerCase());
        }
    }
}
