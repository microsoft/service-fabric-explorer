import { ChartConfiguration } from "./chartConfig.interface";

export interface ChartComponent {
  configuration: ChartConfiguration;
  setData(any);
  validateData(any): string;
  // data: any[];
}
