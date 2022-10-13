import { Component, Input, OnInit } from '@angular/core';
import { getAndTransform, IPropertyMapper, IRCAItem } from 'src/app/Models/eventstore/rcaEngine';
import { IAnalysisResultDiff, IDiffAnalysis, IDiffProperty } from 'src/app/Models/eventstore/rcaEngineConfigurations';
import { EventStoreUtils, ITimelineData, ITimelineItem } from 'src/app/Models/eventstore/timelineGenerators';
import { Transforms } from 'src/app/Utils/Transforms';
import { Utils } from 'src/app/Utils/Utils';
import { DataSet } from 'vis-data';
import { DataGroup } from 'vis-timeline';


//handle strings, numbers and arrays differently

@Component({
  selector: 'app-diff-viewer',
  templateUrl: './diff-viewer.component.html',
  styleUrls: ['./diff-viewer.component.scss']
})
export class DiffViewerComponent implements OnInit {

  @Input() diffResult: IAnalysisResultDiff;

  constructor() { }

  ngOnInit(): void {

  }

  generatePoints() {

    const columns: Record<string, Set<string>> = {};

    this.diffResult.config.properties.forEach(property => {
      columns[property.name] = new Set();
    })

    this.diffResult.events.forEach(event => {

    })
  }

}

export function mergeTimelineData(combinedData: ITimelineData, data: ITimelineData) {
  data.items.forEach(item => combinedData.items.add(item));

  data.groups.forEach(group => {
    if(!combinedData.groups.get(group.id)) {
      combinedData.groups.add(group)
    }
  });

  combinedData.potentiallyMissingEvents =
    combinedData.potentiallyMissingEvents || data.potentiallyMissingEvents;

  return combinedData;
}

export const generateTimelineData = (items: IRCAItem[], config: IDiffAnalysis, start: Date, end: Date): ITimelineData => {
  const result = {
    start,
    end,
    groups: new DataSet<DataGroup>(),
    items: new DataSet<ITimelineItem>(),
  };

  config.properties.forEach(property => {
    mergeTimelineData(result, new propertyTracker(property, items).generateItems(start, end));
  })

  result.groups.add({
    id: 'change event',
    content: 'change event'
  })

  items.forEach(item => {
    result.items.add({
      id: item.eventInstanceId,//`${eventIndex}---${event.eventInstanceId}`,
      content: '',
      start: item.timeStamp,
      kind: item.kind,
      group: 'change event',
      title: EventStoreUtils.tooltipFormat(item.eventProperties, item.timeStamp),
      className: 'blue'
    });
  })

  return result;
}

export class propertyTracker {
  constructor(public property: IDiffProperty, private states: IRCAItem[] = []) { }

  generateItems(startDate: Date, endDate: Date): ITimelineData {
    if(this.states.length === 0) {
      return {
        start: startDate,
        end: endDate,
        groups: new DataSet<DataGroup>(),
        items: new DataSet(),
      }
    }

    const items = new DataSet<ITimelineItem>();
    let uniqueValues = new Set();
    let valuesLastChanged: Record<string, Date> = {};

    let currentValues = this.getValues(this.states[0]) || [];
    if(Utils.isDefined(currentValues)) {
      currentValues.forEach(value => uniqueValues.add(value));
      currentValues.forEach(value => {
        valuesLastChanged[value] = startDate;
      })
    }


    this.states.slice(1).forEach(state => {
      const newValues = this.getValues(state);
      if(Utils.isDefined(newValues)) {
        console.log(newValues)
        this.getRemoved(currentValues, newValues).forEach(removedValue => {
          items.add(this.generateTimelineItem(removedValue, valuesLastChanged[removedValue], new Date(state.timeStamp)))
          delete valuesLastChanged[removedValue]
        })

        this.getAdded(currentValues, newValues).forEach(addedValue => {
          valuesLastChanged[addedValue] = new Date(state.timeStamp);
        })

        currentValues = newValues;
        currentValues.forEach(value => uniqueValues.add(value));
      }
    })

    console.log(valuesLastChanged)
    Object.keys(valuesLastChanged).forEach(value => {
      items.add(this.generateTimelineItem(value, valuesLastChanged[value], endDate))
    })

    const groups: DataGroup[] = Array.from(uniqueValues).map(value => {
      return {
        id: value.toString(), content: value.toString()
      }
    })

    console.log(items.map(item => item))
    return {
      start: startDate,
      end: endDate,
      groups: new DataSet<DataGroup>(groups),
      items,
    }
  }

  generateTimelineItem(value: any, additionDate: Date, removalDate: Date): ITimelineItem {
    return {
      kind: '',
      content: Transforms.getTransformations(this.property.displayTransforms || [], value.toString()),
      group: value.toString(),
      start: additionDate,
      end: removalDate,
      style: `border-color:${Utils.randomColor() };
      background-color:${Utils.randomColor()};
      border-width: 4px;
      border-style: solid;
      border-radius: 20px;`
    }
  }

  getAdded(currentValues: any[], newValues: any[]) {
    return newValues.filter(item => !currentValues.includes(item))
  }

  getRemoved(currentValues: any[], newValues: any[]) {
    return currentValues.filter(item => !newValues.includes(item))
  }

  getValues(item: IRCAItem): any[] {
    // console.log(item, this.property.property)
    const values = getAndTransform(item, this.property);
    console.log(item, values)
    if (values && this.property.delimiter) {
      return (values as string).split(this.property.delimiter);
    } else {
      return values as any[];
    }

  }
}
