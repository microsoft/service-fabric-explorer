import { HtmlUtils } from '../Utils/HtmlUtils';
import { Utils } from '../Utils/Utils';

//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

export class ListSettings {
    public search: string;
    public sortPropertyPaths: string[] = [];
    public sortReverse: boolean = false;

    private _currentPage: number = 1;
    private _itemCount: number = 0;

    public get count(): number {
        return this._itemCount;
    }

    public set count(itemCount: number) {
        this._itemCount = itemCount;

        if (this.currentPage > this.pageCount) {
            this.currentPage = this.pageCount;
        }
    }

    public get currentPage(): number {
        return this._currentPage;
    }

    public get hasEnabledFilters(): boolean {
        return _.some(this.columnSettings, cs => cs.enableFilter);
    }

    public set currentPage(page: number) {
        if (page < 1) {
            this._currentPage = 1;
        } else if (page > this.pageCount) {
            if (this.pageCount > 0) {
                this._currentPage = this.pageCount;
            } else {
                this._currentPage = 1;
            }
        } else {
            this._currentPage = page;
        }
    }

    public get begin(): number {
        return (this.currentPage - 1) * this.limit;
    }

    public get pageCount(): number {
        return Math.ceil(this.count / this.limit);
    }

    public setPageWithIndex(index: number): void {
        this.currentPage = Math.floor(index / this.limit) + 1;
    }

    /**
     * Creates a ListSettings object.
     * @param limit The items count displayed in each page
     * @param defaultSortPropertyPaths The default sorting property for this list
     * @param columnSettings The settings for each columns
     * @param secondRowColumnSettings For some list, one item will display two lines
     *                                (e.g. description takes the second line)
     *                                But the columns for the second line have no filters/sort capabilities.
     * @param secondRowCollapsible If set to true, the second row can be collapsed by clicking the expand icon in the first column.
     */
    public constructor(
        public limit: number,
        public defaultSortPropertyPaths: string[],
        public columnSettings: ListColumnSetting[],
        public secondRowColumnSettings: ListColumnSetting[] = [],
        public secondRowCollapsible: boolean = false,
        public showSecondRow: (item) => boolean = (item) => true,
        public searchable: boolean = true) {

        this.sortPropertyPaths = defaultSortPropertyPaths;
    }

    public sort(sortPropertyPaths: string[]): void {
        this.sortPropertyPaths = sortPropertyPaths;
        this.sortReverse = !this.sortReverse;
    }

    public isSortedByColumn(columnSetting: ListColumnSetting): boolean {
        return _.isEqual(this.sortPropertyPaths, columnSetting.sortPropertyPaths);
    }

    public reset(): void {
        _.forEach(this.columnSettings, cs => cs.reset());
        this.search = null;
        this.sortPropertyPaths = this.defaultSortPropertyPaths;
        this.sortReverse = false;
        this.currentPage = 1;
    }

    public getPluckedObject(item: any): any {
        if (!_.isEmpty(this.columnSettings)) {
            let newObj = {};
            _.forEach(_.union(this.columnSettings, this.secondRowColumnSettings), column => newObj[column.propertyPath] = column.getTextValue(item));
            return newObj;
        }
        return item;
    }

    public filterContextMenuToggled(open: boolean) {
        if (open) {
            HtmlUtils.repositionContextMenu();
        }
    }
}

export class FilterValue {
    public isChecked: boolean = true;

    public constructor(public value: string) {
    }
}

export class ListColumnSetting {
    // This array contains all unique values in the specified property of items in current list.
    // This will be populated by DetailListDirective when the list changes.
    public filterValues: FilterValue[] = [];

    public fixedWidthPx?: number;

    public get hasFilters(): boolean {
        return this.enableFilter && this.filterValues.length > 0;
    }

    public get hasEffectiveFilters(): boolean {
        return _.some(this.filterValues, filter => !filter.isChecked);
    }

    public get sortable(): boolean {
        return !_.isEmpty(this.sortPropertyPaths);
    }

    /**
     * Create a column setting
     * @param propertyPath The property path to retrieve display object/value
     * @param displayName The property name displayed in the column header
     * @param sortPropertyPaths The properties to sort against when user click the column header
     * @param enableFilter Whether to enable filters for this column
     * @param getDisplayHtml Customize the HTML to render in this column giving a specific item
     * @param colspan The colspan for the extra line, does not affect the first line
     * @param clickEvent A callback that will be executed on click
     */
    public constructor(
        public propertyPath: string,
        public displayName: string,
        public sortPropertyPaths: string[] = [propertyPath],
        public enableFilter?: boolean,
        public getDisplayHtml?: (item, property) => string,
        public colspan: number = 1,
        public clickEvent: (item) => void = (item) => null ) {
    }

    public reset(): void {
        this.filterValues.forEach(filter => filter.isChecked = true);
    }

    public getProperty(item: any): any {
        if (this.propertyPath && _.startsWith(this.propertyPath, "#")) {
            return this.propertyPath.substr(1);
        }

        return Utils.result(item, this.propertyPath);
    }

    public isBadge(item: any): boolean {
        return Utils.isBadge(item);
    }

    public getTextValue(item: any): string {
        let property = this.getProperty(item);
        if (property === undefined || property === null) {
            return "";
        }

        return property.toString();
    }

    public getDisplayContentsInHtml(item: any): string {
        let property = this.getProperty(item);
        if (this.getDisplayHtml) {
            return this.getDisplayHtml(item, property);
        }

        if (property === undefined || property === null) {
            return "";
        }

        return property.toString();
    }
}

export class ListColumnSettingForBadge extends ListColumnSetting {
    public constructor(
        propertyPath: string,
        displayName: string,
        sortPropertyPaths: string[] = [propertyPath + ".text"]) {

        super(propertyPath, displayName, sortPropertyPaths, true, (item, property) => HtmlUtils.getBadgeHtml(property));
    }

    public getTextValue(item: any): string {
        let property = this.getProperty(item);
        if (property) {
            return property.text;
        }
        return "";
    }
}

export class ListColumnSettingWithFilter extends ListColumnSetting {
    public constructor(
        propertyPath: string,
        displayName: string,
        sortPropertyPaths: string[] = [propertyPath]) {

        super(propertyPath, displayName, sortPropertyPaths, true);
    }
}

export class ListColumnSettingForLink extends ListColumnSetting {
    public constructor(
        propertyPath: string,
        displayName: string,
        href: (item: any) => string) {

        super(propertyPath, displayName, [propertyPath], false, (item, property) => HtmlUtils.getLinkHtml(property, href(item)));
    }
}


