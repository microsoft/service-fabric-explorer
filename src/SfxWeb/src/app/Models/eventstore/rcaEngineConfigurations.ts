import { IPropertyMapper, IPropertyMapping, IRCAItem, ITransform,  } from "./rcaEngine";

//base analysis
export type AnalysisVisualization = "rca" | "diff" | "timeseries";
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
  delimiter?: string;
  name: string;
  displayTransforms?: ITransform[]; //format how an item will be displayed on the timeline. does NOT format the axis value
  group?: IPropertyMapper; //by default uses the value of the diffed property. i.e if a list is split 1,2,3 it would have groups 1,2,3
}

export interface IDiffAnalysis extends IAanalysis {
  //TODO consider adding config to allow joined timelines or not
  properties: IDiffProperty[];
  propertyMappings: IPropertyMapping[];
}

export interface IAnalysisResultDiff extends IAnalysisResult {
  config: IDiffAnalysis;
  events: IRCAItem[];
}


//RCA tool

