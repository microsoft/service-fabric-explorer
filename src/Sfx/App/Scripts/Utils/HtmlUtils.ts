//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class HtmlUtils {

        // Reposition the filter context menu if they are out of current view port
        public static repositionContextMenu(): void {
            _.forEach($(".uib-dropdown-open .dropdown-menu:visible"), el => {
                if (el.offsetLeft + el.offsetWidth > window.innerWidth) {
                    $(el).css("left", window.innerWidth - el.offsetWidth);
                }
                if (el.offsetTop + el.offsetHeight > window.innerHeight) {
                    $(el).css("top", el.offsetTop - el.offsetHeight - 20);
                }
            });
        }

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
            return `<a href="${url}"${targetBlank ? ` target="_blank"` : ""}>${text}</a>`;
        }

        public static getBadgeHtml(badge: ITextAndBadge): string {
            if (!badge.badgeClass) {
                return this.getSpanWithTitleHtml(badge.text);
            }
            // Keep the template here in sync with badge.html
            return `<div class="badge-container" title="${badge.text}"><img class="badge-icon" src="images/${badge.badgeClass}.svg"></img><span> ${badge.text}</span></div>`;
        }

        public static getEventSecondRowHtml(event: FabricEventBase): string {
            let json = `Event InstanceId: ${event.eventInstanceId}</br>` +
                `Additional Properties: ${JSON.stringify(event.eventProperties, null, "&nbsp;")}`;
            return `<div style="margin-left:20px">${json.replace(new RegExp("\\n", "g"), "<br/>")}</div>`;
        }

        public static getEventDetailsViewLinkHtml(event: FabricEventBase): string {
            return event.hasCorrelatedEvents ? `<a title="Correlated Events" href ng-click="showDetails('` + event.eventInstanceId + `')">View</a>` : "";
        }
    }
}
