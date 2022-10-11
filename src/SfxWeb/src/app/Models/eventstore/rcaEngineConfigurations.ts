import { IPropertyMapper, IPropertyMapping,  } from "./rcaEngine";

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
}

export interface IDiffAnalysis extends IAanalysis {
  properties: IDiffProperty[];
  propertyMappings: IPropertyMapping[];
}

export interface IAnalysisResultDiff extends IAnalysisResult {
  events: any[];
}


//RCA tool

