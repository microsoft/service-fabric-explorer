import { FabricEventBase } from '../Models/eventstore/Events';
import { Constants } from '../Common/Constants';
import { ITextAndBadge } from './ValueResolver';
import { Utils } from './Utils';
import { environment } from 'src/environments/environment';

// -----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
// -----------------------------------------------------------------------------

export class EventTypesUtil {
    private WarningEventTypes = Utils.keyByFromFunction( [
        '*HealthReportCreated-HealthState:Warning',     // Old:6.2
        '*NewHealthReport-HealthState:Warning',
        '*UpgradeRollbackStart',                        // Old:6.2
        '*UpgradeRollbackComplete',                     // Old:6.2
        '*UpgradeRollbackStarted',
        '*UpgradeRollbackCompleted',
        'BuildIdleReplicaFailed',
        'PrimaryFaultedSlowSecondary',
        'PrimaryReplicationQueueFull',
        'PrimaryReplicationQueueWarning',
        'ReplicatorFaulted',
        'SecondaryReplicationQueueFull',
        'SecondaryReplicationQueueWarning'],
        item => item.split('-')[0].replace('*', '') );
    private ErrorEventTypes = Utils.keyByFromFunction( [
        '*HealthReportCreated-HealthState:Error',
        '*NewHealthReport-HealthState:Error',
        'NodeDown',
        'NodeOpenFailed',
        'NodeAborted',
        'TStoreError' ],
        item => item.split('-')[0].replace('*', '') );
    private ResolvedEventTypes = Utils.keyByFromFunction( [
        '*HealthReportCreated-HealthState:Ok',
        '*NewHealthReport-HealthState:Ok' ],
        item => item.split('-')[0].replace('*', '') );

    private warningEventsRegExp = EventTypesUtil.constructRegExp(
        Object.keys(this.WarningEventTypes).map(e => this.WarningEventTypes[e]));
    private errorEventsRegExp = EventTypesUtil.constructRegExp(
        Object.keys(this.ErrorEventTypes).map(e => this.ErrorEventTypes[e]));
    private resolvedEventsRegExp = EventTypesUtil.constructRegExp(
        Object.keys(this.ResolvedEventTypes).map(e => this.ResolvedEventTypes[e]));

    private static constructRegExp(typesList: string[]): string {
        let regString = '^';
        typesList.forEach(eventType => {
            let lookupName = eventType.split('-')[0];
            if (regString !== '^') {
                regString += '|';
            }
            regString += '(?:';
            if (lookupName.startsWith('*')) {
                regString += '[a-zA-Z]+';
                lookupName = lookupName.substr(1);
            }
            regString += '(' + lookupName + ')';
            regString += ')';
        });
        regString += '$';
        return regString;
    }

    private static isEventMatching(event: FabricEventBase, regString: string): string {
        const result = null;
        const regExp = new RegExp(regString);
        const match = regExp.exec(event.kind);
        if (match) {
            return match.filter(i => i)[1];
        }
        return result;
    }

    private static isPropertyMatching(event: FabricEventBase, lookupString: string): boolean {
        const splittedValue = lookupString.split('-');
        if (splittedValue.length > 1) {
            const propertyToVerify = splittedValue[1].split(':');
            if ((event.eventProperties[propertyToVerify[0]] + '') !== propertyToVerify[1]) {
                return false;
            }
        }

        return true;
    }

    public constructor() {
    }

    public isWarning(event: FabricEventBase): boolean {
        const foundKey = EventTypesUtil.isEventMatching(event, this.warningEventsRegExp);
        if (!foundKey) {
            return false;
        }

        return EventTypesUtil.isPropertyMatching(event, this.WarningEventTypes[foundKey]);
    }

    public isError(event: FabricEventBase): boolean {
        const foundKey = EventTypesUtil.isEventMatching(event, this.errorEventsRegExp);
        if (!foundKey) {
            return false;
        }

        return EventTypesUtil.isPropertyMatching(event, this.ErrorEventTypes[foundKey]);
    }

    public isResolved(event: FabricEventBase): boolean {
        const foundKey = EventTypesUtil.isEventMatching(event, this.resolvedEventsRegExp);
        if (!foundKey) {
            return false;
        }

        return EventTypesUtil.isPropertyMatching(event, this.ResolvedEventTypes[foundKey]);
    }
}

export class HtmlUtils {

    // Utility to mark warning/error/resolved events in the detail list
    public static eventTypesUtil = new EventTypesUtil();

    public static isHtml(text: string): boolean {
        return /<\/[a-zA-Z]+>/.test(text);
    }

    public static getSpanWithCustomClass(className: string, text: string): string {
        return `<span class="${className}">${text}</span>`;
    }

    public static getSpanWithTitleHtml(text: string): string {
        return `<span title="${text}">${text}</span>`;
    }

    public static getUpgradeProgressHtml(upgradeDomainsPropertyPath: string): string {
        return `<${Constants.DirectiveNameUpgradeProgress} upgrade-domains="${upgradeDomainsPropertyPath}"></${Constants.DirectiveNameUpgradeProgress}>`;
    }

    public static getLinkHtml(text: string, url: string, targetBlank: boolean = false): string {
        return `<a routerLink="${url}" ${targetBlank ? ` target="_blank"` : ''}>${text}</a>`;
    }

    public static getBadgeHtml(badge: ITextAndBadge): string {
        if (!badge.badgeClass) {
            return this.getSpanWithTitleHtml(badge.text);
        }
        // Keep the template here in sync with badge.html
        return `<div class="badge-container" title="${badge.text}"><img class="badge-icon" src="${environment.assetBase}assets/${badge.badgeClass}.svg" alt="${badge.text} badge"></img><span> ${badge.text}</span></div>`;
    }

    public static getLinkOutHtml(text: string, url: string, targetBlank: boolean = false): string {
        return `<a href="${url}" ${targetBlank ? ` target="_blank"` : ''}>${text}</a>`;
    }

    public static parseReplicaAddress(address: string): any {
        if (!address) {
            return null;
        }
        return address.indexOf('{') === 0
            ? JSON.parse(address, (key: any, value: any) => {
                if (typeof value === 'string' && Utils.isSingleURL(value)) {
                    return HtmlUtils.getLinkOutHtml(value, value, true);
                }
                return value;
            })
            : (Utils.isSingleURL(address) ? HtmlUtils.getLinkOutHtml(address, address) : address);
    }

}

