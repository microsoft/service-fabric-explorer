import { getAndTransform, IPropertyMapper, IRCAItem } from 'src/app/Models/eventstore/rcaEngine';
import { IAnalysisResultDiff, IDiffAnalysis, IDiffProperty } from 'src/app/Models/eventstore/rcaEngineConfigurations';
import { EventStoreUtils, ITimelineData, ITimelineItem } from 'src/app/Models/eventstore/timelineGenerators';
import { Transforms } from 'src/app/Utils/Transforms';
import { Utils } from 'src/app/Utils/Utils';
import { DataSet } from 'vis-data';
import { DataGroup } from 'vis-timeline';

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
    const timelineData = new propertyTracker(property, property.firstOnlyEvent ? items.slice(0,1) : items).generateItems(start, end);
    mergeTimelineData(result, timelineData);
  })

  result.groups.add({
    id: 'change event',
    content: 'change event'
  })

  items.forEach(item => {
    result.items.add({
      id: item.eventInstanceId,
      content: '',
      start: item.timeStamp,
      kind: item.kind,
      group: 'change event',
      title: EventStoreUtils.tooltipFormat(item.eventProperties, item.timeStamp),
      className: 'blue'
    });
  })

  if(config.group) {
    const majorGroup: DataGroup = {
      id: config.group,
      content: config.group,
      nestedGroups: []
    }
    result.groups.forEach(group => {
      majorGroup.nestedGroups.push(group.id);
    })
    result.groups.add(majorGroup);
  }

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
    let valuesLastChanged: Record<string, {event: IRCAItem, date: Date}> = {};

    let currentValues = this.getValues(this.states[0]) || [];
    if(Utils.isDefined(currentValues)) {
      currentValues.forEach(value => uniqueValues.add(value));
      currentValues.forEach(value => {
        valuesLastChanged[value] = {
          date: this.property.extendFromStart ? startDate : new Date(this.states[0].timeStamp),
          event: this.states[0]
        };
        if(this.property.firstOnlyEvent) {

        }
      })
    }


    this.states.slice(1).forEach(state => {
      const newValues = this.getValues(state);
      if(Utils.isDefined(newValues)) {
        this.getRemoved(currentValues, newValues).forEach(removedValue => {
          items.add(this.generateTimelineItem(removedValue, valuesLastChanged[removedValue].date, new Date(state.timeStamp)))
          delete valuesLastChanged[removedValue]
        })

        this.getAdded(currentValues, newValues).forEach(addedValue => {
          valuesLastChanged[addedValue] = {
            event: state,
            date: new Date(state.timeStamp)
          };
        })

        currentValues = newValues;
        currentValues.forEach(value => uniqueValues.add(value));
      }
    })

       Object.keys(valuesLastChanged).forEach(value => {
        const eventDate = valuesLastChanged[value].date;
        if(this.property.extendToEnd) {
          items.add(this.generateTimelineItem(value, eventDate, endDate))
        }else if(new Date(valuesLastChanged[value].event.timeStamp) !== eventDate){
          items.add(this.generateTimelineItem(value, eventDate, new Date(valuesLastChanged[value].event.timeStamp)))
        }
      })

    let groups: DataGroup[] = Array.from(uniqueValues).map(value => {
      return {
        id: value.toString(), content: value.toString()
      }
    })

    // console.log(items.map(item => item))
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
      border-radius: 5px;`
    }
  }

  getAdded(currentValues: any[], newValues: any[]) {
    return newValues.filter(item => !currentValues.includes(item))
  }

  getRemoved(currentValues: any[], newValues: any[]) {
    return currentValues.filter(item => !newValues.includes(item))
  }

  getValues(item: IRCAItem): any[] {
    const values = getAndTransform(item, this.property);
    if (values && this.property.delimiter) {
      return (values as string).split(this.property.delimiter);
    } else {
      return values as any[];
    }

  }
}
