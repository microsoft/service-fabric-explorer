import { IPropertyMapper, IPropertyMapping, IRCAItem, ITransform,  } from "./rcaEngine";

//base analysis
export type AnalysisVisualization = "rca" | "diff";
export interface IAanalysis {
  type: AnalysisVisualization;
  name?: string;
  eventType: string;
}

export interface IAnalysisResult {
  config: IAanalysis;
}

//Differ - specific property to show difference over time for
export interface IDiffProperty extends IPropertyMapper {
  delimiter?: string; //if a list property show the
  name: string; //display name of property showing changed
  displayTransforms?: ITransform[]; //format how an item will be displayed on the timeline. does NOT format the axis value
  group?: IPropertyMapper; //by default uses the value of the diffed property. i.e if a list is split 1,2,3 it would have groups 1,2,3
  extendToEnd?: boolean;
  extendFromStart?: boolean;
  firstOnlyEvent?: boolean;
}

export interface IDiffAnalysis extends IAanalysis {
  properties: IDiffProperty[];
  propertyMappings: IPropertyMapping[];
  group?: string; //grouping to use when adding to the timeline.
}

export interface IAnalysisResultDiff extends IAnalysisResult {
  config: IDiffAnalysis;
  events: IRCAItem[];
}


//RCA tool

