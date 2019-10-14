import { FabricEventBase } from '../Models/eventstore/Events';
import { Constants } from '../Common/Constants';
import { ITextAndBadge } from './ValueResolver';
import { Utils } from './Utils';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export class EventTypesUtil {
    private WarningEventTypes = Utils.keyByFromFunction( [
        "*HealthReportCreated-HealthState:Warning",     //Old:6.2
        "*NewHealthReport-HealthState:Warning",
        "*UpgradeRollbackStart",                        //Old:6.2
        "*UpgradeRollbackComplete",                     //Old:6.2
        "*UpgradeRollbackStarted",
        "*UpgradeRollbackCompleted",
        "BuildIdleReplicaFailed",
        "PrimaryFaultedSlowSecondary",
        "PrimaryReplicationQueueFull",
        "PrimaryReplicationQueueWarning",
        "ReplicatorFaulted",
        "SecondaryReplicationQueueFull",
        "SecondaryReplicationQueueWarning"],
        item => item.split("-")[0].replace("*", "") );
    private ErrorEventTypes = Utils.keyByFromFunction( [
        "*HealthReportCreated-HealthState:Error",
        "*NewHealthReport-HealthState:Error",
        "NodeDown",
        "NodeOpenFailed",
        "NodeAborted",
        "TStoreError" ],
        item => item.split("-")[0].replace("*", "") );
    private ResolvedEventTypes = Utils.keyByFromFunction( [
        "*HealthReportCreated-HealthState:Ok",
        "*NewHealthReport-HealthState:Ok" ],
        item => item.split("-")[0].replace("*", "") );

    private warningEventsRegExp = EventTypesUtil.constructRegExp(
        Object.keys(this.WarningEventTypes).map(e => this.WarningEventTypes[e]));
    private errorEventsRegExp = EventTypesUtil.constructRegExp(
        Object.keys(this.ErrorEventTypes).map(e => this.ErrorEventTypes[e]));
    private resolvedEventsRegExp = EventTypesUtil.constructRegExp(
        Object.keys(this.ResolvedEventTypes).map(e => this.ResolvedEventTypes[e]));

    private static constructRegExp(typesList: string[]): string {
        let regString = "^";
        typesList.forEach(eventType => {
            let lookupName = eventType.split("-")[0];
            if (regString !== "^") {
                regString += "|";
            }
            regString += "(?:";
            if (lookupName.startsWith("*")) {
                regString += "[a-zA-Z]+";
                lookupName = lookupName.substr(1);
            }
            regString += "(" + lookupName + ")";
            regString += ")";
        });
        regString += "$";
        return regString;
    }

    private static isEventMatching(event: FabricEventBase, regString: string): string {
        let result = null;
        let regExp = new RegExp(regString);
        let match = regExp.exec(event.kind);
        if (match) {
            return match.filter(i => i)[1];
        }
        return result;
    }

    private static isPropertyMatching(event: FabricEventBase, lookupString: string): boolean {
        let splittedValue = lookupString.split("-");
        if (splittedValue.length > 1) {
            let propertyToVerify = splittedValue[1].split(":");
            if ((event.eventProperties[propertyToVerify[0]] + "") !== propertyToVerify[1]) {
                return false;
            }
        }

        return true;
    }

    public constructor() {
    }

    public isWarning(event: FabricEventBase): boolean {
        let foundKey = EventTypesUtil.isEventMatching(event, this.warningEventsRegExp);
        if (!foundKey) {
            return false;
        }

        return EventTypesUtil.isPropertyMatching(event, this.WarningEventTypes[foundKey]);
    }

    public isError(event: FabricEventBase): boolean {
        let foundKey = EventTypesUtil.isEventMatching(event, this.errorEventsRegExp);
        if (!foundKey) {
            return false;
        }

        return EventTypesUtil.isPropertyMatching(event, this.ErrorEventTypes[foundKey]);
    }

    public isResolved(event: FabricEventBase): boolean {
        let foundKey = EventTypesUtil.isEventMatching(event, this.resolvedEventsRegExp);
        if (!foundKey) {
            return false;
        }

        return EventTypesUtil.isPropertyMatching(event, this.ResolvedEventTypes[foundKey]);
    }
}

export class HtmlUtils {

    // Utility to mark warning/error/resolved events in the detail list
    private static eventTypesUtil = new EventTypesUtil();

    // Reposition the filter context menu if they are out of current view port
    public static repositionContextMenu(): void {
        // TODO fix this?
        // _.forEach($(".uib-dropdown-open .dropdown-menu:visible"), el => {
        //     if (el.offsetLeft + el.offsetWidth > window.innerWidth) {
        //         $(el).css("left", window.innerWidth - el.offsetWidth);
        //     }
        //     if (el.offsetTop + el.offsetHeight > window.innerHeight) {
        //         $(el).css("top", el.offsetTop - el.offsetHeight - 20);
        //     }
        // });
    }

    public static isHtml(text: string): boolean {
        return /<\/[a-zA-Z]+>/.test(text);
    }

    public static getSpanWithCustomClass(className: string, text: string): string {
        return `<span class="${className}">${text}</span>`;
    }

    public static getSpanWithLink(className: string, text: string, url: string): string {
        if (url) {
            return `<a class="${className}" title="${text}" ng-href="${url}" ">${text}</a>`;
        }else {
            return HtmlUtils.getSpanWithCustomClass(className, text);
        }
    }

    public static getSpanWithTitleHtml(text: string): string {
        return `<span title="${text}">${text}</span>`;
    }

    public static getUpgradeProgressHtml(upgradeDomainsPropertyPath: string): string {
        return `<${Constants.DirectiveNameUpgradeProgress} upgrade-domains="${upgradeDomainsPropertyPath}"></${Constants.DirectiveNameUpgradeProgress}>`;
    }

    public static getLinkHtml(text: string, url: string, targetBlank: boolean = false): string {
        return `<a href="${url}"${targetBlank ? ` target="_blank"` : ""}>${text}</a>`;
    }

    public static getBadgeHtml(badge: ITextAndBadge): string {
        if (!badge.badgeClass) {
            return this.getSpanWithTitleHtml(badge.text);
        }
        // Keep the template here in sync with badge.html
        return `<div class="badge-container" title="${badge.text}"><img class="badge-icon" src="images/${badge.badgeClass}.svg" alt="${badge.text} badge"></img><span> ${badge.text}</span></div>`;
    }

    public static getBadgeOnlyHtml(badge: ITextAndBadge): string {
        return `<div class="badge-container" title="${badge.text}"><img class="badge-icon" src="images/${badge.badgeClass}.svg"></img></div>`;
    }

    public static getEventNameHtml(event: FabricEventBase): string {
        let color = null;
        if (HtmlUtils.eventTypesUtil.isResolved(event)) {
            color = "#3AA655";
        } else if (HtmlUtils.eventTypesUtil.isWarning(event)) {
            color = "#F2C649";
        } else if (HtmlUtils.eventTypesUtil.isError(event)) {
            color = "#FF5349";
        }

        if (color) {
            return `<span style="color:${color}">${event.kind}</span>`;
        }
        return event.kind;
    }

    public static getEventSecondRowHtml(event: FabricEventBase): string {
        let json = `EventInstanceId: "${event.eventInstanceId}"</br>` +
            `Additional Properties: ${JSON.stringify(event.eventProperties, null, "&nbsp;")}`;
        return `<div style="margin-left:20px">${json.replace(new RegExp("\\n", "g"), "<br/>")}</div>`;
    }

    public static getEventDetailsViewLinkHtml(event: FabricEventBase): string {
        return event.hasCorrelatedEvents ? `<a title="Correlated Events" href ng-click="showDetails('` + event.eventInstanceId + `')">View</a>` : "";
    }

    public static parseReplicaAddress(address: string): any {
        if (!address) {
            return null;
        }
        return address.indexOf("{") === 0
            ? JSON.parse(address, (key: any, value: any) => {
                if (typeof value === 'string' && Utils.isSingleURL(value)) {
                    return HtmlUtils.getLinkHtml(value, value, true);
                }
                return value;
            })
            : (Utils.isSingleURL(address) ? HtmlUtils.getLinkHtml(address, address) : address);
    }

}

