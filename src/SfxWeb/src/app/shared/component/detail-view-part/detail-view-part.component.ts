import { Component, Input, OnChanges } from '@angular/core';
import { HtmlUtils } from 'src/app/Utils/HtmlUtils';
import { Constants } from 'src/app/Common/Constants';
import { Utils } from 'src/app/Utils/Utils';
import { ITextAndBadge, ValueResolver } from 'src/app/Utils/ValueResolver';
import size from 'lodash/size';
import forOwn from 'lodash/forOwn';
import startCase from 'lodash/startCase';
import camelCase from 'lodash/camelCase';
import isNumber from 'lodash/isNumber';
import isBoolean from 'lodash/isBoolean';
import isUndefined from 'lodash/isUndefined';
import isNull from 'lodash/isNull';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import first from 'lodash/first';

export class ResolvedObject {
  [index: string]: any;
}

@Component({
  selector: 'app-detail-view-part',
  templateUrl: './detail-view-part.component.html',
  styleUrls: ['./detail-view-part.component.scss']
})
export class DetailViewPartComponent implements OnChanges {

  @Input() noFixedLayout = false;

  resolvedData: any;

  @Input() data: any;
  @Input() title: string;
  // with parent added it will assume data is from data.raw and this allows to run change detection.
  @Input() parent: any;
  constructor() { }

  ngOnChanges() {
      if (this.parent){
        this.resolvedData = this.getResolvedDataObjectInternal(this.data, this.parent);
      }else{
        this.resolvedData = this.getResolvedDataObject(this.data);
      }
  }

  public getResolvedObjectSize(object: any): number {
    return size(object);
    }

  public getResolvedPropertyType(value: any): string {
    if(ValueResolver.isHealthBadgeForDetailView(value) ){
      return 'HealthState';
    }else if (this.isResolvedObject(value)) {
        return 'Object';
    } else if (this.isArray(value)) {
        return 'Array';
    } else if (this.isISODate(value)) {
        return 'Date';
    }else{
      return 'Value'
    }
  }

    public getResolvedDataObject(data: any, preserveEmptyProperties: boolean = false): any {
        if (!data) {
            return null;
        }

        if (data instanceof ResolvedObject) {
            return data;
        }

        if (data.hasOwnProperty('raw')) {
            if (data.raw === undefined || data.raw === null) {
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
        return Array.isArray(value);
    }

    private isISODate(value: any): boolean {
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);
    }

    private getResolvedDataObjectInternal(data: any, parent: any, preserveEmptyProperties: boolean = false): ResolvedObject {
      const resolvedObject = new ResolvedObject();

      forOwn(data, (value, name) => {
          let resolvedName = startCase(name);
          let resolvedValue = null;

          // Use decorator to resolve value if defined
          if (parent && parent.decorators) {
              if (parent.decorators.showList && ! parent.decorators.showList.includes(name)) {
                  // If a showList is defined, use it to filter the object properties
                  return;
              } else if (parent.decorators.hideList && parent.decorators.hideList.includes(name)) {
                  // If a hideList is defined, use it to filter the object properties
                  return;
              }

              // If a decorator is defined for current property, use it
              if (parent.decorators.decorators && parent.decorators.decorators[name]) {
                  if (parent.decorators.decorators[name].displayName) {
                      resolvedName = parent.decorators.decorators[name].displayName(name);
                  }
                  if (parent.decorators.decorators[name].displayValueInHtml) {
                      resolvedValue = parent.decorators.decorators[name].displayValue(value);
                  }
              }
          }

          if (!resolvedValue) {
              // Try to look for the same property defined in parent object
              if (parent) {
                  resolvedValue = parent[name] || parent[camelCase(name)];
              }

              // Fall back to the original value
              if (!resolvedValue) {
                  resolvedValue = data[name];
              }
          }

          if (isNumber(resolvedValue) || isBoolean(resolvedValue)) {
              // Number and Boolean are always preserved
          } else if (isUndefined(resolvedValue) || isNull(resolvedValue) || isEmpty(resolvedValue)) {
              if (preserveEmptyProperties) {
                  resolvedValue = Constants.Empty;
              } else {
                  // Remove all empty/undefined/null value properties
                  resolvedValue = null;
              }
          } else if (Array.isArray(resolvedValue)) {
              if (!isObject(first(resolvedValue))) {
                  // The first element in the array is not an object, assume all the elements are value types
                  resolvedValue = `[${resolvedValue.map(v => v.toString()).join(', ')}]`;
              } else {
                  // Resolve sub-array, for array, all properties are preserved unless filtered by showList/hideList
                  resolvedValue = resolvedValue.map(v => this.getResolvedDataObject(v, true));
              }
          } else if (isObject(resolvedValue)) {
                  // Resolve sub-object
                  resolvedValue = this.getResolvedDataObject(resolvedValue);
          }

          if (isEmpty(resolvedName)) {
              resolvedName = Constants.Empty;
          }

          if (resolvedValue !== null) {
              resolvedObject[resolvedName] = resolvedValue;
          }
      });

      return size(resolvedObject) > 0 ? resolvedObject : null;
  }

  asIsOrder(a: any, b: any): number {
    return 1;
  }

}
