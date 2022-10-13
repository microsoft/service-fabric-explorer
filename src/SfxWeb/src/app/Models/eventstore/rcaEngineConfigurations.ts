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

//Differ
export interface IDiffProperty extends IPropertyMapper {
  delimiter?: string;
  name: string;
  displayTransforms?: ITransform[]; //format how an item will be displayed on the timeline. does NOT format the axis value
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

