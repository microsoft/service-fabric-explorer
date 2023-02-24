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
    const timelineData = generateItems(property, property.firstOnlyEvent ? items.slice(0,1) : items, start, end);
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
      className: 'blue',
      type: 'point'
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

const generateItems = ( property: IDiffProperty, states: IRCAItem[], startDate: Date, endDate: Date): ITimelineData => {
  if(states.length === 0) {
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

  let currentValues = getValues(states[0], property) || [];
  if(Utils.isDefined(currentValues)) {
    currentValues.forEach(value => uniqueValues.add(value));
    currentValues.forEach(value => {
      valuesLastChanged[value] = {
        date: property.extendFromStart ? startDate : new Date(states[0].timeStamp),
        event: states[0]
      };
    })
  }


  states.slice(1).forEach(state => {
    const newValues = getValues(state, property);
    console.log(newValues)
    if(Utils.isDefined(newValues)) {
      getRemoved(currentValues, newValues).forEach(removedValue => {
        console.log(removedValue)
        items.add(generatePeriodicTimelineItem(removedValue, valuesLastChanged[removedValue].date, new Date(state.timeStamp), property))
        delete valuesLastChanged[removedValue]
      })

      getAdded(currentValues, newValues).forEach(addedValue => {
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
      if(property.extendToEnd) {
        items.add(generatePeriodicTimelineItem(value, eventDate, endDate, property))
      }else if(new Date(valuesLastChanged[value].event.timeStamp) !== eventDate){
        items.add(generatePeriodicTimelineItem(value, eventDate, new Date(valuesLastChanged[value].event.timeStamp), property))
      }
    })

  let groups: DataGroup[] = Array.from(uniqueValues).map(value => {
    return {
      id: value.toString(), content: value.toString()
    }
  })

  return {
    start: startDate,
    end: endDate,
    groups: new DataSet<DataGroup>(groups),
    items,
  }
}

const generatePeriodicTimelineItem = (value: any, additionDate: Date, removalDate: Date, property:IDiffProperty): ITimelineItem => {
  return {
    kind: '',
    content: Transforms.getTransformations(property.displayTransforms || [], value.toString()),
    title:  EventStoreUtils.tooltipFormat({}, additionDate.toISOString(), removalDate.toISOString(), Transforms.getTransformations(property.displayTransforms || [], value.toString())),
    group: value.toString(),
    start: additionDate,
    end: removalDate,
    style:  EventStoreUtils.singleItemStyleOverride(Utils.randomColor(), 5)
  }
}

const getAdded = (currentValues: any[], newValues: any[]) => {
  return newValues.filter(item => !currentValues.includes(item))
}

const getRemoved = (currentValues: any[], newValues: any[]) => {
  return currentValues.filter(item => !newValues.includes(item))
}

const getValues = (item: IRCAItem, property:IDiffProperty): any[] => {
  const values = getAndTransform(item, property);
  if (values && property.delimiter) {
    return (values as string).split(property.delimiter);
  } else {
    return values as any[];
  }
}
