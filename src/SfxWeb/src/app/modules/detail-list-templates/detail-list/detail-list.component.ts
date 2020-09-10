import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChildren, QueryList} from '@angular/core';
import { ListSettings, ListColumnSetting, FilterValue } from 'src/app/Models/ListSettings';
import { DataModelCollectionBase } from 'src/app/Models/DataModels/collections/CollectionBase';
import  fill  from 'lodash/fill';
import  isEmpty  from 'lodash/isEmpty';
import  sortBy  from 'lodash/sortBy';
import  union  from 'lodash/union';
import  map from 'lodash/map';
import  filter from 'lodash/filter';
import  uniq from 'lodash/uniq';
import  includes from 'lodash/includes';
import  every from 'lodash/every';

import { Utils } from 'src/app/Utils/Utils';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { LiveAnnouncer } from '@angular/cdk/a11y';
@Component({
  selector: 'detail-list',
  templateUrl: './detail-list.component.html',
  styleUrls: ['./detail-list.component.scss']
})
export class DetailListComponent implements OnInit, OnDestroy {

  @Input() listSettings: ListSettings;
  @Input() searchText = 'Search list';
  @Input() isLoading = false;
  private _list: any[];
  public sortedFilteredList: any[] = []; // actual list displayed in html.

  page = 1;
  totalListSize = 0;

  debounceHandler: Subject<any[]> = new Subject<any[]>();
  debouncerHandlerSubscription: Subscription;
  @ViewChildren(NgbDropdown) dropdowns: QueryList<NgbDropdown>;

  constructor(private liveAnnouncer: LiveAnnouncer) { }

  @Input()
  set list(data: any[] | DataModelCollectionBase<any>) {
    if (data instanceof DataModelCollectionBase){
      data.ensureInitialized().subscribe(data => {
        this._list = [].concat(data.collection);
        this.updateList();
      });
    }else{
      this._list = data;
    }

    this._list = this._list || [];
    this.updateList();
  }

  @Output() onSort = new EventEmitter<any[]>();

  ngOnInit() {
    this.debouncerHandlerSubscription = this.debounceHandler
   .pipe(debounceTime(1000), distinctUntilChanged())
   .subscribe(val => {
      this.onSort.emit(val);
   });
  }

  ngOnDestroy() {
    if (this.debouncerHandlerSubscription){
      this.debouncerHandlerSubscription.unsubscribe();
    }
  }

  resetAll() {
    this.listSettings.reset();
  }

  public handleClickRow(item: any, event: any): void {
      if (event && event.target !== event.currentTarget) { return; }
      if (this.listSettings.secondRowCollapsible && this.listSettings.showSecondRow(item)) {
          item.isSecondRowCollapsed = !item.isSecondRowCollapsed;
      }
  }

  trackByColumnSetting(columnSetting: ListColumnSetting) {
    return columnSetting.propertyPath;
  }

  sort(columnSetting: ListColumnSetting) {
    this.listSettings.sort(columnSetting.sortPropertyPaths);
    this.updateList();

    if (!Utils.isIEOrEdge) {
      this.liveAnnouncer.announce(`Table is sorted by ${columnSetting.displayName} and is ${this.listSettings.sortReverse ? 'descending' : 'ascending'}`);
    }
  }

  closeChange(state: boolean) {
    this.liveAnnouncer.announce(`dropdown is now ${state ? 'Expanded' : 'Collapsed'}`);
  }

  private getSortedFilteredList(): any[] {
    let list = this._list;

    if (this.listSettings && (this.listSettings.hasEnabledFilters || this.listSettings.search)) {

        // Retrieve text values of all columns for searching and filtering
        let pluckedList = list.map(item => {
            const pluckedObj = this.listSettings.getPluckedObject(item);
            // Preserve the original object, property start with $ will be ignored by filter
            pluckedObj.$originalItem = item;
            return pluckedObj;
        });

        // Filter on columns and update filters based on new list
        pluckedList = this.filterOnColumns(pluckedList, this.listSettings);

        // Search
        if (this.listSettings.search) {
            const keywords = this.listSettings.search.trim().toLowerCase().split(/\s+/);

            keywords.forEach(keyword => {
                pluckedList = pluckedList.filter(item => filterByProperty(item, keyword) ); // this.$filter("filter")(pluckedList, keyword);
            });
        }

        // Retrieve the original objects from filtered plucked object list
        list = pluckedList.map(pluckedObj => pluckedObj.$originalItem);
    }

    // Sort
    if (this.listSettings && !isEmpty(this.listSettings.sortPropertyPaths)) {
        list = sortByProperty(list,
                              this.listSettings.sortPropertyPaths,
                              this.listSettings.sortReverse);
    }

    return list;
}

  private filterOnColumns(pluckedList: any, listSettings: ListSettings): any {

    // Initialize the filter array, false indicate filtered, true indicate not filtered
    const filterMark: boolean[] = new Array(pluckedList.length);
    fill(filterMark, true);

    // Update each column filter values by scanning through the list and found out all unique values exist in current column
    listSettings.columnSettings.forEach((columnSetting: ListColumnSetting) => {
        if (!columnSetting.enableFilter) {
            return;
        }

        // If any filter value is unchecked, we need to filter on this column
        const hasEffectiveFilters = columnSetting.filterValues.some(filterValue => !filterValue.isChecked);
        const checkedValues = map(filter(columnSetting.filterValues, filterValue => filterValue.isChecked), 'value');

        // Update filter values in each column and filter the list at the same time
        columnSetting.filterValues =
            sortBy( // Sort alphabetically
                union( // Union with original filters, user may already set filter on them, should not overwrite
                    map( // Create new filters
                        filter( // Get rid of those values already in the filters
                            uniq( // Get all unique property values in current column
                                filter( // Get rid of empty values
                                    map( // Get all property values in current column
                                        pluckedList,
                                        (item, index) => {
                                            const targetPropertyTextValue = item[columnSetting.propertyPath];
                                            filterMark[index] = filterMark[index] // Not already filtered
                                                && (!hasEffectiveFilters // No effective filters
                                                    || !targetPropertyTextValue // Target value is empty, no filters apply
                                                    || includes(checkedValues, targetPropertyTextValue)); // The checked values include the target value
                                            return targetPropertyTextValue;
                                        }
                                    ),
                                    value => !isEmpty(value)
                                )
                            ),
                            value => every(columnSetting.filterValues, filterValue => filterValue.value !== value)
                        ),
                        value => new FilterValue(value)
                    ),
                    columnSetting.filterValues
                ),
                'value'
            );
    });

    pluckedList = filter(pluckedList, (item, index) => filterMark[index]);
    return pluckedList;
  }

  pageChange(newPage: number) {
    this.page = newPage;
  }

  updateList() {
    this.sortedFilteredList = this.getSortedFilteredList();
    this.debounceHandler.next(this.sortedFilteredList);
  }

  closeDropDown() {
    this.dropdowns.toArray().forEach(el => {
      el.close();
  });
  }

}

// TODO verify this works
const sortByProperty = (items: any[], propertyPath: string[], sortReverse: boolean): any[] => {
  // need to continually check each property in this list
  const direction = sortReverse ? 1 : -1;
  return items.sort( (a, b) => {
    let i = 0;

    while (i < propertyPath.length) {
      const aResult = Utils.result(a, propertyPath[i]);
      const bResult = Utils.result(b, propertyPath[i]);

      if (aResult !== bResult){
        return direction * ( aResult > bResult ? 1 : -1 );
      }

      i++;
    }

    return 0;
  });
};

const filterByProperty = (obj: any, filter: string): boolean => {
  return Object.keys(obj).some(property => {
    if (!property.startsWith('$')){
      const val = obj[property];
      return (val as string|number|boolean).toString().toLowerCase().includes(filter);
    }
  });
};

/* TODO
set up track by function for columnSettings
track by columnSetting.propertyPath

*/
